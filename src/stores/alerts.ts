/* ------------------------------------------------------------------
 *  警報中心 Store（中文版，含計畫書溫度規則）
 * ---------------------------------------------------------------- */
import { defineStore } from 'pinia'
import type { Alert } from '@/types'

/* === 計畫書警戒閾值 ============================================= */
const CONTROLLER_OVERHEAT       = 90  // 控制器溫度 °C
const BATTERY_DISCHG_OVERHEAT   = 60  // 電池放電溫度 °C
const BATTERY_CHG_OVERHEAT      = 45  // 電池充電溫度 °C

export const useAlerts = defineStore('alerts', {
  state: () => ({
    isLive   : false,         // WebSocket 是否連線中
    isLoading: false,         // API 載入中
    errMsg   : '',            // 錯誤訊息
    usingMock: false as boolean,
    list     : [] as Alert[],  // 警報清單
    // Site-based alerts for map
    bySite: {} as Record<string, Alert[]>,
    loadingBySite: {} as Record<string, boolean>,
    errorBySite: {} as Record<string, string | null>
  }),

  actions: {
    _buildDummyAlerts(kind: 'open' | 'all' = 'open'): Alert[] {
      const now = Date.now()
      const mk = (i:number, sev: Alert['severity'], msg: string): Alert => ({
        id: `AL-${String(i+1).padStart(3,'0')}`,
        siteId: i%2? 'site-002':'site-001',
        vehicleId: `KU-DMO-${String((i%12)+1).padStart(3,'0')}`,
        type: sev === 'critical' ? 'battery_temperature' : 'temperature_alert',
        message: msg,
        severity: sev,
        resolved: false,
        createdAt: new Date(now - i*3600_000).toISOString()
      })
      const arr: Alert[] = [
        mk(0,'critical','控制器溫度過高 (95°C ≥ 90°C)'),
        mk(1,'warning','電池溫度偏高 (45°C)'),
        mk(2,'info','信號弱，請留意連線品質'),
        mk(3,'warning','電壓偏低，建議回站充電'),
        mk(4,'critical','控制器温度過高 (92°C ≥ 90°C)'),
        mk(5,'info','GPS訊號異常，衣星數量過少')
      ]
      return kind==='open' ? arr.filter(a => !a.resolved) : arr
    },
    /* 讀取所有「未關閉」警報 - 嘗試真實 API 或使用假資料 ------------------------------------ */
    async fetchOpen () {
      this.isLoading = true
      this.errMsg = ''
      try {
        // 嘗試調用真實 API
        try {
          const { http } = await import('@/lib/api')
          const response = await http.get('/api/bike/error-log-status/?is_read=false&limit=50')

          if (response && response.code === 2000) {
            const results = response.data?.results || response.data || []
            console.log('[Alerts] API response received:', { count: results.length })

            // 轉換 API 資料格式到前端格式
            const alerts: Alert[] = results.map((item: any) => {
              const errorLog = item.error_log || item
              const bike = errorLog.bike || {}

              return {
                id: String(item.id || Math.random()),
                siteId: bike.site_id || 'unknown',
                vehicleId: bike.bike_id || bike.bike_name || 'unknown',
                type: this._mapApiErrorType(errorLog.code || 'unknown'),
                message: errorLog.title || errorLog.detail || '未知警報',
                description: errorLog.detail || undefined,
                severity: this._mapApiLevel(errorLog.level || 'info'),
                resolved: item.is_read || false,
                createdAt: errorLog.created_at || new Date().toISOString(),
                resolvedAt: item.read_at || undefined
              }
            })

            this.list = alerts
            this.errMsg = ''
            this.usingMock = false
            console.log('[Alerts] Processed alerts:', alerts.length)
            return
          }
        } catch (apiError) {
          console.warn('調用真實 API 失敗，使用假資料:', apiError)
        }

        // API 失敗時使用假資料
        this.list = this._buildDummyAlerts('open')
        this.usingMock = true
      } catch (e: any) {
        console.error('載入警報資料失敗:', e)
        this.errMsg = '警報載入失敗'
        this.list = []
      } finally {
        this.isLoading = false
      }
    },

    /* 啟動 WebSocket，接收警報或感測數據 ------------------------ */
    startStream () {
      if (this.isLive) return
      const ws = new WebSocket('ws://localhost:5173/stream/alerts')

      ws.onmessage = (evt) => {
        const payload = JSON.parse(evt.data)

        // ① 後端直接推送 Alert 物件
        if (payload?.id && payload?.severity) {
          this.list.unshift(payload as Alert)
          return
        }

        // ② 感測數據 → 判斷是否觸發警報
        const generated = this._genAlertsFromSensor(payload)
        generated.forEach(a => this.list.unshift(a))
      }

      ws.onopen  = () => (this.isLive = true)
      ws.onclose = () => (this.isLive = false)
    },

    /* 關閉 / 確認單筆警報 --------------------------------------- */
    async acknowledge (id: string) {
      try {
        // 嘗試調用真實 API 標記為已讀
        try {
          const { http } = await import('@/lib/api')
          await http.patch(`/api/bike/error-log-status/${id}/`, { is_read: true })
          console.log('[Alerts] Alert marked as read via API:', id)
        } catch (apiError) {
          console.warn('調用確認警報 API 失敗，使用本地操作:', apiError)
        }

        // 無論 API 是否成功，都在前端移除該警報
        this.list = this.list.filter(a => a.id !== id)

        // 或者標記為已解決而不移除（根據需求選擇）
        // const alert = this.list.find(a => a.id === id)
        // if (alert) {
        //   alert.resolved = true
        //   alert.resolvedAt = new Date().toISOString()
        // }
      } catch (error) {
        console.error('確認警報失敗:', error)
        this.errMsg = '確認警報失敗'
      }
    },

    /* === 私有：由感測數據判斷是否生成警報 ==================== */
    _genAlertsFromSensor (data: any): Alert[] {
      const alerts: Alert[] = []
      const createdAt = new Date().toISOString()

      /* 控制器溫度 ------------------------------------------- */
      if (typeof data.controllerTemp === 'number' &&
          data.controllerTemp >= CONTROLLER_OVERHEAT) {
        alerts.push({
          id        : crypto.randomUUID(),
          siteId    : data.siteId ?? 'unknown',
          vehicleId : data.vehicleId ?? '未知車輛',
          type      : 'temperature_alert',
          message   : `控制器溫度過高 (${data.controllerTemp} °C ≥ ${CONTROLLER_OVERHEAT} °C)`,
          severity  : 'critical',
          resolved  : false,
          createdAt
        })
      }

      /* 電池放電溫度 ----------------------------------------- */
      if (data.battState === 'discharging' &&
          typeof data.battTemp === 'number' &&
          data.battTemp >= BATTERY_DISCHG_OVERHEAT) {
        alerts.push({
          id        : crypto.randomUUID(),
          siteId    : data.siteId ?? 'unknown',
          vehicleId : data.vehicleId ?? '未知車輛',
          type      : 'battery_temperature',
          message   : `電池放電溫度過高 (${data.battTemp} °C ≥ ${BATTERY_DISCHG_OVERHEAT} °C)`,
          severity  : 'critical',
          resolved  : false,
          createdAt
        })
      }

      /* 電池充電溫度 ----------------------------------------- */
      if (data.battState === 'charging' &&
          typeof data.battTemp === 'number' &&
          data.battTemp >= BATTERY_CHG_OVERHEAT) {
        alerts.push({
          id        : crypto.randomUUID(),
          siteId    : data.siteId ?? 'unknown',
          vehicleId : data.vehicleId ?? '未知車輛',
          type      : 'battery_temperature',
          message   : `電池充電溫度過高 (${data.battTemp} °C ≥ ${BATTERY_CHG_OVERHEAT} °C)`,
          severity  : 'critical',
          resolved  : false,
          createdAt
        })
      }

      return alerts
    },

    /** Fetch alerts by site ID - 嘗試真實 API 或使用假資料 */
    async fetchBySiteSince(siteId: string, since?: string) {
      if (!siteId) return
      this.loadingBySite[siteId] = true
      this.errorBySite[siteId] = null

      try {
        // 嘗試調用真實 API
        try {
          const { http } = await import('@/lib/api')
          let url = '/api/bike/error-log-status/?is_read=false'
          if (since) url += `&created_at__gte=${since}`

          const response = await http.get(url)

          if (response && response.code === 2000) {
            const results = response.data?.results || response.data || []

            // 過濾指定站點的警報
            const siteAlerts = results
              .filter((item: any) => {
                const bike = item.error_log?.bike || {}
                return bike.site_id === siteId
              })
              .map((item: any) => {
                const errorLog = item.error_log || item
                const bike = errorLog.bike || {}

                return {
                  id: String(item.id || Math.random()),
                  siteId: bike.site_id || siteId,
                  vehicleId: bike.bike_id || bike.bike_name || 'unknown',
                  type: this._mapApiErrorType(errorLog.code || 'unknown'),
                  message: errorLog.title || errorLog.detail || '未知警報',
                  description: errorLog.detail || undefined,
                  severity: this._mapApiLevel(errorLog.level || 'info'),
                  resolved: item.is_read || false,
                  createdAt: errorLog.created_at || new Date().toISOString(),
                  resolvedAt: item.read_at || undefined
                }
              })

            this.bySite[siteId] = siteAlerts
            this.errorBySite[siteId] = null
            return
          }
        } catch (apiError) {
          console.warn('調用站點警報 API 失敗，使用假資料:', apiError)
        }

        // API 失敗時使用假資料
        this.bySite[siteId] = this._buildDummyAlerts('open').filter(a => a.siteId === siteId)
      } catch (e) {
        this.bySite[siteId] = []
        this.errorBySite[siteId] = '載入站點警報資料失敗'
      } finally {
        this.loadingBySite[siteId] = false
      }
    },

    /** Get alerts by site ID */
    getAlertsBySite(siteId: string): Alert[] {
      return this.bySite[siteId] || []
    },

    /** Get recent alerts by site ID */
    getRecentAlertsBySite(siteId: string, limit = 5): Alert[] {
      const alerts = this.getAlertsBySite(siteId)
      return alerts
        .filter(alert => !alert.resolved)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
    },

    /** Check if site alerts are loading */
    isLoadingBySite(siteId: string): boolean {
      return this.loadingBySite[siteId] || false
    },

    /** Get error for site alerts */
    getErrorBySite(siteId: string): string | null {
      return this.errorBySite[siteId] || null
    },

    /** 映射 API 錯誤級別到前端嚴重程度 */
    _mapApiLevel(apiLevel: string): Alert['severity'] {
      const levelMap: Record<string, Alert['severity']> = {
        'info': 'info',
        'warning': 'warning',
        'error': 'error',
        'critical': 'critical'
      }
      return levelMap[apiLevel] || 'info'
    },

    /** 映射 API 錯誤代碼到前端類型 */
    _mapApiErrorType(apiCode: string): string {
      const typeMap: Record<string, string> = {
        'battery_level:critical': 'battery_critical',
        'battery_level:warning': 'battery_warning',
        'gps_signal:info': 'gps_signal',
        'controller_temp:critical': 'temperature_alert',
        'battery_temp:critical': 'battery_temperature',
        'connection:error': 'connection_error'
      }
      return typeMap[apiCode] || 'general'
    },

    /** 分頁獲取警報資料 (支援篩選) - 嘗試真實 API 或使用假資料 */
    async fetchAlertsPaged(params?: {
      limit?: number;
      offset?: number;
      level?: string;
      is_read?: boolean;
    }): Promise<{ data: Alert[]; total: number }> {
      const {
        limit = 20,
        offset = 0,
        ...filterParams
      } = params || {}

      this.isLoading = true
      try {
        // 嘗試調用真實的 API
        try {
          const { http } = await import('@/lib/api')

          // 構建查詢參數
          const queryParams = new URLSearchParams({
            limit: String(limit),
            offset: String(offset)
          })

          // 添加篩選參數
          if (filterParams.level) queryParams.append('level', filterParams.level)
          if (filterParams.is_read !== undefined) queryParams.append('is_read', String(filterParams.is_read))

          const response = await http.get(`/api/bike/error-log-status/?${queryParams}`)

          // 檢查 API 回應格式 (Koala API 包裝結構)
          if (response && response.code === 2000 && response.data) {
            const dataSection = response.data
            const results = dataSection.results || []
            const total = dataSection.count || results.length

            console.log('[Alerts] API response received:', { total, resultsCount: results.length })

            // 轉換 API 資料格式到前端格式
            const alerts: Alert[] = results.map((item: any) => {
              const errorLog = item.error_log || item
              const bike = errorLog.bike || {}

              return {
                id: String(item.id || Math.random()),
                siteId: bike.site_id || 'unknown',
                vehicleId: bike.bike_id || bike.bike_name || 'unknown',
                type: this._mapApiErrorType(errorLog.code || 'unknown'),
                message: errorLog.title || errorLog.detail || '未知警報',
                description: errorLog.detail || undefined,
                severity: this._mapApiLevel(errorLog.level || 'info'),
                resolved: item.is_read || false,
                createdAt: errorLog.created_at || new Date().toISOString(),
                resolvedAt: item.read_at || undefined
              }
            })

            console.log('[Alerts] Processed alerts:', alerts.length, alerts.slice(0, 2))

            this.errMsg = ''
            this.usingMock = false

            return {
              data: alerts,
              total
            }
          }
        } catch (apiError) {
          console.warn('調用真實 API 失敗，使用假資料:', apiError)
        }

        // API 失敗時使用假資料
        const allData = this._buildDummyAlerts('all')
        const total = allData.length
        const data = allData.slice(offset, offset + limit)

        this.errMsg = ''
        this.usingMock = true

        return { data, total }
      } catch (err: any) {
        console.error('載入分頁警報資料失敗:', err)
        this.errMsg = '獲取警報列表失敗'
        return { data: [], total: 0 }
      } finally {
        this.isLoading = false
      }
    }
  }
})
