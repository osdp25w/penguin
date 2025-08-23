<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <!-- This element is to trick the browser into centering the modal contents. -->
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900">
            車輛詳情 - {{ vehicle.id }}
          </h3>
          <Button variant="ghost" size="sm" @click="$emit('close')">
            <i class="i-ph-x w-4 h-4"></i>
          </Button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left Column - Basic Info & Battery -->
          <div class="space-y-6">
            <!-- Basic Information -->
            <div class="card p-4">
              <h4 class="font-medium text-gray-900 mb-3">基本資訊</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-700">車輛 ID:</span>
                  <span class="font-medium">{{ vehicle.id }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-700">經緯度:</span>
                  <span class="font-medium font-mono">{{ vehicle.lat?.toFixed(6) || 'N/A' }}, {{ vehicle.lon?.toFixed(6) || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-700">狀態:</span>
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getStatusStyle(vehicle.status)"
                  >
                    {{ getStatusText(vehicle.status) }}
                  </span>
                </div>
                <div v-if="vehicle.status === 'in-use' && vehicle.registeredUser" class="flex justify-between">
                  <span class="text-gray-700">使用者:</span>
                  <span class="font-medium text-blue-700">{{ vehicle.registeredUser }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-700">最後更新:</span>
                  <span class="font-medium">{{ formatDateTime(vehicle.lastSeen) }}</span>
                </div>
              </div>
            </div>

            <!-- Battery Status -->
            <div class="card p-4">
              <h4 class="font-medium text-gray-900 mb-3">電池狀態</h4>
              <div class="space-y-4">
                <!-- Battery Level Gauge -->
                <div class="text-center">
                  <div class="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gray-100 relative">
                    <svg class="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#e5e7eb"
                        stroke-width="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        :stroke="getBatteryColor(vehicle.batteryLevel)"
                        stroke-width="8"
                        fill="none"
                        stroke-linecap="round"
                        :stroke-dasharray="`${(vehicle.batteryLevel / 100) * 251.2} 251.2`"
                        class="transition-all duration-500"
                      />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <div class="text-center">
                        <div class="text-2xl font-bold text-gray-900">{{ vehicle.batteryLevel }}%</div>
                        <div class="text-xs text-gray-700">電量</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Battery Metrics -->
                <div class="grid grid-cols-2 gap-4">
                  <div class="text-center p-3 bg-gray-50 rounded-lg">
                    <div class="text-lg font-semibold text-gray-900">{{ vehicle.soh }}%</div>
                    <div class="text-sm text-gray-700">健康度 (SOH)</div>
                  </div>
                  <div class="text-center p-3 bg-gray-50 rounded-lg">
                    <div class="text-lg font-semibold text-gray-900">{{ vehicle.chargeCycles }}</div>
                    <div class="text-sm text-gray-700">充電循環</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Prediction Info -->
            <div class="card p-4">
              <h4 class="font-medium text-gray-900 mb-3">預測資訊</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-700">預估續航:</span>
                  <span class="font-medium">{{ vehicle.predictedRangeKm }} km</span>
                </div>
                <div class="flex justify-between" v-if="vehicle.predictedReplaceAt">
                  <span class="text-gray-700">預估汰換日:</span>
                  <span class="font-medium">{{ formatDate(vehicle.predictedReplaceAt) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-700">健康度趨勢:</span>
                  <span class="flex items-center gap-1" :class="getSOHTrendClass()">
                    <i :class="getSOHTrendIcon()"></i>
                    {{ getSOHTrendText() }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Charts & History -->
          <div class="space-y-6">
            <!-- Battery Trend Chart -->
            <div class="card p-4">
              <h4 class="font-medium text-gray-900 mb-3">電池趨勢 (過去7天)</h4>
              <div class="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                <canvas ref="chartCanvas" class="w-full h-full"></canvas>
              </div>
            </div>

            <!-- SOH History Chart -->
            <div class="card p-4">
              <h4 class="font-medium text-gray-900 mb-3">健康度歷程 (過去30天)</h4>
              <div class="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                <canvas ref="sohChartCanvas" class="w-full h-full"></canvas>
              </div>
            </div>

            <!-- Recent Events -->
            <div class="card p-4">
              <h4 class="font-medium text-gray-900 mb-3">最近事件</h4>
              <div class="space-y-2 max-h-32 overflow-y-auto">
                <div 
                  v-for="event in recentEvents" 
                  :key="event.id"
                  class="flex items-start gap-3 p-2 bg-gray-50 rounded-lg"
                >
                  <div 
                    class="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    :class="getEventColor(event.type)"
                  ></div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-900">{{ event.title }}</div>
                    <div class="text-xs text-gray-700">{{ formatDateTime(event.timestamp) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" @click="$emit('close')">
            關閉
          </Button>
          <Button variant="primary" @click="performMaintenance">
            <i class="i-ph-wrench w-4 h-4 mr-2"></i>
            安排維護
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { Button } from '@/design/components'
import { useSites } from '@/stores/sites'

const props = defineProps<{
  vehicle: any
}>()

const emit = defineEmits<{
  close: []
}>()

// Refs
const chartCanvas = ref<HTMLCanvasElement>()
const sohChartCanvas = ref<HTMLCanvasElement>()

// Stores
const sitesStore = useSites()

// Mock recent events
const recentEvents = ref([
  {
    id: '1',
    type: 'battery',
    title: '電池電量下降至20%',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2', 
    type: 'location',
    title: '車輛移動至新站點',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    type: 'maintenance',
    title: '完成例行檢查',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
])

// Methods
const getSiteName = (siteId: string) => {
  const site = sitesStore.sites.find(s => s.id === siteId)
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

const getBatteryColor = (level: number) => {
  if (level > 60) return '#10b981' // green
  if (level > 30) return '#f59e0b' // yellow
  return '#ef4444' // red
}

const getSOHTrendClass = () => {
  // Mock trend calculation
  const trend = Math.random() > 0.5 ? 'up' : 'down'
  return trend === 'up' ? 'text-green-600' : 'text-red-600'
}

const getSOHTrendIcon = () => {
  const trend = Math.random() > 0.5 ? 'up' : 'down'
  return trend === 'up' ? 'i-ph-trend-up w-4 h-4' : 'i-ph-trend-down w-4 h-4'
}

const getSOHTrendText = () => {
  const trend = Math.random() > 0.5 ? 'up' : 'down'
  return trend === 'up' ? '穩定改善' : '逐步下降'
}

const getEventColor = (type: string) => {
  const colorMap: Record<string, string> = {
    'battery': 'bg-yellow-400',
    'location': 'bg-blue-400', 
    'maintenance': 'bg-green-400',
    'alert': 'bg-red-400'
  }
  return colorMap[type] || 'bg-gray-400'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-TW')
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-TW')
}

const drawChart = (canvas: HTMLCanvasElement, data: number[], color: string = '#3b82f6') => {
  if (!canvas || !data || data.length === 0) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width, height } = canvas.getBoundingClientRect()
  canvas.width = width * devicePixelRatio
  canvas.height = height * devicePixelRatio
  ctx.scale(devicePixelRatio, devicePixelRatio)

  ctx.clearRect(0, 0, width, height)

  const padding = 20
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  // Draw grid lines
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = padding + (i / 4) * chartHeight
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(width - padding, y)
    ctx.stroke()
  }

  // Draw data line
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()

  data.forEach((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((value - min) / range) * chartHeight
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()

  // Draw data points
  ctx.fillStyle = color
  data.forEach((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((value - min) / range) * chartHeight
    
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()
  })
}

const performMaintenance = () => {
  // TODO: Implement maintenance scheduling
  console.log('安排維護:', props.vehicle.id)
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  
  // Draw battery trend chart
  if (chartCanvas.value && props.vehicle.batteryTrend) {
    const batteryData = props.vehicle.batteryTrend.map((t: any) => t.v)
    drawChart(chartCanvas.value, batteryData, '#10b981')
  }
  
  // Draw SOH chart (mock data)
  if (sohChartCanvas.value) {
    const sohData = Array.from({ length: 30 }, (_, i) => {
      return Math.max(70, props.vehicle.soh - Math.random() * 5 + Math.random() * 3)
    })
    drawChart(sohChartCanvas.value, sohData, '#f59e0b')
  }
})
</script>