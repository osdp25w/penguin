/* ------------------------------------------------------------------
 *  警報中心 Store（中文版，含計畫書溫度規則）
 * ---------------------------------------------------------------- */
import { defineStore } from 'pinia'
import type { Alert } from '@/types'
import { AlertListSchema } from '@/types/alert'

/* === 計畫書警戒閾值 ============================================= */
const CONTROLLER_OVERHEAT       = 90  // 控制器溫度 °C
const BATTERY_DISCHG_OVERHEAT   = 60  // 電池放電溫度 °C
const BATTERY_CHG_OVERHEAT      = 45  // 電池充電溫度 °C

export const useAlerts = defineStore('alerts', {
  state: () => ({
    isLive   : false,         // WebSocket 是否連線中
    isLoading: false,         // API 載入中
    errMsg   : '',            // 錯誤訊息
    list     : [] as Alert[],  // 警報清單
    // Site-based alerts for map
    bySite: {} as Record<string, Alert[]>,
    loadingBySite: {} as Record<string, boolean>,
    errorBySite: {} as Record<string, string | null>
  }),

  actions: {
    /* 讀取所有「未關閉」警報 ------------------------------------ */
    async fetchOpen () {
      try {
        this.isLoading = true
        this.errMsg = ''
        
        const res = await fetch('/api/v1/alerts?resolved=false')
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }
        
        const ct = res.headers.get('content-type') || ''
        if (!ct.includes('application/json')) throw new Error('非 JSON 回應（可能是路由或代理設定問題）')
        const data = await res.json()
        this.list = AlertListSchema.parse(data)
      } catch (e: any) {
        console.error('Alerts fetch error:', e)
        this.errMsg = e.message ?? '警報載入失敗'
        // 後備：若啟用 mock，直接使用本地生成資料（在非安全來源或子路徑時 Service Worker 可能無法啟動）
        try {
          if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
            const mod = await import('@/mocks/handlers/alerts')
            if (mod?.getDemoAlerts) {
              this.list = mod.getDemoAlerts('open')
              this.errMsg = ''
            }
          }
        } catch {}
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
      await fetch(`/api/v1/alerts/${id}`, {
        method : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ state: 'closed' })
      })
      // 前端同步移除
      this.list = this.list.filter(a => a.id !== id)

      // 再次抓取，保險起見與後端對齊
      this.fetchOpen()
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

    /** Fetch alerts by site ID */
    async fetchBySiteSince(siteId: string, since?: string) {
      if (!siteId) return
      
      this.loadingBySite[siteId] = true
      this.errorBySite[siteId] = null
      
      try {
        const params = new URLSearchParams({ siteId })
        if (since) params.append('since', since)
        
        const response = await fetch(`/api/v1/alerts?${params}`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const data = await response.json()
        this.bySite[siteId] = AlertListSchema.parse(data)
      } catch (err: any) {
        this.errorBySite[siteId] = err.message || 'Unknown error'
        this.bySite[siteId] = []
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
    }
  }
})
