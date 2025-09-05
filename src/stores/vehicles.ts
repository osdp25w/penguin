// src/stores/vehicles.ts
import { defineStore } from 'pinia'
import type { Vehicle } from '@/types'
// import { VehicleListSchema } from '@/types/vehicle' // 暫時移除驗證

const DEFAULT_PAGE_SIZE = 20

export const useVehicles = defineStore('vehicles', {
  state: () => ({
    loading : false as boolean,
    errMsg  : '' as string,
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
    /** 分頁抓取 */
    async fetchPage({ page = 1, size = DEFAULT_PAGE_SIZE } = {}) {
      this.loading = true
      try {
        const res = await fetch(`/api/v1/vehicles?page=${page}&size=${size}`)
        if (!res.ok) throw new Error(res.statusText)
        const { items, total } = await res.json()
        this.items    = items
        this.total    = total
        this.page     = page
        this.pageSize = size
        this.errMsg   = ''
      } catch (e: any) {
        this.errMsg = e.message || '取得車輛清單失敗'
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

    /** 新增車輛 (假資料) */
    async createVehicle(v: Vehicle) {
      // 預先加到列表前面，並更新總數
      this.items.unshift(v)
      this.total += 1
    },

    /** Fetch vehicles by site ID for map */
    async fetchBySite(siteId: string) {
      if (!siteId) return
      
      this.loadingBySite[siteId] = true
      this.errorBySite[siteId] = null
      
      try {
        const response = await fetch(`/api/v1/vehicles?siteId=${siteId}`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const data = await response.json()
        this.bySite[siteId] = data
      } catch (err: any) {
        this.errorBySite[siteId] = err.message || 'Unknown error'
        this.bySite[siteId] = []
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

    /** 獲取所有車輛 (支援篩選和搜尋) */
    async fetchVehicles(params?: {
      siteId?: string;
      keyword?: string;
      status?: string;
      soh_lt?: number;
    }) {
      this.loading = true
      try {
        const searchParams = new URLSearchParams()
        if (params?.siteId) searchParams.set('siteId', params.siteId)
        if (params?.keyword) searchParams.set('keyword', params.keyword)
        if (params?.status) searchParams.set('status', params.status)
        if (params?.soh_lt) searchParams.set('soh_lt', params.soh_lt.toString())

        const response = await fetch(`/api/v1/vehicles/list?${searchParams}`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const ct = response.headers.get('content-type') || ''
        if (!ct.includes('application/json')) throw new Error('非 JSON 回應（可能是路由或代理設定問題）')
        const data = await response.json()
        this.vehicles = data
        this.errMsg = ''
      } catch (err: any) {
        this.errMsg = err.message || '獲取車輛列表失敗'
        // 後備：若啟用 mock，直接使用本地生成資料（在非安全來源或子路徑時 Service Worker 可能無法啟動）
        try {
          if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
            const mod = await import('@/mocks/handlers/vehicles')
            if (mod?.getDemoVehiclesList) {
              this.vehicles = mod.getDemoVehiclesList(params)
              this.errMsg = ''
            } else {
              this.vehicles = []
            }
          } else {
            this.vehicles = []
          }
        } catch {
          this.vehicles = []
        }
      } finally {
        this.loading = false
      }
    },

    /** 獲取車輛電池詳細資訊 */
    async fetchBatteryMetrics(vehicleId: string) {
      try {
        const response = await fetch(`/api/v1/metrics/vehicle/${vehicleId}/battery`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        return await response.json()
      } catch (err: any) {
        console.error('Fetch battery metrics error:', err)
        return null
      }
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
