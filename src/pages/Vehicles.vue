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
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div>
          <p class="text-sm font-medium text-gray-600">總車輛</p>
          <p class="text-2xl font-bold text-gray-900">{{ stats.total }} 輛</p>
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

    <!-- Filters -->
    <div class="card p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">站點篩選</label>
          <select v-model="filters.siteId" class="input-base">
            <option value="">全部站點</option>
            <option v-for="site in sites" :key="site.id" :value="site.id">
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
            <option value="low-battery">低電量</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">搜尋</label>
          <div class="relative">
            <input
              v-model="filters.keyword"
              type="text"
              placeholder="輸入ID..."
              class="input-base pl-9 w-full"
            >
            <i class="i-ph-magnifying-glass absolute left-3 top-2.5 w-4 h-4 text-gray-600"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="vehiclesStore.loading" class="text-center py-8">
      <i class="i-ph-spinner w-8 h-8 animate-spin mx-auto text-gray-400 mb-2"></i>
      <p class="text-gray-600">載入中...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="vehiclesStore.errMsg" class="text-center py-8">
      <i class="i-ph-warning-circle w-8 h-8 mx-auto text-red-400 mb-2"></i>
      <p class="text-red-600 mb-4">{{ vehiclesStore.errMsg }}</p>
      <Button @click="refreshData">重試</Button>
    </div>

    <!-- Vehicle Table -->
    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                名稱
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                ID
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                SoC
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Motor
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Battery
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Controller
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Port
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                MQTT
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
              
              <!-- Motor -->
              <td class="px-4 py-4">
                <div class="text-sm font-mono text-gray-900">
                  {{ vehicle.motor || 'N/A' }}
                </div>
              </td>
              
              <!-- Battery -->
              <td class="px-4 py-4">
                <div class="text-sm font-mono text-gray-900">
                  {{ vehicle.battery || 'N/A' }}
                </div>
              </td>
              
              <!-- Controller -->
              <td class="px-4 py-4">
                <div class="text-sm font-mono text-gray-900">
                  {{ vehicle.controller || 'N/A' }}
                </div>
              </td>
              
              <!-- Port -->
              <td class="px-4 py-4">
                <div class="text-sm font-mono text-gray-900">
                  {{ vehicle.port || 'N/A' }}
                </div>
              </td>
              
              <!-- MQTT -->
              <td class="px-4 py-4">
                <div class="text-center">
                  <span 
                    v-if="vehicle.mqttStatus === 'online' || vehicle.mqtt_ok === true"
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 font-bold"
                  >
                    ✓
                  </span>
                  <span 
                    v-else
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 font-bold"
                  >
                    ✕
                  </span>
                </div>
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

    <!-- Vehicle Detail Modal -->
    <VehicleDetailModal
      v-if="selectedVehicle"
      :vehicle="selectedVehicle"
      @close="selectedVehicle = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { Button } from '@/design/components'
import { useVehicles } from '@/stores/vehicles'
import { useSites } from '@/stores/sites'
import VehicleDetailModal from '@/components/modals/VehicleDetailModal.vue'

// Stores
const vehiclesStore = useVehicles()
const sitesStore = useSites()

// Reactive data
const sparklineRefs = ref<Record<string, HTMLCanvasElement>>({})
const selectedVehicle = ref<any>(null)

const filters = ref({
  siteId: '',
  status: '',
  keyword: ''
})

// Computed
const vehicles = computed(() => vehiclesStore.vehicles)
const sites = computed(() => sitesStore.sites)

const filteredVehicles = computed(() => {
  let result = vehicles.value

  if (filters.value.siteId) {
    result = result.filter(v => v.siteId === filters.value.siteId)
  }

  if (filters.value.status) {
    result = result.filter(v => v.status === filters.value.status)
  }


  if (filters.value.keyword) {
    const keyword = filters.value.keyword.toLowerCase()
    result = result.filter(v => 
      v.id.toLowerCase().includes(keyword) ||
      getSiteName(v.siteId).toLowerCase().includes(keyword)
    )
  }

  return result
})

const stats = computed(() => {
  const total = vehicles.value.length
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
    return battery < 20 || hasIssues
  }).length

  return { total, available, inUse, needsAttention }
})

// Methods
const refreshData = async () => {
  console.log('刷新車輛資料...')
  try {
    await Promise.all([
      vehiclesStore.fetchVehicles(),
      sitesStore.fetchSites()
    ])
    console.log('車輛資料載入完成:', vehicles.value.length, '輛車')
  } catch (error) {
    console.error('載入車輛資料失敗:', error)
  }
}

const getSiteName = (siteId: string) => {
  const site = sites.value.find(s => s.id === siteId)
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
  selectedVehicle.value = vehicle
}

const showVehicleDetails = (vehicle: any) => {
  selectedVehicle.value = vehicle
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

// Lifecycle
onMounted(async () => {
  await refreshData()
  renderSparklines()
})

// Watch for filter changes to re-render sparklines
// computed(() => filteredVehicles.value.length).watch(() => {
//   nextTick(renderSparklines)
// })
</script>