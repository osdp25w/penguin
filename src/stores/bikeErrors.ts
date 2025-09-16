// src/stores/bikeErrors.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/lib/api'

export interface BikeErrorLogStatus {
  id: number | string
  bike_id?: string
  level?: string // e.g., critical, warning, info
  is_read?: boolean
  created_at?: string
  [k: string]: any
}

export const useBikeErrors = defineStore('bikeErrors', () => {
  const list = ref<BikeErrorLogStatus[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const criticalUnreadIds = ref<Set<string>>(new Set())

  async function fetchStatuses(params?: { limit?: number; offset?: number; level?: string; is_read?: boolean }) {
    loading.value = true
    error.value = null
    try {
      const qs = new URLSearchParams()
      if (params?.limit != null) qs.set('limit', String(params.limit))
      if (params?.offset != null) qs.set('offset', String(params.offset))
      if (params?.level) qs.set('level', params.level)
      if (params?.is_read != null) qs.set('is_read', String(params.is_read))
      const res: any = await http.get(`/api/bike/error-log-status/${qs.toString() ? `?${qs.toString()}` : ''}`)
      const rows = res?.results || res?.data || res || []
      list.value = Array.isArray(rows) ? rows : []
      total.value = res?.total_count || res?.count || list.value.length
    } catch (e: any) {
      error.value = e?.message || '讀取錯誤日誌狀態失敗'
      list.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  async function fetchCriticalUnread(limit = 500) {
    // 暫時停用 API 呼叫，直接設定空的錯誤列表
    console.warn('[BikeErrors] fetchCriticalUnread: API not available, using empty set')
    criticalUnreadIds.value = new Set()
    list.value = []
    total.value = 0
    loading.value = false
    error.value = null
  }

  function hasCritical(bikeId: string): boolean {
    return criticalUnreadIds.value.has(bikeId)
  }

  async function fetchById(id: number | string): Promise<BikeErrorLogStatus | null> {
    try {
      // 暫時停用 API 呼叫，因為 /api/bike/error-log-status/ 在後端不存在
      console.warn('[BikeErrors] API /api/bike/error-log-status/${id}/ not available')
      return null
    } catch {
      return null
    }
  }

  return { list, total, loading, error, criticalUnreadIds, fetchStatuses, fetchCriticalUnread, hasCritical, fetchById }
})

