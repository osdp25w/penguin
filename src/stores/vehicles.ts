// src/stores/vehicles.ts
import { defineStore } from 'pinia'
import type { Vehicle } from '@/types'

const DEFAULT_PAGE_SIZE = 20

export const useVehicles = defineStore('vehicles', {
  state: () => ({
    loading : false as boolean,
    errMsg  : '' as string,
    items   : [] as Vehicle[],
    page    : 1 as number,
    total   : 0 as number,
    pageSize: DEFAULT_PAGE_SIZE as number
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
    }
  }
})
