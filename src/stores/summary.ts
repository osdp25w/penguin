import { defineStore } from 'pinia'
import type { SummaryKpis } from '@/types'

export const useSummary = defineStore('summary', {
  state: () => ({
    isLoading: false,
    errMsg   : '',
    data     : {} as SummaryKpis,
  }),

  actions: {
    async fetch () {
      try {
        this.isLoading = true
        const res = await fetch('/api/v1/metrics/summary')
        if (!res.ok) throw new Error(res.statusText)
        this.data     = await res.json()
        this.errMsg   = ''
      } catch (e:any) {
        this.errMsg = e.message ?? 'fetch summary failed'
      } finally {
        this.isLoading = false
      }
    },
  },
})
