// src/stores/vehicles.ts
import { defineStore } from 'pinia'
import type { Vehicle } from '@/types'
// import { VehicleListSchema } from '@/types/vehicle' // 暫時移除驗證

const DEFAULT_PAGE_SIZE = 20

export const useVehicles = defineStore('vehicles', {
  state: () => ({
    loading : false as boolean,
    errMsg  : '' as string,
    usingMock: false as boolean,
    items   : [] as Vehicle[], // Legacy items for pagination
    vehicles: [] as Vehicle[], // New vehicles array for general use
    page    : 1 as number,
    total   : 0 as number,
    pageSize: DEFAULT_PAGE_SIZE as number,
    // Site-based vehicle storage for map
    bySite: {} as Record<string, Vehicle[]>,
    loadingBySite: {} as Record<string, boolean>,
    errorBySite: {} as Record<string, string | null>
  }),

  getters: {
    totalPages: (state) => Math.ceil(state.total / state.pageSize)
  },

  actions: {
    /** 產生固定的假資料（不依賴 mocks） */
    _buildDummyVehicles(count = 24, params?: { siteId?: string; keyword?: string; status?: string; soh_lt?: number; lowBattery?: boolean }): Vehicle[] {
      const out: Vehicle[] = []
      const idPrefix = 'KU-DMO'
      for (let i = 0; i < count; i++) {
        // 創造一些低電量車輛用於測試
        const pct = i < count / 4 ? (5 + (i * 3) % 15) : 20 + ((i * 7) % 80) // 前25%是低電量(5-19%)，其餘20-99%
        const stPool: Vehicle['status'][] = ['available', 'in-use', 'maintenance', 'low-battery']
        const status = stPool[i % stPool.length]
        const id = `${idPrefix}-${String(i + 1).padStart(3, '0')}`
        const site = params?.siteId || (i % 3 === 0 ? 'site-001' : i % 3 === 1 ? 'site-002' : 'site-003')
        const v: Vehicle = {
          id,
          name: `示範車輛-${i + 1}`,
          batteryLevel: pct,
          batteryPct: pct,
          status,
          siteId: site,
          lat: 23.99 + (i % 8) * 0.003 + (i % 2 ? 0.0005 : -0.0005),
          lon: 121.60 + (i % 8) * 0.003 + (i % 3 ? 0.0003 : -0.0003),
          mqttStatus: (i % 5 !== 0) ? 'online' : 'offline',
          lastSeen: new Date(Date.now() - (i % 10) * 60_000).toISOString(),
          soh: 65 + (i % 35)
        }
        out.push(v)
      }
      // 簡易篩選
      let arr = out
      if (params?.siteId) arr = arr.filter(v => v.siteId === params.siteId)
      if (params?.status && params.status !== 'low-battery') {
        // 如果選擇的不是 low-battery 狀態，就按照原狀態篩選
        arr = arr.filter(v => v.status === params.status)
      }
      if (params?.keyword) {
        const kw = params.keyword.toLowerCase()
        arr = arr.filter(v => v.id.toLowerCase().includes(kw) || (v.name || '').toLowerCase().includes(kw))
      }
      if (params?.soh_lt != null) arr = arr.filter(v => (v.soh || 0) < Number(params.soh_lt))

      // 低電量篩選 (這是前端過濾，不影響狀態)
      if (params?.lowBattery) {
        const threshold = 20 // 低電量門檻值
        arr = arr.filter(v => (v.batteryLevel || v.batteryPct || 0) < threshold)
      }

      return arr
    },
    /** 分頁抓取（改為固定假資料） */
    async fetchPage({ page = 1, size = DEFAULT_PAGE_SIZE } = {}) {
      this.loading = true
      try {
        const data = this._buildDummyVehicles(48)
        this.items = data.slice((page - 1) * size, page * size)
        this.total = data.length
        this.page = page
        this.pageSize = size
        this.errMsg = ''
        this.usingMock = true
      } catch (e: any) {
        console.error('載入車輛假資料失敗:', e)
        this.errMsg = '取得車輛清單失敗（假資料）'
        this.items = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },

    /** 為兼容呼叫 */
    async fetch(page = 1) {
      return this.fetchPage({ page })
    },

    /** 更新現有車輛（假 API） */
    async updateDevice(v: Vehicle) {
      const idx = this.items.findIndex(x => x.id === v.id)
      if (idx !== -1) {
        this.items[idx] = v
      }
    },

    /** 新增車輛 - 嘗試真實 API 或使用假資料 */
    async createVehicle(v: Vehicle & { seriesId?: number | string; telemetryImei?: string | null }) {
      try {
        // 嘗試調用真實 API
        const { http } = await import('@/lib/api')

        const payload = {
          bike_id: v.id,
          bike_name: v.name,
          bike_model: (v as any).model || v.name || 'E-Bike',
          series: v.seriesId ?? 1, // 系列
          telemetry_device_imei: v.telemetryImei || undefined,
          site_id: v.siteId || null,
          // 其他需要的欄位可以在這裡添加
        }

        const response = await http.post('/api/bike/bikes/', payload)

        if (response && response.bike_id) {
          // API 成功，更新本地狀態
          this.items.unshift(v)
          this.vehicles.unshift(v)
          this.total = Math.max(this.total + 1, this.items.length)

          // 依 siteId 放入對應站點（若有）
          if (v.siteId) {
            const arr = this.bySite[v.siteId] || []
            this.bySite[v.siteId] = [v, ...arr.filter(x => x.id !== v.id)]
          }

          console.log('車輛創建成功 (API):', response.bike_id)
          return response
        }
      } catch (error) {
        console.warn('調用創建車輛 API 失敗，使用本地模式:', error)
      }

      // API 失敗時的本地操作
      // 去重：若已存在相同 ID，先移除舊的
      this.items = this.items.filter(x => x.id !== v.id)
      this.vehicles = this.vehicles.filter(x => x.id !== v.id)

      // 新車輛加入清單頂部
      this.items.unshift(v)
      this.vehicles.unshift(v)
      this.total = Math.max(this.total + 1, this.items.length)

      // 依 siteId 放入對應站點（若有）
      if (v.siteId) {
        const arr = this.bySite[v.siteId] || []
        this.bySite[v.siteId] = [v, ...arr.filter(x => x.id !== v.id)]
      }

      console.log('車輛創建成功 (本地):', v.id)
    },

    async fetchVehicleDetail(id: string): Promise<Vehicle | null> {
      if (!id) return null
      try {
        const { http } = await import('@/lib/api')
        const res: any = await http.get(`/api/bike/bikes/${id}/`)
        const data = res?.data ?? res
        if (!data) return null
        const vehicle = this._normalizeBikeDetail(data)
        this._mergeVehicle(vehicle)
        return vehicle
      } catch (error) {
        console.error('取得車輛詳情失敗:', error)
        this.errMsg = '取得車輛詳情失敗'
        return null
      }
    },

    async updateVehicleInfo(id: string, patch: Record<string, any>): Promise<Vehicle | null> {
      if (!id) return null
      try {
        const { http } = await import('@/lib/api')
        const res: any = await http.patch(`/api/bike/bikes/${id}/`, patch)
        const data = res?.data ?? res
        if (!data) return null
        const vehicle = this._normalizeBikeDetail(data)
        this._mergeVehicle(vehicle)
        return vehicle
      } catch (error) {
        console.error('更新車輛資訊失敗:', error)
        this.errMsg = '更新車輛資訊失敗'
        throw error
      }
    },

    async removeVehicle(id: string): Promise<boolean> {
      if (!id) return false
      try {
        const { http } = await import('@/lib/api')
        const res: any = await http.del(`/api/bike/bikes/${id}/`)
        const code = res?.code
        if (code && code !== 2000 && code !== 2001 && code !== 4002) {
          console.warn('[removeVehicle] Unexpected response:', res)
        }
        this._removeVehicleFromCollections(id)
        return true
      } catch (error) {
        console.error('刪除車輛失敗:', error)
        this.errMsg = '刪除車輛失敗'
        throw error
      }
    },

    /** Fetch vehicles by site ID for map */
    async fetchBySite(siteId: string) {
      if (!siteId) return
      
      this.loadingBySite[siteId] = true
      this.errorBySite[siteId] = null
      
      try {
        const mod = await import('@/mocks/handlers/vehicles')
        this.bySite[siteId] = mod?.getDemoVehiclesList ? (mod.getDemoVehiclesList({ siteId }) as any) : []
        this.errorBySite[siteId] = null
      } catch (err: any) {
        this.bySite[siteId] = []
        this.errorBySite[siteId] = '載入站點車輛假資料失敗'
      } finally {
        this.loadingBySite[siteId] = false
      }
    },

    /** Get vehicles by site ID */
    getVehiclesBySite(siteId: string): Vehicle[] {
      return this.bySite[siteId] || []
    },

    /** Check if site vehicles are loading */
    isLoadingBySite(siteId: string): boolean {
      return this.loadingBySite[siteId] || false
    },

    /** Get error for site vehicles */
    getErrorBySite(siteId: string): string | null {
      return this.errorBySite[siteId] || null
    },

    /** 獲取所有車輛 (支援篩選和搜尋) - 固定假資料 */
    async fetchVehicles(params?: {
      siteId?: string;
      keyword?: string;
      status?: string;
      soh_lt?: number;
      lowBattery?: boolean;
    }) {
      this.loading = true
      try {
        this.vehicles = this._buildDummyVehicles(48, params)
        this.errMsg = ''
        this.usingMock = true
      } catch (err: any) {
        console.error('載入車輛假資料失敗:', err)
        this.vehicles = []
        this.errMsg = '獲取車輛列表失敗（假資料）'
      } finally {
        this.loading = false
      }
    },

    /** 分頁獲取車輛資料 (支援篩選) - 嘗試真實 API 或使用假資料 */
    async fetchVehiclesPaged(params?: {
      limit?: number;
      offset?: number;
      siteId?: string;
      keyword?: string;
      status?: string;
      soh_lt?: number;
      lowBattery?: boolean;
    }): Promise<{ data: Vehicle[]; total: number }> {
      const {
        limit = 20,
        offset = 0,
        ...filterParams
      } = params || {}

      this.loading = true
      try {
        // 嘗試調用真實的 API
        try {
          const { http } = await import('@/lib/api')

          // 構建查詢參數
          const queryParams = new URLSearchParams({
            limit: String(limit),
            offset: String(offset)
          })

          // 添加篩選參數 (如果後端支援)
          if (filterParams.siteId) queryParams.append('site_id', filterParams.siteId)
          if (filterParams.keyword) queryParams.append('search', filterParams.keyword)
          if (filterParams.status && filterParams.status !== 'low-battery') {
            queryParams.append('status', filterParams.status)
          }

          // 調用車輛即時狀態 API (根據 Postman collection)
          const response = await http.get(`/api/bike/realtime-status/?${queryParams}`)

          // 檢查 API 回應格式 (Koala API 包裝結構)
          if (response && response.code === 2000 && response.data) {
            const dataSection = response.data
            const results = dataSection.results || []
            const total = dataSection.count || results.length

            console.log('[Vehicles] API response received:', { total, resultsCount: results.length })

            // 轉換 API 資料格式到前端格式
            const vehicles: Vehicle[] = results.map((item: any) => {
              // API 回應中車輛資料在 bike 欄位內
              const bike = item.bike || item
              const realtimeData = item // 即時資料在頂層

              // 使用正確的小數格式，優先使用 lat_decimal/lng_decimal
              const lat = parseFloat(realtimeData.lat_decimal || realtimeData.latitude / 1000000 || realtimeData.lat || 0) || 0
              const lon = parseFloat(realtimeData.lng_decimal || realtimeData.longitude / 1000000 || realtimeData.lon || 0) || 0

              return {
                id: bike.bike_id || bike.id || String(Math.random()),
                name: bike.bike_name || bike.name || 'E-Bike',
                batteryLevel: realtimeData.soc || realtimeData.battery_level || realtimeData.soc_pct || realtimeData.battery_pct || 0,
                batteryPct: realtimeData.soc || realtimeData.battery_level || realtimeData.soc_pct || realtimeData.battery_pct || 0,
                voltage: Number(realtimeData.voltage || realtimeData.pack_voltage || realtimeData.battery_voltage || bike.voltage || 0),
                controllerTemp: Number(realtimeData.controller_temperature || realtimeData.ctrl_temp || realtimeData.temperature || bike.controller_temperature || 0),
                status: this._mapApiStatus(realtimeData.status || realtimeData.rental_status || 'available'),
                siteId: realtimeData.site_id || realtimeData.station_id || bike.site_id || 'unknown',
                lat,
                lon,
                location: { lat, lng: lon }, // 為地圖組件添加 location 結構
                mqttStatus: realtimeData.mqtt_connected || realtimeData.is_connected ? 'online' : 'offline',
                lastSeen: realtimeData.last_seen || realtimeData.updated_at || new Date().toISOString(),
                soh: realtimeData.soh || realtimeData.battery_health || 80,
                // 新增租借資訊
                currentMember: realtimeData.current_member ? {
                  id: realtimeData.current_member.id,
                  name: realtimeData.current_member.full_name,
                  phone: realtimeData.current_member.phone
                } : null,
                vehicleSpeed: realtimeData.vehicle_speed || 0,
                telemetryImei: bike.telemetry_device_imei || null
              }
            })

            console.log('[Vehicles] Processed vehicles:', vehicles.length, vehicles.slice(0, 2))

            // 前端低電量篩選
            let filteredVehicles = vehicles
            if (filterParams.lowBattery) {
              const threshold = 20
              filteredVehicles = vehicles.filter(v => v.batteryLevel < threshold)
            }

            this.errMsg = ''
            this.usingMock = false

            return {
              data: filteredVehicles, // UI-only filter on current page
              total // keep backend total for pagination consistency
            }
          }
        } catch (apiError) {
          console.warn('調用真實 API 失敗，使用假資料:', apiError)
        }

        // API 失敗時使用假資料
        const allData = this._buildDummyVehicles(200, filterParams)
        const total = allData.length
        const data = allData.slice(offset, offset + limit)

        this.errMsg = ''
        this.usingMock = true

        return { data, total }
      } catch (err: any) {
        console.error('載入分頁車輛資料失敗:', err)
        this.errMsg = '獲取車輛列表失敗'
        return { data: [], total: 0 }
      } finally {
        this.loading = false
      }
    },

    /** 映射 API 狀態到前端狀態 */
    _mapApiStatus(apiStatus: string): Vehicle['status'] {
      const statusMap: Record<string, Vehicle['status']> = {
        'idle': 'available',        // 閒置 → 可用
        'available': 'available',   // 可用 → 可用
        'rented': 'in-use',        // 出租中 → 使用中
        'in_use': 'in-use',        // 使用中 → 使用中
        'maintenance': 'maintenance', // 維護 → 維護中
        'offline': 'maintenance',   // 離線 → 維護中
        'error': 'maintenance'      // 錯誤 → 維護中
      }
      return statusMap[apiStatus] || 'available'
    },

    _normalizeBikeDetail(dto: any): Vehicle {
      const rawId = dto?.bike_id ?? dto?.id ?? ''
      const id = String(rawId)
      const statusRaw = dto?.status ?? dto?.rental_status ?? dto?.bike_status
      const status = statusRaw ? this._mapApiStatus(String(statusRaw)) : undefined
      const battery = dto?.soc ?? dto?.battery_level ?? dto?.batteryPct ?? dto?.battery_pct
      const lat = dto?.lat_decimal ?? dto?.lat ?? dto?.location?.lat
      const lon = dto?.lng_decimal ?? dto?.lon ?? dto?.location?.lng

      const vehicle: Vehicle = {
        id,
        name: dto?.bike_name ?? dto?.name ?? `車輛-${id}`,
        model: dto?.bike_model ?? dto?.model,
        siteId: dto?.site_id ? String(dto.site_id) : dto?.site?.id ? String(dto.site.id) : undefined,
        telemetryImei: dto?.telemetry_device_imei ?? dto?.telemetryDeviceImei ?? dto?.telemetry_imei ?? null,
        status,
        batteryPct: typeof battery === 'number' ? battery : undefined,
        batteryLevel: typeof battery === 'number' ? battery : undefined,
        lat: typeof lat === 'number' ? lat : undefined,
        lon: typeof lon === 'number' ? lon : undefined,
        location: (typeof lat === 'number' && typeof lon === 'number') ? { lat, lng: lon } : undefined,
        soh: dto?.soh ?? dto?.battery_health ?? undefined,
        lastSeen: dto?.updated_at ?? dto?.last_seen ?? dto?.lastSeen,
        createdAt: dto?.created_at ?? dto?.createdAt,
        lastUpdate: dto?.updated_at ?? dto?.lastUpdate
      }
      return vehicle
    },

    _mergeVehicle(vehicle: Vehicle) {
      if (!vehicle || !vehicle.id) return
      const updateArray = (arr: Vehicle[]) => {
        const idx = arr.findIndex(v => v.id === vehicle.id)
        if (idx >= 0) {
          arr[idx] = { ...arr[idx], ...vehicle }
        } else {
          arr.unshift(vehicle)
        }
      }

      updateArray(this.items)
      updateArray(this.vehicles)

      if (vehicle.siteId) {
        const siteId = String(vehicle.siteId)
        const list = this.bySite[siteId] || []
        const idx = list.findIndex(v => v.id === vehicle.id)
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...vehicle }
          this.bySite[siteId] = list
        } else {
          this.bySite[siteId] = [vehicle, ...list]
        }
      }
    },

    _removeVehicleFromCollections(id: string) {
      this.items = this.items.filter(v => v.id !== id)
      this.vehicles = this.vehicles.filter(v => v.id !== id)
      Object.keys(this.bySite).forEach(siteId => {
        const arr = (this.bySite[siteId] || []).filter(v => v.id !== id)
        if (arr.length > 0) this.bySite[siteId] = arr
        else delete this.bySite[siteId]
      })
      if (this.total > 0) this.total -= 1
    },

    /** 獲取車輛電池詳細資訊 */
    async fetchBatteryMetrics(vehicleId: string) {
      // 停用 API：回傳 null 或可改讀假資料
      return null
    },

    /** 更新車輛狀態 */
    updateVehicleStatus(vehicleId: string, status: Vehicle['status']) {
      // 更新 vehicles 陣列
      const vehicleIndex = this.vehicles.findIndex(v => v.id === vehicleId)
      if (vehicleIndex !== -1) {
        this.vehicles[vehicleIndex].status = status
      }

      // 更新 items 陣列
      const itemIndex = this.items.findIndex(v => v.id === vehicleId)
      if (itemIndex !== -1) {
        this.items[itemIndex].status = status
      }

      // 更新 bySite 中的車輛
      Object.keys(this.bySite).forEach(siteId => {
        const siteVehicleIndex = this.bySite[siteId].findIndex(v => v.id === vehicleId)
        if (siteVehicleIndex !== -1) {
          this.bySite[siteId][siteVehicleIndex].status = status
        }
      })
    }
  }
})
