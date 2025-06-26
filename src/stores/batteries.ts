import { defineStore } from 'pinia'
import type { BatteryStat } from '@/types'

export const useBatteries = defineStore('batteries', {
  state: () => ({
    isLoading: false,
    errMsg   : '',
    items    : [] as BatteryStat[],
  }),

  actions: {
    async fetchAll () {
      try {
        this.isLoading = true
        const res = await fetch('/api/v1/batteries')
        if (!res.ok) throw new Error(res.statusText)
        this.items  = await res.json()
        this.errMsg = ''
      } catch (e:any) {
        this.errMsg = e.message ?? 'fetch batteries failed'
      } finally {
        this.isLoading = false
      }
    },
  },
})
