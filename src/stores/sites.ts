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

export const useSitesStore = defineStore('sites', () => {
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
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/v1/sites?region=${filters.value.region}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const data = await response.json()
      list.value = SiteListSchema.parse(data)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
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