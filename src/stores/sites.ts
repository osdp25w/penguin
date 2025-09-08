import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Site, SiteRegion } from '@/types/site'
import { SiteSchema } from '@/types/site'
import { z } from 'zod'

interface SiteFilters {
  region: SiteRegion
  brands: string[]
  statuses: string[]
  batteryRange: [number, number]
}

const SiteListSchema = z.array(SiteSchema)

export const useSites = defineStore('sites', () => {
  const list = ref<Site[]>([])
  const selected = ref<Site | undefined>()
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const filters = ref<SiteFilters>({
    region: 'hualien',
    brands: [],
    statuses: [],
    batteryRange: [0, 100]
  })

  const filteredSites = computed(() => {
    return list.value.filter(site => {
      if (site.region !== filters.value.region) return false
      if (filters.value.brands.length > 0 && !filters.value.brands.includes(site.brand)) return false
      if (filters.value.statuses.length > 0 && !filters.value.statuses.includes(site.status)) return false
      
      const avgBattery = site.vehicleCount > 0 
        ? ((site.batteryLevels.high * 85 + site.batteryLevels.medium * 50 + site.batteryLevels.low * 15) / site.vehicleCount)
        : 0
      
      return avgBattery >= filters.value.batteryRange[0] && avgBattery <= filters.value.batteryRange[1]
    })
  })

  async function fetchSites(): Promise<void> {
    // 使用假資料，停用 API 讀取
    loading.value = true
    error.value = null
    
    try {
      const mod = await import('@/mocks/handlers/sites')
      list.value = mod?.getDemoSites ? mod.getDemoSites(filters.value.region) : []
    } catch (err) {
      console.error('載入站點假資料失敗:', err)
      error.value = '站點載入失敗（假資料）'
      list.value = []
    } finally {
      loading.value = false
    }
  }

  function selectSite(site: Site | undefined): void {
    selected.value = site
  }

  return { list, selected, loading, error, filters, filteredSites, fetchSites, selectSite }
})