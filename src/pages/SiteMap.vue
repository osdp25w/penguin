<template>
  <div class="h-full flex flex-col">
    <!-- Page Header -->
    <div class="flex-between p-6 bg-white border-b border-gray-200">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">場域地圖</h1>
        <p class="text-gray-600 mt-1">查看站點分佈與車輛狀況</p>
      </div>
      
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="sm" @click="refreshData">
          <i class="i-ph:arrow-clockwise w-4 h-4"></i>
          重新整理
        </Button>
        <Button 
          variant="primary" 
          @click="showReturnModal = true"
          :disabled="!selectedSite"
        >
          <i class="i-ph:bicycle w-4 h-4"></i>
          歸還車輛
        </Button>
      </div>
    </div>

    <div class="flex-1 flex">
      <!-- Left Sidebar -->
      <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
        <!-- Filters -->
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">篩選條件</h3>
          
          <!-- Region Filter -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">區域</label>
            <select v-model="filters.region" class="input-base" @change="applyFilters">
              <option value="">全部區域</option>
              <option value="hualien">花蓮縣</option>
              <option value="taitung">台東縣</option>
            </select>
          </div>
          
          <!-- Brand Filter -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">品牌</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input 
                  type="checkbox" 
                  value="huali" 
                  v-model="filters.brands" 
                  @change="applyFilters"
                  class="mr-2 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                華麗轉身
              </label>
              <label class="flex items-center">
                <input 
                  type="checkbox" 
                  value="shunqi" 
                  v-model="filters.brands" 
                  @change="applyFilters"
                  class="mr-2 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                順騎自然
              </label>
            </div>
          </div>
          
          <!-- Status Filter -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">狀態</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input 
                  type="checkbox" 
                  value="active" 
                  v-model="filters.statuses" 
                  @change="applyFilters"
                  class="mr-2 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                正常運行
              </label>
              <label class="flex items-center">
                <input 
                  type="checkbox" 
                  value="maintenance" 
                  v-model="filters.statuses" 
                  @change="applyFilters"
                  class="mr-2 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                維護中
              </label>
              <label class="flex items-center">
                <input 
                  type="checkbox" 
                  value="offline" 
                  v-model="filters.statuses" 
                  @change="applyFilters"
                  class="mr-2 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                離線
              </label>
            </div>
          </div>
        </div>
        
        <!-- Stats Summary -->
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">統計概覽</h3>
          <div class="space-y-3">
            <div class="flex-between">
              <span class="text-gray-600">站點總數</span>
              <span class="font-medium">{{ filteredSites.length }}</span>
            </div>
            <div class="flex-between">
              <span class="text-gray-600">車輛總數</span>
              <span class="font-medium">{{ totalVehicles }}</span>
            </div>
            <div class="flex-between">
              <span class="text-gray-600">可用車輛</span>
              <span class="font-medium text-green-600">{{ availableVehicles }}</span>
            </div>
            <div class="flex-between">
              <span class="text-gray-600">平均電量</span>
              <span class="font-medium">{{ averageBattery }}%</span>
            </div>
          </div>
        </div>
        
        <!-- Site List -->
        <div class="flex-1 p-6 overflow-y-auto">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">站點列表</h3>
          <div class="space-y-2">
            <div
              v-for="site in filteredSites"
              :key="site.id"
              @click="selectSite(site)"
              :class="[
                'p-3 rounded-lg border cursor-pointer transition-colors duration-200',
                selectedSite?.id === site.id 
                  ? 'border-brand-primary bg-brand-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <div class="flex-between">
                <h4 class="font-medium text-gray-900">{{ site.name }}</h4>
                <span :class="[getStatusBadgeClass(site.status), 'px-2 py-1 text-xs font-medium rounded-full']">
                  {{ getStatusText(site.status) }}
                </span>
              </div>
              <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>{{ site.vehicleCount }}/{{ site.capacity }} 車輛</span>
                <span class="text-green-600">{{ site.availableCount }} 可用</span>
              </div>
            </div>
            
            <div v-if="filteredSites.length === 0" class="text-center py-8">
              <EmptyState
                title="沒有找到站點"
                description="請調整篩選條件"
                icon="i-ph:map-pin"
                variant="search"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Map Container -->
      <div class="flex-1 relative">
        <BikeMap
          :sites="filteredSites"
          :selected-site="selectedSite"
          @site-click="selectSite"
          class="w-full h-full"
        />
        
        <!-- Map Loading -->
        <div v-if="loading" class="absolute inset-0 flex-center bg-white/80">
          <div class="text-center">
            <div class="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p class="text-gray-600">載入地圖中...</p>
          </div>
        </div>
      </div>

      <!-- Right Panel - Site Details -->
      <Transition
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-300 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <div 
          v-if="selectedSite" 
          class="w-96 bg-white border-l border-gray-200 flex flex-col"
        >
          <!-- Panel Header -->
          <div class="p-6 border-b border-gray-200">
            <div class="flex-between">
              <div>
                <h3 class="text-xl font-semibold text-gray-900">{{ selectedSite.name }}</h3>
                <p class="text-gray-600 mt-1">{{ selectedSite.address }}</p>
              </div>
              <Button variant="ghost" size="sm" @click="selectedSite = null">
                <i class="i-ph:x w-5 h-5"></i>
              </Button>
            </div>
          </div>

          <!-- Site Info -->
          <div class="p-6 border-b border-gray-200">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span class="block text-sm text-gray-600">狀態</span>
                <span :class="getStatusColor(selectedSite.status) font-medium">
                  {{ getStatusText(selectedSite.status) }}
                </span>
              </div>
              <div>
                <span class="block text-sm text-gray-600">品牌</span>
                <span class="font-medium">{{ getBrandText(selectedSite.brand) }}</span>
              </div>
            </div>

            <!-- KPI Cards -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-blue-50 p-3 rounded-lg">
                <div class="text-xl font-bold text-blue-600">{{ selectedSite.vehicleCount }}</div>
                <div class="text-sm text-blue-600">總車輛數</div>
              </div>
              <div class="bg-green-50 p-3 rounded-lg">
                <div class="text-xl font-bold text-green-600">{{ selectedSite.availableCount }}</div>
                <div class="text-sm text-green-600">可用車輛</div>
              </div>
            </div>
          </div>

          <!-- Recent Returns -->
          <div class="p-6 border-b border-gray-200">
            <h4 class="font-medium text-gray-900 mb-3">最近歸還記錄</h4>
            <div class="space-y-3">
              <div
                v-for="returnRecord in recentReturns"
                :key="returnRecord.id"
                class="p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex-between">
                  <span class="font-medium text-gray-900">{{ returnRecord.vehicleId }}</span>
                  <span class="text-sm text-gray-600">{{ formatTime(returnRecord.createdAt) }}</span>
                </div>
                <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span class="flex items-center gap-1">
                    <i class="i-ph:battery-high w-4 h-4"></i>
                    {{ returnRecord.battery }}%
                  </span>
                  <span v-if="returnRecord.issues" class="text-orange-600">
                    有問題回報
                  </span>
                </div>
              </div>
              
              <div v-if="recentReturns.length === 0" class="text-sm text-gray-500 py-2 text-center">
                暫無歸還記錄
              </div>
            </div>
          </div>

          <!-- Site Vehicles -->
          <div class="flex-1 p-6 overflow-y-auto">
            <h4 class="font-medium text-gray-900 mb-3">在站車輛</h4>
            <div class="space-y-2">
              <div
                v-for="vehicle in siteVehicles"
                :key="vehicle.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div class="font-medium text-sm">{{ vehicle.id }}</div>
                  <div class="text-xs text-gray-500">{{ vehicle.model }}</div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium">{{ vehicle.batteryLevel }}%</div>
                  <div class="flex items-center gap-1 mt-1">
                    <div class="w-12 h-2 bg-gray-200 rounded-full">
                      <div
                        :class="getBatteryColor(vehicle.batteryLevel)"
                        :style="{ width: `${vehicle.batteryLevel}%` }"
                        class="h-2 rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-if="siteVehicles.length === 0" class="text-sm text-gray-500 py-2 text-center">
                暫無車輛資料
              </div>
            </div>
          </div>

          <!-- Panel Actions -->
          <div class="p-6 border-t border-gray-200 bg-gray-50">
            <Button
              variant="primary"
              fullWidth
              @click="showReturnModal = true"
            >
              <i class="i-ph:bicycle w-4 h-4"></i>
              歸還車輛至此站點
            </Button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Return Modal -->
    <ReturnModal
      :visible="showReturnModal"
      :preset-site-id="selectedSite?.id"
      @close="showReturnModal = false"
      @success="handleReturnSuccess"
    />

    <!-- Toast Notification -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="showToast"
        class="fixed top-4 right-4 z-50 p-4 bg-green-500 text-white rounded-lg shadow-lg"
      >
        <div class="flex items-center gap-2">
          <i class="i-ph:check-circle w-5 h-5"></i>
          {{ toastMessage }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Button, EmptyState } from '@/design/components'
import BikeMap from '@/components/map/BikeMap.vue'
import ReturnModal from '@/components/returns/ReturnModal.vue'
import { useSitesStore } from '@/stores/sites'
import { useVehiclesStore } from '@/stores/vehicles'
import { useReturnsStore } from '@/stores/returns'
import type { Site } from '@/types/site'
import type { ReturnRecord } from '@/stores/returns'

// Stores
const sitesStore = useSitesStore()
const vehiclesStore = useVehiclesStore()
const returnsStore = useReturnsStore()

// State
const selectedSite = ref<Site | null>(null)
const showReturnModal = ref(false)
const loading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

// Filters
const filters = ref({
  region: '',
  brands: [] as string[],
  statuses: ['active'] as string[],
})

// Computed
const filteredSites = computed(() => {
  let sites = sitesStore.list

  if (filters.value.region) {
    sites = sites.filter(s => s.region === filters.value.region)
  }

  if (filters.value.brands.length > 0) {
    sites = sites.filter(s => filters.value.brands.includes(s.brand))
  }

  if (filters.value.statuses.length > 0) {
    sites = sites.filter(s => filters.value.statuses.includes(s.status))
  }

  return sites
})

const totalVehicles = computed(() => {
  return filteredSites.value.reduce((sum, site) => sum + site.vehicleCount, 0)
})

const availableVehicles = computed(() => {
  return filteredSites.value.reduce((sum, site) => sum + site.availableCount, 0)
})

const averageBattery = computed(() => {
  const vehicles = vehiclesStore.list.filter(v => 
    filteredSites.value.some(s => s.id === v.siteId)
  )
  if (vehicles.length === 0) return 0
  
  const totalBattery = vehicles.reduce((sum, v) => sum + v.batteryLevel, 0)
  return Math.round(totalBattery / vehicles.length)
})

const siteVehicles = computed(() => {
  if (!selectedSite.value) return []
  return vehiclesStore.list.filter(v => v.siteId === selectedSite.value?.id)
})

const recentReturns = computed(() => {
  if (!selectedSite.value) return []
  return returnsStore.getRecentReturns(selectedSite.value.id, 5)
})

// Methods
const selectSite = (site: Site) => {
  selectedSite.value = site
  // Fetch site-specific data
  vehiclesStore.fetchBySite(site.id)
  returnsStore.fetchReturns(site.id)
}

const applyFilters = () => {
  // Filter logic is handled by computed property
  // Reset selection if current site is filtered out
  if (selectedSite.value && !filteredSites.value.some(s => s.id === selectedSite.value?.id)) {
    selectedSite.value = null
  }
}

const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      sitesStore.fetchSites(),
      vehiclesStore.fetchVehicles(),
      returnsStore.fetchReturns(),
    ])
  } catch (error) {
    console.error('Failed to refresh data:', error)
  } finally {
    loading.value = false
  }
}

const handleReturnSuccess = (record: ReturnRecord) => {
  showToast.value = true
  toastMessage.value = `車輛 ${record.vehicleId} 已成功歸還`
  
  setTimeout(() => {
    showToast.value = false
  }, 3000)

  // Refresh site data if it's the target site
  if (selectedSite.value && selectedSite.value.id === record.siteId) {
    sitesStore.fetchSiteDetails(selectedSite.value.id)
    vehiclesStore.fetchBySite(selectedSite.value.id)
  }
}

// Helper functions
const getStatusText = (status: string): string => {
  const statusMap = {
    active: '正常運行',
    maintenance: '維護中',
    offline: '離線',
    available: '可用',
    rented: '租借中',
    charging: '充電中'
  } as const
  return statusMap[status as keyof typeof statusMap] || status
}

const getStatusColor = (status: string): string => {
  const colorMap = {
    active: 'text-green-600',
    maintenance: 'text-yellow-600',
    offline: 'text-red-600',
    available: 'text-green-600',
    rented: 'text-blue-600',
    charging: 'text-yellow-600'
  } as const
  return colorMap[status as keyof typeof colorMap] || 'text-gray-600'
}

const getStatusBadgeClass = (status: string): string => {
  const badgeMap = {
    active: 'bg-green-100 text-green-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    offline: 'bg-red-100 text-red-800'
  } as const
  return badgeMap[status as keyof typeof badgeMap] || 'bg-gray-100 text-gray-800'
}

const getBrandText = (brand: string): string => {
  return brand === 'huali' ? '華麗轉身' : '順騎自然'
}

const getBatteryColor = (level: number): string => {
  if (level >= 75) return 'bg-green-500'
  if (level >= 50) return 'bg-yellow-500'
  if (level >= 25) return 'bg-orange-500'
  return 'bg-red-500'
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffMinutes < 1) return '剛剛'
  if (diffMinutes < 60) return `${diffMinutes} 分鐘前`
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} 小時前`
  return date.toLocaleDateString('zh-TW')
}

// Lifecycle
onMounted(async () => {
  await refreshData()
  // Auto-select first site if available
  if (filteredSites.value.length > 0) {
    selectSite(filteredSites.value[0])
  }
})
</script>