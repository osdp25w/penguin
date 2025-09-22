<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">車輛清單</h1>
        <p class="mt-1 text-sm text-gray-700">管理所有車輛及其電池健康度資訊</p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="refreshData">
          <i class="i-ph-arrow-clockwise w-4 h-4 mr-2"></i>
          重新整理
        </Button>
        <Button variant="primary" size="sm" @click="openCreateModal">
          <i class="i-ph-plus w-4 h-4 mr-2"></i>
          新增車輛
        </Button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div>
          <p class="text-sm font-medium text-gray-600">總車輛</p>
          <p class="text-2xl font-bold text-gray-900">{{ stats.total || 0 }} 輛</p>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div>
          <p class="text-sm font-medium text-gray-600">可用車輛</p>
          <p class="text-2xl font-bold text-green-600">{{ stats.available }} 輛</p>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div>
          <p class="text-sm font-medium text-gray-600">使用中</p>
          <p class="text-2xl font-bold text-blue-600">{{ stats.inUse }} 輛</p>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div>
          <p class="text-sm font-medium text-gray-600">需關注</p>
          <p class="text-2xl font-bold text-red-600">{{ stats.needsAttention }} 輛</p>
        </div>
      </div>
    </div>

    <!-- Mock Banner -->
    <div v-if="vehiclesStore.usingMock" class="rounded-lg border border-amber-300 bg-amber-50 text-amber-800 p-3 flex items-start gap-2">
      <i class="i-ph-info w-5 h-5 mt-0.5"></i>
      <div class="text-sm">
        後端資料暫不可用，已顯示假資料以便操作與測試。新增分頁功能和低電量徽章過濾。
      </div>
    </div>

    <!-- Filters -->
    <div class="card p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">站點篩選</label>
          <select v-model="filters.siteId" class="input-base">
            <option value="">全部站點</option>
            <option v-for="site in siteOptions" :key="site.id" :value="site.id">
              {{ site.name }}
            </option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">車輛狀態</label>
          <select v-model="filters.status" class="input-base">
            <option value="">全部狀態</option>
            <option value="available">可用</option>
            <option value="in-use">使用中</option>
            <option value="maintenance">維護中</option>
          </select>
        </div>

        <!-- 新增低電量過濾器 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">其他篩選</label>
          <div class="flex items-center gap-4">
            <label class="flex items-center">
              <input
                v-model="filters.lowBattery"
                type="checkbox"
                class="rounded border-gray-300 text-brand-primary focus:ring-brand-primary focus:ring-offset-0"
              >
              <span class="ml-2 text-sm text-gray-700">只顯示低電量車輛 (&lt;20%)</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">搜尋</label>
          <div class="relative md:max-w-[16rem] lg:max-w-[18rem]">
            <input
              v-model="filters.keyword"
              type="text"
              placeholder="輸入ID..."
              class="input-base pl-9 w-full md:max-w-[16rem] lg:max-w-[18rem]"
            >
            <i class="i-ph-magnifying-glass absolute left-3 top-2.5 w-4 h-4 text-gray-600"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="paging.loading.value" class="text-center py-8">
      <i class="i-ph-spinner w-8 h-8 animate-spin mx-auto text-gray-400 mb-2"></i>
      <p class="text-gray-600">載入中...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="paging.error.value" class="text-center py-8">
      <i class="i-ph-warning-circle w-8 h-8 mx-auto text-red-400 mb-2"></i>
      <p class="text-red-600 mb-4">{{ paging.error.value }}</p>
      <Button @click="refreshData">重試</Button>
    </div>

    <!-- Vehicle Table -->
    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr class="text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              <th class="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('name')">
                <div class="flex items-center gap-1">
                  名稱
                  <i v-if="sortConfig.field === 'name'"
                     :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                     class="w-3 h-3"></i>
                  <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
                </div>
              </th>
              <th class="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('id')">
                <div class="flex items-center gap-1">
                  ID
                  <i v-if="sortConfig.field === 'id'"
                     :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                     class="w-3 h-3"></i>
                  <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
                </div>
              </th>
              <th class="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('batteryLevel')">
                <div class="flex items-center gap-1">
                  SoC
                  <i v-if="sortConfig.field === 'batteryLevel'"
                     :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                     class="w-3 h-3"></i>
                  <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
                </div>
              </th>
              <th class="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('status')">
                <div class="flex items-center gap-1">
                  狀態
                  <i v-if="sortConfig.field === 'status'"
                     :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                     class="w-3 h-3"></i>
                  <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr 
              v-for="vehicle in filteredVehicles"
              :key="vehicle.id"
              class="hover:bg-gray-50 cursor-pointer"
              @click="selectVehicle(vehicle)"
            >
              <!-- 名稱 -->
              <td class="px-4 py-4">
                <div class="text-sm font-medium text-gray-900">
                  {{ vehicle.name || vehicle.model || 'E-Bike' }}
                </div>
              </td>
              
              <!-- ID -->
              <td class="px-4 py-4">
                <div class="text-sm font-medium text-gray-900">
                  {{ vehicle.id }}
                </div>
              </td>
              
              <!-- SoC -->
              <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-900">{{ vehicle.batteryLevel || vehicle.batteryPct || 0 }}%</span>
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full"
                      :class="getBatteryColorClass(vehicle.batteryLevel || vehicle.batteryPct || 0)"
                      :style="{ width: `${vehicle.batteryLevel || vehicle.batteryPct || 0}%` }"
                    ></div>
                  </div>
                </div>
              </td>
              <!-- 狀態徽章 -->
              <td class="px-4 py-4">
                <VehicleBadges
                  :status="vehicle.status"
                  :battery-level="vehicle.batteryLevel || vehicle.batteryPct || 0"
                  :mqtt-status="vehicle.mqttStatus"
                  :has-error="bikeErrors.hasCritical(String(vehicle.id))"
                />
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Empty State -->
        <div v-if="filteredVehicles.length === 0" class="text-center py-8">
          <i class="i-ph-bicycle w-12 h-12 mx-auto text-gray-400 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">沒有找到車輛</h3>
          <p class="text-gray-500">請調整篩選條件或重新載入</p>
        </div>
      </div>
    </div>

    <!-- 分頁組件 -->
    <PaginationBar
      v-if="paging.total.value > 0"
      :current-page="paging.currentPage.value"
      :total-pages="paging.totalPages.value"
      :total="paging.total.value"
      :limit="paging.limit.value"
      :offset="paging.offset.value"
      :page-range="paging.pageRange.value"
      :has-next-page="paging.hasNextPage.value"
      :has-prev-page="paging.hasPrevPage.value"
      @page-change="paging.goToPage"
      @limit-change="paging.changeLimit"
      @prev="paging.prevPage"
      @next="paging.nextPage"
    />

    <!-- Vehicle Detail Modal -->
    <VehicleDetailModal
      v-if="selectedVehicle"
      :vehicle="selectedVehicle"
      @close="selectedVehicle = null"
      @updated="handleVehicleUpdated"
      @deleted="handleVehicleDeleted"
    />

    <!-- Create Vehicle Modal -->
    <CreateVehicleModal
      v-if="showCreateModal"
      :sites="siteOptions"
      @close="showCreateModal = false"
      @created="handleCreateVehicle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/design/components'
import { useVehicles } from '@/stores/vehicles'
import { useSites } from '@/stores/sites'
import { usePaging } from '@/composables/usePaging'
import { useBikeMeta } from '@/stores/bikeMeta'
import { useTelemetry } from '@/stores/telemetry'
import VehicleDetailModal from '@/components/modals/VehicleDetailModal.vue'
import CreateVehicleModal from '@/components/modals/CreateVehicleModal.vue'
import VehicleBadges from '@/components/VehicleBadges.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import { useBikeErrors } from '@/stores/bikeErrors'
import type { Vehicle } from '@/types/vehicle'

// Stores
const vehiclesStore = useVehicles()
const sitesStore = useSites()
const bikeMeta = useBikeMeta()
const telemetry = useTelemetry()
const route = useRoute()
const router = useRouter()
const bikeErrors = useBikeErrors()

// Reactive data
const sparklineRefs = ref<Record<string, HTMLCanvasElement>>({})
const selectedVehicle = ref<any>(null)
const showCreateModal = ref(false)

const filters = ref({
  siteId: '',
  status: '',
  keyword: '',
  lowBattery: false
})

// Sorting configuration
const sortConfig = ref({
  field: '' as string,
  order: 'asc' as 'asc' | 'desc'
})

// 分頁功能
const paging = usePaging({
  fetcher: async ({ limit, offset }) => {
    return await vehiclesStore.fetchVehiclesPaged({
      limit,
      offset,
      ...filters.value
    })
  },
  syncToUrl: true,
  queryPrefix: 'vehicles'
})

// Computed
const vehicles = computed(() => paging.data.value)
// 兼容不同 store 寫法：優先 list，退回 sites
const siteOptions = computed(() => (sitesStore as any).list ?? (sitesStore as any).sites ?? [])

// 分頁模式下，仍在前端套用一層狀態/關鍵字/低電量過濾，確保 UI 與期望一致
const filteredVehicles = computed(() => {
  let list = vehicles.value.slice()
  // 站點（若後端未正確套用，前端再次過濾）
  if (filters.value.siteId) {
    list = list.filter(v => String(v.siteId || '') === String(filters.value.siteId))
  }
  // 狀態過濾
  if (filters.value.status) {
    const s = String(filters.value.status)
    list = list.filter(v => v.status === s || getStatusText(v.status) === getStatusText(s))
  }
  // 低電量
  if (filters.value.lowBattery) {
    list = list.filter(v => (v.batteryLevel ?? v.batteryPct ?? 100) < 20)
  }
  // 關鍵字
  if (filters.value.keyword && filters.value.keyword.trim()) {
    const q = filters.value.keyword.trim().toLowerCase()
    list = list.filter(v => String(v.id).toLowerCase().includes(q) || String(v.name || v.model || '').toLowerCase().includes(q))
  }

  // Apply sorting
  if (sortConfig.value.field) {
    list.sort((a, b) => {
      let aVal: any = ''
      let bVal: any = ''

      switch (sortConfig.value.field) {
        case 'name':
          aVal = a.name || a.model || 'E-Bike'
          bVal = b.name || b.model || 'E-Bike'
          break
        case 'id':
          aVal = a.id
          bVal = b.id
          break
        case 'batteryLevel':
          aVal = a.batteryLevel || a.batteryPct || 0
          bVal = b.batteryLevel || b.batteryPct || 0
          break
        case 'status':
          aVal = getStatusText(a.status)
          bVal = getStatusText(b.status)
          break
      }

      const compareResult = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortConfig.value.order === 'asc' ? compareResult : -compareResult
    })
  }

  return list
})

// Sorting function
function handleSort(field: string) {
  if (sortConfig.value.field === field) {
    sortConfig.value.order = sortConfig.value.order === 'asc' ? 'desc' : 'asc'
  } else {
    sortConfig.value.field = field
    sortConfig.value.order = 'asc'
  }
}

const stats = computed(() => {
  const total = paging.total.value
  const available = vehicles.value.filter(v =>
    v.status === 'available' || v.status === '可租借'
  ).length
  const inUse = vehicles.value.filter(v =>
    v.status === 'in-use' || v.status === '使用中'
  ).length
  const needsAttention = vehicles.value.filter(v => {
    const battery = v.batteryLevel || v.batteryPct || 0
    const hasIssues = [
      v.motorStatus,
      v.batteryStatus,
      v.controllerStatus,
      v.portStatus,
      v.mqttStatus
    ].some(status => status === 'error' || status === 'offline')
    const hasErrorLog = bikeErrors.hasCritical(String(v.id))
    return battery < 20 || hasIssues || hasErrorLog
  }).length

  return { total, available, inUse, needsAttention }
})

// Methods
const refreshData = async () => {
  console.log('刷新車輛資料...')
  try {
    await Promise.all([
      paging.refresh(),
      sitesStore.fetchSites()
    ])
    console.log('車輛資料載入完成:', vehicles.value.length, '輛車')
  } catch (error) {
    console.error('載入車輛資料失敗:', error)
  }
}

// 當篩選條件改變時，重置到第一頁並重新載入
const applyFilters = () => {
  paging.resetToFirstPage()
  paging.refresh(filters.value)
}

const getSiteName = (siteId: string) => {
  const site = siteOptions.value.find((s: any) => s.id === siteId)
  return site?.name || '未知站點'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'available': '可用',
    'in-use': '使用中',
    'maintenance': '維護中',
    'low-battery': '低電量'
  }
  return statusMap[status] || status
}

const getStatusStyle = (status: string) => {
  const styleMap: Record<string, string> = {
    'available': 'bg-green-100 text-green-800',
    'in-use': 'bg-blue-100 text-blue-800',
    'maintenance': 'bg-yellow-100 text-yellow-800',
    'low-battery': 'bg-red-100 text-red-800'
  }
  return styleMap[status] || 'bg-gray-100 text-gray-800'
}

const getBatteryColorClass = (level: number) => {
  if (level > 60) return 'bg-green-500'
  if (level > 30) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getComponentStatusClass = (status: string) => {
  const statusMap: Record<string, string> = {
    'normal': 'bg-green-100 text-green-800',
    'warning': 'bg-yellow-100 text-yellow-800', 
    'error': 'bg-red-100 text-red-800',
    'offline': 'bg-gray-100 text-gray-800',
    'online': 'bg-green-100 text-green-800'
  }
  return statusMap[status] || 'bg-gray-100 text-gray-800'
}

const getComponentStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'normal': '正常',
    'warning': '警告',
    'error': '異常', 
    'offline': '離線',
    'online': '連線'
  }
  return statusMap[status] || status || '未知'
}

const selectVehicle = (vehicle: any) => {
  selectedVehicle.value = { ...vehicle }
}

const handleVehicleUpdated = (vehicle: Vehicle) => {
  selectedVehicle.value = { ...vehicle }
  paging.refresh()
}

const handleVehicleDeleted = async () => {
  selectedVehicle.value = null
  await paging.refresh()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-TW')
}

const drawSparkline = (canvas: HTMLCanvasElement, data: number[]) => {
  if (!canvas || !data || data.length === 0) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width, height } = canvas.getBoundingClientRect()
  canvas.width = width * devicePixelRatio
  canvas.height = height * devicePixelRatio
  ctx.scale(devicePixelRatio, devicePixelRatio)

  ctx.clearRect(0, 0, width, height)

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 1.5
  ctx.beginPath()

  data.forEach((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()
}

const renderSparklines = async () => {
  await nextTick()
  
  filteredVehicles.value.forEach(vehicle => {
    const canvas = sparklineRefs.value[vehicle.id]
    if (canvas && vehicle.batteryTrend) {
      const data = vehicle.batteryTrend.map(t => t.v)
      drawSparkline(canvas, data)
    }
  })
}

const openCreateModal = () => {
  showCreateModal.value = true
}

const handleCreateVehicle = async (vehicle: any) => {
  await vehiclesStore.createVehicle(vehicle)
  showCreateModal.value = false
}

// 監聽篩選條件變化
watch(
  () => [filters.value.siteId, filters.value.status, filters.value.keyword, filters.value.lowBattery],
  () => {
    applyFilters()
    // 同步到 URL（不影響其他 query）
    const q = { ...route.query }
    q['vehicles_siteId'] = filters.value.siteId || undefined
    q['vehicles_status'] = filters.value.status || undefined
    q['vehicles_keyword'] = filters.value.keyword || undefined
    q['vehicles_lowBattery'] = filters.value.lowBattery ? '1' : undefined
    router.replace({ query: q })
  },
  { deep: true }
)

// Lifecycle
// 監聽過濾器變化，自動重新載入資料
watch(filters, async () => {
  // 重置到第一頁並重新載入
  await paging.reset()
}, { deep: true })

onMounted(async () => {
  // 從 URL 還原篩選條件
  const q = route.query
  const qp = (k: string) => q[`vehicles_${k}`]
  filters.value.siteId = String(qp('siteId') || '')
  filters.value.status = String(qp('status') || '')
  filters.value.keyword = String(qp('keyword') || '')
  filters.value.lowBattery = qp('lowBattery') === '1'

  await Promise.all([
    sitesStore.fetchSites(),
    bikeMeta.fetchCategories(),
    bikeMeta.fetchSeries(),
    bikeMeta.fetchBikeStatusOptions(),
    telemetry.fetchAvailable()
    // bikeErrors.fetchCriticalUnread() - API endpoint doesn't exist
  ])

  // 初始載入分頁資料
  await paging.refresh(filters.value)
  renderSparklines()
})

// Watch for filter changes to re-render sparklines
// computed(() => filteredVehicles.value.length).watch(() => {
//   nextTick(renderSparklines)
// })
</script>
