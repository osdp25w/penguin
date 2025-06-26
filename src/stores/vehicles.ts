import { defineStore } from 'pinia'
import type { Vehicle } from '@/types'

const PAGE_SIZE = 20

export const useVehicles = defineStore('vehicles', {
  state: () => ({
    isLoading: false,
    errMsg   : '',
    list     : [] as Vehicle[],
    page     : 1,
    total    : 0,
    pageSize : PAGE_SIZE,
  }),

  actions: {
    async fetch (page = 1) {
      this.isLoading = true
      try {
        const res = await fetch(`/api/v1/vehicles?page=${page}&size=${PAGE_SIZE}`)
        if (!res.ok) throw new Error(res.statusText)
        const { items, total } = await res.json()
        this.list  = items
        this.total = total
        this.page  = page
        this.errMsg = ''
      } catch (e:any) {
        this.errMsg = e.message ?? 'fetch vehicles failed'
      } finally {
        this.isLoading = false
      }
    },
  },
})
