<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">車輛清單</h1>
        <p class="text-gray-600 mt-1">管理所有共享自行車資訊</p>
      </div>
      
      <div class="flex items-center gap-3">
        <Button variant="ghost" @click="refreshData">
          <i class="i-ph:arrow-clockwise w-4 h-4"></i>
          重新整理
        </Button>
        <Button variant="primary" @click="showAddModal = true">
          <i class="i-ph:plus w-4 h-4"></i>
          新增車輛
        </Button>
      </div>
    </div>

    <!-- Filters & Search -->
    <Card padding="md">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">搜尋</label>
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="車輛編號、型號..."
              class="input-base pl-10"
              @input="applyFilters"
            />
            <i class="i-ph:magnifying-glass absolute left-3 top-2.5 w-4 h-4 text-gray-400"></i>
          </div>
        </div>

        <!-- Site Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">站點</label>
          <select v-model="filters.siteId" class="input-base" @change="applyFilters">
            <option value="">全部站點</option>
            <option v-for="site in sites" :key="site.id" :value="site.id">
              {{ site.name }}
            </option>
          </select>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">狀態</label>
          <select v-model="filters.status" class="input-base" @change="applyFilters">
            <option value="">全部狀態</option>
            <option value="available">可用</option>
            <option value="rented">租借中</option>
            <option value="maintenance">維護中</option>
            <option value="charging">充電中</option>
          </select>
        </div>

        <!-- Brand Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">品牌</label>
          <select v-model="filters.brand" class="input-base" @change="applyFilters">
            <option value="">全部品牌</option>
            <option value="huali">華麗轉身</option>
            <option value="shunqi">順騎自然</option>
          </select>
        </div>
      </div>
    </Card>

    <!-- Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <KpiCard
        title="車輛總數"
        :value="statistics.total"
        icon="i-ph:bicycle"
        color="blue"
      />
      <KpiCard
        title="可用車輛"
        :value="statistics.available"
        icon="i-ph:check-circle"
        color="green"
      />
      <KpiCard
        title="租借中"
        :value="statistics.rented"
        icon="i-ph:user"
        color="yellow"
      />
      <KpiCard
        title="維護中"
        :value="statistics.maintenance"
        icon="i-ph:wrench"
        color="red"
      />
    </div>

    <!-- Vehicle Table -->
    <Card padding="none">
      <div class="p-6 border-b border-gray-200">
        <div class="flex-between">
          <h3 class="text-lg font-semibold text-gray-900">
            車輛列表 ({{ filteredVehicles.length }})
          </h3>
          
          <div class="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              @click="selectAll"
              v-if="filteredVehicles.length > 0"
            >
              全選
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              @click="selectedVehicles = []"
              v-if="selectedVehicles.length > 0"
            >
              取消選擇
            </Button>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="w-12 px-6 py-3 text-left">
                <input
                  type="checkbox"
                  :checked="selectedVehicles.length === filteredVehicles.length && filteredVehicles.length > 0"
                  @change="toggleSelectAll"
                  class="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                車輛編號
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                型號
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                品牌
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                站點
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                狀態
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                電量
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                最後更新
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="vehicle in paginatedVehicles"
              :key="vehicle.id"
              :class="['hover:bg-gray-50 transition-colors duration-200']"
            >
              <td class="px-6 py-4">
                <input
                  type="checkbox"
                  :value="vehicle.id"
                  v-model="selectedVehicles"
                  class="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="font-medium text-gray-900">{{ vehicle.id }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-900">
                {{ vehicle.model }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-900">
                {{ getBrandText(vehicle.brand) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-900">
                {{ getSiteName(vehicle.siteId) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[getStatusBadgeClass(vehicle.status), 'px-2 py-1 text-xs font-medium rounded-full']">
                  {{ getStatusText(vehicle.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-900">{{ vehicle.batteryLevel }}%</span>
                  <div class="w-16 h-2 bg-gray-200 rounded-full">
                    <div
                      :class="getBatteryColor(vehicle.batteryLevel)"
                      :style="{ width: `${vehicle.batteryLevel}%` }"
                      class="h-2 rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatTime(vehicle.lastUpdated) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                  <Button variant="ghost" size="sm" @click="viewVehicle(vehicle)">
                    <i class="i-ph:eye w-4 h-4"></i>
                  </Button>
                  <Button variant="ghost" size="sm" @click="editVehicle(vehicle)">
                    <i class="i-ph:pencil w-4 h-4"></i>
                  </Button>
                  <Button variant="ghost" size="sm" @click="locateVehicle(vehicle)">
                    <i class="i-ph:map-pin w-4 h-4"></i>
                  </Button>
                </div>
              </td>
            </tr>
            
            <tr v-if="filteredVehicles.length === 0">
              <td colspan="9" class="px-6 py-12 text-center">
                <EmptyState
                  title="沒有找到車輛"
                  description="請調整篩選條件或新增車輛"
                  icon="i-ph:bicycle"
                  variant="search"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-3 border-t border-gray-200 bg-gray-50" v-if="filteredVehicles.length > pageSize">
        <div class="flex-between">
          <div class="text-sm text-gray-700">
            顯示 {{ (currentPage - 1) * pageSize + 1 }} 到 {{ Math.min(currentPage * pageSize, filteredVehicles.length) }} 
            共 {{ filteredVehicles.length }} 筆資料
          </div>
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              上一頁
            </Button>
            <span class="text-sm text-gray-700">
              第 {{ currentPage }} 頁，共 {{ totalPages }} 頁
            </span>
            <Button
              variant="ghost"
              size="sm"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              下一頁
            </Button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Batch Actions -->
    <div v-if="selectedVehicles.length > 0" class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <Card padding="sm" class="shadow-lg">
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-gray-900">
            已選擇 {{ selectedVehicles.length }} 輛車
          </span>
          <div class="flex items-center gap-2">
            <Button variant="ghost" size="sm" @click="batchMaintenance">
              <i class="i-ph:wrench w-4 h-4"></i>
              標記維護
            </Button>
            <Button variant="ghost" size="sm" @click="batchUpdateStatus">
              <i class="i-ph:check-circle w-4 h-4"></i>
              更新狀態
            </Button>
            <Button variant="danger" size="sm" @click="batchDelete">
              <i class="i-ph:trash w-4 h-4"></i>
              刪除
            </Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Card, KpiCard, EmptyState } from '@/design/components'
import { useVehiclesStore } from '@/stores/vehicles'
import { useSitesStore } from '@/stores/sites'
import type { Vehicle } from '@/types/vehicle'

// Stores
const vehiclesStore = useVehiclesStore()
const sitesStore = useSitesStore()
const router = useRouter()

// State
const loading = ref(false)
const selectedVehicles = ref<string[]>([])
const showAddModal = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

// Filters
const filters = ref({
  search: '',
  siteId: '',
  status: '',
  brand: '',
})

// Computed
const sites = computed(() => sitesStore.list)

const filteredVehicles = computed(() => {
  let vehicles = vehiclesStore.list

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    vehicles = vehicles.filter(v => 
      v.id.toLowerCase().includes(search) ||
      v.model.toLowerCase().includes(search)
    )
  }

  if (filters.value.siteId) {
    vehicles = vehicles.filter(v => v.siteId === filters.value.siteId)
  }

  if (filters.value.status) {
    vehicles = vehicles.filter(v => v.status === filters.value.status)
  }

  if (filters.value.brand) {
    vehicles = vehicles.filter(v => v.brand === filters.value.brand)
  }

  return vehicles
})

const paginatedVehicles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredVehicles.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredVehicles.value.length / pageSize.value)
})

const statistics = computed(() => {
  const vehicles = vehiclesStore.list
  return {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    rented: vehicles.filter(v => v.status === 'rented').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
  }
})

// Methods
const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      vehiclesStore.fetchVehicles(),
      sitesStore.fetchSites(),
    ])
  } catch (error) {
    console.error('Failed to refresh data:', error)
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  currentPage.value = 1
  // Filter logic handled by computed property
}

const selectAll = () => {
  selectedVehicles.value = filteredVehicles.value.map(v => v.id)
}

const toggleSelectAll = (event: Event) => {
  const checked = (event.target as HTMLInputElement).checked
  if (checked) {
    selectAll()
  } else {
    selectedVehicles.value = []
  }
}

const viewVehicle = (vehicle: Vehicle) => {
  // Navigate to vehicle detail
  console.log('View vehicle:', vehicle.id)
}

const editVehicle = (vehicle: Vehicle) => {
  // Open edit modal
  console.log('Edit vehicle:', vehicle.id)
}

const locateVehicle = (vehicle: Vehicle) => {
  // Navigate to map and focus on vehicle's site
  if (vehicle.siteId) {
    router.push(`/sites?focus=${vehicle.siteId}&vehicle=${vehicle.id}`)
  }
}

const batchMaintenance = async () => {
  if (selectedVehicles.value.length === 0) return
  
  try {
    await vehiclesStore.batchUpdateStatus(selectedVehicles.value, 'maintenance')
    selectedVehicles.value = []
  } catch (error) {
    console.error('Failed to update vehicles:', error)
  }
}

const batchUpdateStatus = async () => {
  // Show status update modal
  console.log('Batch update status for:', selectedVehicles.value)
}

const batchDelete = async () => {
  if (!confirm('確定要刪除選擇的車輛嗎？')) return
  
  try {
    await vehiclesStore.batchDelete(selectedVehicles.value)
    selectedVehicles.value = []
  } catch (error) {
    console.error('Failed to delete vehicles:', error)
  }
}

// Helper functions
const getBrandText = (brand: string): string => {
  return brand === 'huali' ? '華麗轉身' : '順騎自然'
}

const getSiteName = (siteId: string): string => {
  const site = sites.value.find(s => s.id === siteId)
  return site?.name || '未知站點'
}

const getStatusText = (status: string): string => {
  const statusMap = {
    available: '可用',
    rented: '租借中',
    maintenance: '維護中',
    charging: '充電中'
  } as const
  return statusMap[status as keyof typeof statusMap] || status
}

const getStatusBadgeClass = (status: string): string => {
  const badgeMap = {
    available: 'bg-green-100 text-green-800',
    rented: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    charging: 'bg-purple-100 text-purple-800'
  } as const
  return badgeMap[status as keyof typeof badgeMap] || 'bg-gray-100 text-gray-800'
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
})
</script>