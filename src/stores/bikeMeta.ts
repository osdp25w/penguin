// src/stores/bikeMeta.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/lib/api'

export interface BikeCategory {
  id: number | string
  name: string
}

export interface BikeSeries {
  id: number | string
  name: string
}

export const useBikeMeta = defineStore('bikeMeta', () => {
  const categories = ref<BikeCategory[]>([])
  const series = ref<BikeSeries[]>([])
  const bikeStatusOptions = ref<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCategories() {
    loading.value = true
    error.value = null
    try {
      const res: any = await http.get('/api/bike/categories/')
      const rows = res?.results || res?.data || res || []
      categories.value = rows.map((r: any, idx: number) => ({ id: r.id ?? idx + 1, name: r.name ?? r.category ?? `分類${idx + 1}` }))
    } catch (e) {
      // fallback demo
      categories.value = [
        { id: 1, name: '城市車' },
        { id: 2, name: '登山車' },
        { id: 3, name: '電輔車' }
      ]
      error.value = '無法讀取車種分類（使用預設）'
    } finally {
      loading.value = false
    }
  }

  async function fetchSeries() {
    loading.value = true
    error.value = null
    try {
      const res: any = await http.get('/api/bike/series/')
      const rows = res?.results || res?.data || res || []
      series.value = rows.map((r: any, idx: number) => ({ id: r.id ?? idx + 1, name: r.name ?? r.series ?? `系列${idx + 1}` }))
    } catch (e) {
      // fallback demo
      series.value = [
        { id: 1, name: 'S1' },
        { id: 2, name: 'S2' },
        { id: 3, name: 'S3' }
      ]
      error.value = '無法讀取系列（使用預設）'
    } finally {
      loading.value = false
    }
  }

  async function fetchBikeStatusOptions() {
    try {
      const res: any = await http.get('/api/bike/status-options/')
      const rows = res?.results || res?.data || res || []
      bikeStatusOptions.value = Array.isArray(rows) ? rows : Object.values(rows || {})
    } catch {
      bikeStatusOptions.value = ['available', 'in-use', 'maintenance']
    }
  }

  return { categories, series, bikeStatusOptions, loading, error, fetchCategories, fetchSeries, fetchBikeStatusOptions }
})

