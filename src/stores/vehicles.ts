import { defineStore } from 'pinia'
import type { Vehicle } from '@/types'

const DEFAULT_PAGE_SIZE = 20

export const useVehicles = defineStore('vehicles', {
  /* ────────────── State ────────────── */
  state: () => ({
    loading : false,
    errMsg  : '',
    items   : [] as Vehicle[],
    page    : 1,
    total   : 0,
    pageSize: DEFAULT_PAGE_SIZE
  }),

  /* ───────────── Getters ───────────── */
  getters: {
    totalPages: s => Math.ceil(s.total / s.pageSize)
  },

  /* ───────────── Actions ───────────── */
  actions: {
    /** 主要取得清單（新命名） */
    async fetchPage ({ page = 1, size = DEFAULT_PAGE_SIZE } = {}) {
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
        this.errMsg = e.message ?? 'fetch vehicles failed'
        throw e
      } finally {
        this.loading = false
      }
    },

    /** 舊呼叫方式相容 (只給 page) */
    async fetch (page = 1) {
      return this.fetchPage({ page })
    },

    /** Demo：更新裝置配對 / MQTT；正式環境請改成 PATCH */
    async updateDevice (v: Vehicle) {
      const i = this.items.findIndex(x => x.id === v.id)
      if (i > -1) this.items[i] = v
    }
  }
})
