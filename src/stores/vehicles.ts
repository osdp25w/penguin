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
      // 使用假資料，停用 API 讀取
      this.loading = true
      try {
        const mod = await import('@/mocks/handlers/vehicles')
        console.log('Vehicles mock 模組載入:', !!mod, !!mod?.getDemoVehiclesList)
        const mockData = mod?.getDemoVehiclesList ? (mod.getDemoVehiclesList() as any) : []
        console.log('Vehicles mock 資料:', mockData.length, '輛')
        this.items = mockData.slice(0, size)
        this.total = mockData.length
        this.page = page
        this.pageSize = size
        this.errMsg = ''
      } catch (e: any) {
        console.error('載入車輛分頁假資料失敗:', e)
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

    /** 獲取所有車輛 (支援篩選和搜尋) */
    async fetchVehicles(params?: {
      siteId?: string;
      keyword?: string;
      status?: string;
      soh_lt?: number;
    }) {
      // 使用假資料，停用 API 讀取
      this.loading = true
      try {
        const mod = await import('@/mocks/handlers/vehicles')
        this.vehicles = mod?.getDemoVehiclesList ? (mod.getDemoVehiclesList(params) as any) : []
        this.errMsg = ''
      } catch (err: any) {
        console.error('載入車輛假資料失敗:', err)
        this.vehicles = []
        this.errMsg = '獲取車輛列表失敗（假資料）'
      } finally {
        this.loading = false
      }
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
