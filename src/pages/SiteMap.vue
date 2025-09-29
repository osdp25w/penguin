<template>
  <!-- 新的佈局：左側邊欄 + 主內容區 -->
  <div class="flex h-screen bg-gray-50">

    <!-- 主內容區 -->
    <main class="flex-1 flex flex-col">
      <!-- 上方工具列 (白底、陰影、sticky) -->
      <header class="bg-white shadow-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div class="flex items-center justify-between">
          <!-- 左側控制組 -->
          <div class="flex items-center space-x-4">
            <!-- 場域選擇 -->
            <div class="flex items-center space-x-2">
              <label class="text-sm font-medium text-gray-700">場域地點</label>
              <select 
                v-model="selectedSiteId"
                class="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">全部場域</option>
                <option
                  v-for="site in sitesStore.list"
                  :key="site.id"
                  :value="site.id"
                >
                  {{ site.name }}
                </option>
              </select>
            </div>
            
            <!-- 地圖資訊選擇 -->
            <div class="flex items-center space-x-2">
              <label class="text-sm font-medium text-gray-700">地圖資訊</label>
              <select
                v-model="displayMode"
                class="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                @change="handleDisplayModeChange"
              >
                <option value="realtime">即時位置</option>
                <option v-if="canViewHistory" value="history">歷史位置</option>
              </select>
            </div>
          </div>
          
          <!-- 右側控制組 -->
          <div class="flex items-center space-x-4">
            <!-- 時段選擇 - 只在歷史模式下顯示 -->
            <div v-if="displayMode === 'history'" class="flex items-center space-x-3">
              <div class="flex items-center space-x-1">
                <label class="text-xs text-gray-500 self-center">起</label>
                <input
                  v-model="startDate"
                  type="date"
                  class="h-8 px-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  v-model="startHour"
                  class="h-8 px-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option v-for="hour in hourOptions" :key="hour" :value="hour">
                    {{ hour }}:00
                  </option>
                </select>
              </div>

              <span class="text-gray-400 self-center">-</span>

              <div class="flex items-center space-x-1">
                <label class="text-xs text-gray-500 self-center">迄</label>
                <input
                  v-model="endDate"
                  type="date"
                  class="h-8 px-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  v-model="endHour"
                  class="h-8 px-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option v-for="hour in hourOptions" :key="hour" :value="hour">
                    {{ hour }}:00
                  </option>
                </select>
              </div>
            </div>
            
            <!-- 搜尋框 -->
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜尋車輛/編號/標籤"
                class="h-8 pl-8 pr-3 border border-gray-300 rounded-md text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <i class="i-ph-magnifying-glass absolute left-2.5 top-2 w-4 h-4 text-gray-400"></i>
            </div>

            <!-- 套用按鈕 -->
            <button class="h-8 px-4 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              套用
            </button>
          </div>
        </div>
      </header>

      <!-- 下方兩欄內容 -->
      <div class="flex-1 flex overflow-hidden">
        <!-- 左欄：地圖 -->
        <div class="flex-1 p-4">
          <div class="h-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <!-- 地圖容器 -->
            <MapLibreMap 
              :sites="displayMode === 'realtime' ? undefined : sitesStore.filteredSites"
              :vehicles="displayMode === 'realtime' ? filteredRealtimeVehicles : undefined"
              :vehicle-traces="displayMode === 'history' ? filteredTraces : undefined"
              :selected="selectedItem"
              :display-mode="displayMode === 'realtime' ? 'vehicles' : (displayMode === 'history' ? 'history' : 'sites')"
              :default-center="mapCenter"
              @select="handleMapSelect"
            />
          </div>
        </div>

        <!-- 右欄：車輛清單 (360-380px 寬，可捲動，sticky) -->
        <div class="w-96 bg-white border-l border-gray-200 flex flex-col sticky right-0">
          <!-- 右欄頂部：統計和篩選 -->
          <div class="p-4 border-b border-gray-200">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ displayMode === 'history'
                    ? `軌跡過濾 (${Object.keys(filteredTraces || {}).length}/${Object.keys(filteredVehicleTraces || {}).length})`
                    : `車輛過濾 (${filteredRealtimeVehicles.length}/${totalVehicles})`
                }}
              </h3>
            </div>
            
            <!-- 歷史模式軌跡過濾器 -->
            <VehicleTraceFilter 
              v-if="displayMode === 'history'"
              v-model="selectedTraceVehicles"
              :available-vehicles="availableTraceVehicles"
            />
            
            <!-- 即時模式車輛過濾器 -->
            <VehicleFilter
              v-else
              v-model="selectedRealtimeVehicles"
              :available-vehicles="availableVehiclesForFilter"
            />
          </div>


          <!-- 車輛卡片清單 -->
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            <template v-if="displayMode === 'history'">
              <div v-if="historyLoading" class="flex items-center justify-center text-sm text-gray-500">
                <i class="i-ph-spinner mr-2 animate-spin w-4 h-4"></i>
                載入軌跡中...
              </div>
              <div v-else-if="historyError" class="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {{ historyError }}
              </div>
              <div v-else-if="historyRoutes.length === 0" class="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                目前時段沒有軌跡資料
              </div>
              <div 
                v-else 
                v-for="route in historyRoutes"
                :key="route.id"
                :class="{ 'ring-2 ring-indigo-500 bg-indigo-50': selectedTraceVehicles.includes(route.id) }"
                class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                @click="focusTrace(route.id)"
              >
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-semibold text-gray-900">{{ route.label }}</h4>
                  <span class="text-xs text-gray-500">{{ formatRouteTime(route.createdAt) }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div class="flex items-center space-x-1">
                    <i class="i-ph-map-trifold w-4 h-4"></i>
                    <span>{{ formatDistance(route.distanceMeters) }}</span>
                  </div>
                  <div class="flex items-center space-x-1">
                    <i class="i-ph-dots-three-outline w-4 h-4"></i>
                    <span>{{ route.pointCount }} 點</span>
                  </div>
                  <div v-if="route.averageConfidence != null" class="flex items-center space-x-1 col-span-2">
                    <i class="i-ph-target w-4 h-4"></i>
                    <span>匹配信心 {{ (route.averageConfidence * 100).toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div 
                v-for="vehicle in filteredRealtimeVehicles" 
                :key="vehicle.id"
                :class="{ 'ring-2 ring-indigo-500 bg-indigo-50': highlightedVehicle === vehicle.id }"
                class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                @click="selectVehicle(vehicle)"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center space-x-2">
                    <h4 class="font-semibold text-gray-900">{{ vehicle.id }}</h4>
                    <span :class="getStatusBadgeClass(vehicle.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                      {{ getStatusText(vehicle.status) }}
                    </span>
                  </div>
                </div>
                <div v-if="vehicle.currentMember" class="mb-2 p-2 bg-blue-50 rounded text-sm">
                  <div class="flex items-center space-x-1 text-blue-700">
                    <i class="i-ph-user w-4 h-4"></i>
                    <span class="font-medium">租借者: {{ vehicle.currentMember.name }}</span>
                  </div>
                  <div class="text-blue-600 text-xs mt-1">
                    電話: {{ vehicle.currentMember.phone }}
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                  <div class="flex items-center space-x-1">
                    <i class="i-ph-gauge w-4 h-4"></i>
                    <span>{{ vehicle.vehicleSpeed || vehicle.speedKph || 0 }} km/h</span>
                  </div>
                  <div class="flex items-center space-x-1">
                    <i class="i-ph-battery-high w-4 h-4"></i>
                    <span>{{ vehicle.batteryPct }}%</span>
                  </div>
                  <div class="flex items-center space-x-1">
                    <i class="i-ph-map-pin w-4 h-4"></i>
                    <span>
                      {{ typeof vehicle.lat === 'number' ? vehicle.lat.toFixed(6) : '—' }},
                      {{ typeof vehicle.lon === 'number' ? vehicle.lon.toFixed(6) : '—' }}
                    </span>
                  </div>
                  <div class="flex items-center space-x-1">
                    <i class="i-ph-clock w-4 h-4"></i>
                    <span>{{ getRelativeTime(vehicle.lastSeen || new Date().toISOString()) }}</span>
                  </div>
                </div>
                <div v-if="(vehicle.status === '使用中' || vehicle.status === 'in-use') && vehicle.currentMember && vehicle.currentMember.name" class="mb-3">
                  <div class="flex items-center space-x-1 text-sm text-blue-700">
                    <i class="i-ph-user w-4 h-4"></i>
                    <span>{{ vehicle.currentMember.name }}</span>
                  </div>
                </div>
                <div class="flex justify-end">
                  <button 
                    v-if="canRentVehicle(vehicle)"
                    :title="getRentButtonTooltip(vehicle)"
                    @click="handleRentVehicle(vehicle)"
                    class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <i class="i-ph-key w-4 h-4 mr-1"></i>
                    租借
                  </button>
                  <button 
                    v-else-if="canReturnVehicle(vehicle)"
                    @click="handleReturnVehicle(vehicle)"
                    class="px-3 py-1.5 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                  >
                    <i class="i-ph-handbag w-4 h-4 mr-1"></i>
                    歸還
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </main>
  </div>

  <!-- 租借對話框 -->
  <RentDialog
    :show="showRentDialog"
    :vehicle="selectedVehicleForRent"
    @close="handleCloseRentDialog"
    @success="handleRentSuccess"
  />

  <!-- 租借成功對話框 -->
  <RentSuccessDialog
    :show="showRentSuccessDialog"
    :rental="currentRental"
    @close="handleCloseSuccessDialog"
  />

  <!-- 簡化歸還確認對話框 -->
  <SimpleReturnDialog
    :show="showReturnDialog"
    :vehicle="selectedReturnVehicle"
    @close="handleCloseReturnDialog"
    @success="onReturnSuccess"
  />

  <!-- 成功通知對話框 -->
  <div v-if="showSuccessNotification" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl p-8 max-w-md w-full transform animate-bounce-in">
      <div class="flex flex-col items-center text-center">
        <!-- 成功圖示 -->
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <i class="i-ph-check-circle-fill w-12 h-12 text-green-600"></i>
        </div>

        <!-- 訊息 -->
        <h3 class="text-xl font-bold text-gray-900 mb-2">歸還成功！</h3>
        <p class="text-gray-600 mb-4">{{ successMessage }}</p>

        <!-- 自動刷新提示 -->
        <div class="bg-blue-50 rounded-lg px-4 py-3 w-full">
          <i class="i-ph-spinner w-5 h-5 text-blue-600 animate-spin inline-block mr-2"></i>
          <span class="text-sm text-blue-700">1 秒後將自動刷新頁面...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useSites } from '@/stores/sites'
import { useVehicles } from '@/stores/vehicles'  
import { useBikeMeta } from '@/stores/bikeMeta'
import { useAlerts } from '@/stores/alerts'
import { useReturns } from '@/stores/returns'
import { useRentals } from '@/stores/rentals'
import MapLibreMap from '@/components/map/MapLibreMap.vue'
import RentDialog from '@/components/rent/RentDialog.vue'
import RentSuccessDialog from '@/components/rent/RentSuccessDialog.vue'
import SimpleReturnDialog from '@/components/returns/SimpleReturnDialog.vue'
import VehicleTraceFilter from '@/components/filters/VehicleTraceFilter.vue'
import VehicleFilter from '@/components/filters/VehicleFilter.vue'
import type { Site } from '@/types/site'
import { useAuth } from '@/stores/auth'
import { http } from '@/lib/api'
import { subscribeRealtimeStatus, setRealtimeStatusConnectionCallback } from '@/services/koala_realtime_ws'
import type { BikeRealtimeStatusUpdate } from '@/services/koala_realtime_ws'

interface RouteTraceMeta {
  label: string
  createdAt?: string
  distanceMeters?: number
  averageConfidence?: number
  memberName?: string
}

// ECharts 註冊
use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

// Stores
const sitesStore = useSites()
const vehiclesStore = useVehicles()
const bikeMeta = useBikeMeta()
const alertsStore = useAlerts()
const returnsStore = useReturns()
const rentalsStore = useRentals()
const auth = useAuth()

// 權限控制
const canViewHistory = computed(() => {
  const role = auth.user?.roleId
  return role === 'admin' || role === 'staff'
})

// 監聽權限變化，如果沒有權限查看歷史，自動切換到即時模式
watch(canViewHistory, (hasPermission) => {
  if (!hasPermission && displayMode.value === 'history') {
    displayMode.value = 'realtime'
  }
})

// 響應式狀態
const showSetupGuide = ref(false)
const showSeedGuide = ref(false)
const showReturnModal = ref(false)
const showRentModal = ref(false)
const recentReturns = ref<any[]>([])

// 新的響應式狀態
const selectedSiteId = ref<string>('')
const selectedSite = computed(() => {
  if (!selectedSiteId.value) return null
  return sitesStore.list.find(site => site.id === selectedSiteId.value) ?? null
})
const displayMode = ref('realtime')
const selectedItem = ref<any>(null)
const highlightedVehicle = ref<string | null>(null)
const searchQuery = ref('')
const defaultEndTime = formatDateToLocalHour(new Date())
const defaultStartTime = formatDateToLocalHour(new Date(Date.now() - 24 * 60 * 60 * 1000))
const timeRange = ref({
  start: defaultStartTime,
  end: defaultEndTime
})
const hourOptions = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))
const startDate = computed({
  get: () => extractDatePart(timeRange.value.start),
  set: (value: string) => {
    updateTimeRange('start', value, extractHourPart(timeRange.value.start))
  }
})
const startHour = computed({
  get: () => extractHourPart(timeRange.value.start),
  set: (value: string) => {
    updateTimeRange('start', extractDatePart(timeRange.value.start), value)
  }
})
const endDate = computed({
  get: () => extractDatePart(timeRange.value.end),
  set: (value: string) => {
    updateTimeRange('end', value, extractHourPart(timeRange.value.end))
  }
})
const endHour = computed({
  get: () => extractHourPart(timeRange.value.end),
  set: (value: string) => {
    updateTimeRange('end', extractDatePart(timeRange.value.end), value)
  }
})
const selectedVehicle = ref<any>(null)
const realtimeWsConnected = ref(false)

let realtimeWsUnsubscribe: (() => void) | null = null

// 軌跡過濾相關狀態
const selectedTraceVehicles = ref<string[]>([])
const filteredVehicleTraces = ref<Record<string, any[]>>({})

// 即時車輛過濾相關狀態
const selectedRealtimeVehicles = ref<string[]>([])
// 區分「未套用選擇（顯示全部）」與「已套用選擇但為空（顯示無資料）」
const selectionApplied = ref(false)
const realtimeVehicles = ref<any[]>([])
const showRentDialog = ref(false)
const selectedVehicleForRent = ref<any>(null)
const showReturnDialog = ref(false)
const selectedReturnVehicle = ref<any>(null)

// 成功通知相關
const showSuccessNotification = ref(false)
const successMessage = ref('')
const showRentSuccessDialog = ref(false)
const currentRental = ref<any>(null)
const routeTraceMeta = ref<Record<string, RouteTraceMeta>>({})
const historyLoading = ref(false)
const historyError = ref<string | null>(null)

interface HistoryPagination {
  count: number
  next: string | null
  previous: string | null
}

const historyPagination = ref<HistoryPagination>({
  count: 0,
  next: null,
  previous: null
})

let historyRequestToken = 0

const seedMockEnabled = computed(() => import.meta.env.VITE_SEED_MOCK === '1')

const SITE_RADIUS_KM = 0.5

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => deg * Math.PI / 180
  const R = 6371 // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function isVehicleNearSite(vehicle: any, site: Site, radiusKm = SITE_RADIUS_KM): boolean {
  const lat = typeof vehicle?.lat === 'number' ? vehicle.lat : vehicle?.location?.lat
  const lon = typeof vehicle?.lon === 'number' ? vehicle.lon : vehicle?.location?.lng
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false
  const distance = haversineDistanceKm(lat, lon, site.location.lat, site.location.lng)
  return distance <= radiusKm
}

function formatDateToLocalHour(date: Date): string {
  const localDate = new Date(date.getTime())
  localDate.setMinutes(0, 0, 0)
  const year = localDate.getFullYear()
  const month = `${localDate.getMonth() + 1}`.padStart(2, '0')
  const day = `${localDate.getDate()}`.padStart(2, '0')
  const hour = `${localDate.getHours()}`.padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:00`
}

function extractDatePart(value: string | undefined): string {
  if (!value || !value.includes('T')) return value?.slice(0, 10) || ''
  return value.split('T')[0]
}

function extractHourPart(value: string | undefined): string {
  if (!value || !value.includes('T')) return '00'
  const timeSegment = value.split('T')[1] || '00:00'
  return timeSegment.slice(0, 2)
}

function normalizeHour(value: string | undefined): string {
  const parsed = Number.parseInt(value ?? '', 10)
  if (Number.isFinite(parsed) && parsed >= 0 && parsed < 24) {
    return String(parsed).padStart(2, '0')
  }
  return '00'
}

function composeLocalIso(date: string, hour: string): string {
  const safeDate = date || ''
  if (!safeDate) return ''
  const normalizedHour = normalizeHour(hour)
  return `${safeDate}T${normalizedHour}:00`
}

function updateTimeRange(edge: 'start' | 'end', date: string, hour: string) {
  if (!date) {
    return
  }
  const nextValue = composeLocalIso(date, hour)
  if (!nextValue) {
    return
  }
  timeRange.value = {
    ...timeRange.value,
    [edge]: nextValue
  }
}

function toUtcIso(value: string | undefined): string | null {
  if (!value) {
    return null
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed.toISOString()
}

function formatRouteTime(iso?: string): string {
  if (!iso) {
    return '時間未知'
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return '時間未知'
  }
  return date.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDistance(meters?: number): string {
  if (typeof meters !== 'number' || Number.isNaN(meters)) {
    return '—'
  }
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`
  }
  return `${Math.round(meters)} m`
}

// 已移除 mock 車輛資料，改用真實 API 資料 (realtimeVehicles)

// 軌跡資料將從真實 API 載入，暫時設為空
/*
const mockVehicleTraces = computed(() => ({
  'BIKE001': [
    // 花蓮火車站 → 東大門夜市 → 返回
    { lat: 23.9917, lon: 121.6014, timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() }, // 1小時前出發
    { lat: 23.9870, lon: 121.6035, timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString() },
    { lat: 23.9820, lon: 121.6050, timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString() },
    { lat: 23.9750, lon: 121.6060, timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString() }, // 到達夜市
    { lat: 23.9800, lon: 121.6040, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { lat: 23.9880, lon: 121.6025, timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { lat: 23.9917, lon: 121.6014, timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() }  // 返回火車站
  ],
  'BIKE002': [
    // 東大門夜市 → 花蓮港 → 海洋公園
    { lat: 23.9750, lon: 121.6060, timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString() }, // 1.5小時前出發
    { lat: 23.9745, lon: 121.6100, timestamp: new Date(Date.now() - 80 * 60 * 1000).toISOString() },
    { lat: 23.9740, lon: 121.6150, timestamp: new Date(Date.now() - 70 * 60 * 1000).toISOString() },
    { lat: 23.9739, lon: 121.6175, timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() }, // 到達花蓮港
    { lat: 23.9500, lon: 121.6170, timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
    { lat: 23.9200, lon: 121.6172, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { lat: 23.8979, lon: 121.6172, timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() }   // 到達海洋公園
  ],
  'BIKE003': [
    // 花蓮港 → 縣政府 → 美崙山公園
    { lat: 23.9739, lon: 121.6175, timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString() }, // 2小時前出發
    { lat: 23.9750, lon: 121.6120, timestamp: new Date(Date.now() - 100 * 60 * 1000).toISOString() },
    { lat: 23.9800, lon: 121.6080, timestamp: new Date(Date.now() - 80 * 60 * 1000).toISOString() },
    { lat: 23.9847, lon: 121.6064, timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() },  // 到達縣政府
    { lat: 23.9800, lon: 121.6050, timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
    { lat: 23.9730, lon: 121.6035, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { lat: 23.9709, lon: 121.6028, timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() }   // 到達美崙山公園
  ],
  'BIKE004': [
    // 海洋公園沿海岸移動
    { lat: 23.8979, lon: 121.6172, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() }, // 30分鐘前
    { lat: 23.8990, lon: 121.6175, timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
    { lat: 23.9000, lon: 121.6170, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { lat: 23.8985, lon: 121.6173, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
    { lat: 23.8979, lon: 121.6172, timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString() }   // 返回原點
  ],
  'BIKE005': [
    // 縣政府周邊移動
    { lat: 23.9847, lon: 121.6064, timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() }, // 45分鐘前
    { lat: 23.9850, lon: 121.6070, timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
    { lat: 23.9845, lon: 121.6060, timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString() },
    { lat: 23.9847, lon: 121.6064, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() }  // 停在縣政府
  ],
  'BIKE006': [
    // 中華紙漿 → 火車站 → 松園別館
    { lat: 23.9739, lon: 121.5994, timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString() }, // 1.25小時前
    { lat: 23.9800, lon: 121.6000, timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    { lat: 23.9880, lon: 121.6010, timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    { lat: 23.9917, lon: 121.6014, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() }, // 經過火車站
    { lat: 23.9850, lon: 121.6050, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
    { lat: 23.9853, lon: 121.6097, timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() }   // 到達松園別館
  ],
  'BIKE007': [
    // 美崙山公園 → 慈濟醫院 → 曼波海灘
    { lat: 23.9709, lon: 121.6028, timestamp: new Date(Date.now() - 100 * 60 * 1000).toISOString() }, // 100分鐘前
    { lat: 23.9750, lon: 121.6010, timestamp: new Date(Date.now() - 80 * 60 * 1000).toISOString() },
    { lat: 23.9780, lon: 121.6000, timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    { lat: 23.9786, lon: 121.5996, timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString() }, // 到達慈濟醫院
    { lat: 23.9760, lon: 121.6050, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { lat: 23.9750, lon: 121.6120, timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { lat: 23.9750, lon: 121.6150, timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString() }   // 到達曼波海灘
  ],
  'BIKE008': [
    // 慈濟醫院 → 創意文化園區 → 火車站
    { lat: 23.9786, lon: 121.5996, timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() }, // 1小時前
    { lat: 23.9750, lon: 121.6020, timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    { lat: 23.9720, lon: 121.6060, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { lat: 23.9715, lon: 121.6080, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() }, // 到達文化園區
    { lat: 23.9850, lon: 121.6050, timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { lat: 23.9917, lon: 121.6014, timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString() }   // 到達火車站
  ],
  'BIKE009': [
    // 市公所 → 東大門夜市 → 文化園區
    { lat: 23.9847, lon: 121.6064, timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString() },
    { lat: 23.9800, lon: 121.6060, timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
    { lat: 23.9750, lon: 121.6060, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() }, // 夜市
    { lat: 23.9720, lon: 121.6070, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { lat: 23.9715, lon: 121.6080, timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString() }  // 文化園區
  ],
  'BIKE010': [
    // 松園別館沿海移動
    { lat: 23.9853, lon: 121.6097, timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString() },
    { lat: 23.9850, lon: 121.6120, timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
    { lat: 23.9855, lon: 121.6110, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
    { lat: 23.9853, lon: 121.6097, timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString() }
  ],
  'BIKE011': [
    // 曼波海灘沿海岸線
    { lat: 23.9750, lon: 121.6150, timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
    { lat: 23.9745, lon: 121.6155, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
    { lat: 23.9755, lon: 121.6145, timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
    { lat: 23.9750, lon: 121.6150, timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString() }
  ],
  'BIKE012': [
    // 創意文化園區內移動
    { lat: 23.9715, lon: 121.6080, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { lat: 23.9720, lon: 121.6085, timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
    { lat: 23.9710, lon: 121.6075, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { lat: 23.9715, lon: 121.6080, timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString() }
  ]
}))
*/

// 計算車輛分布的中心點和最佳縮放級別
const DEFAULT_CENTER = { lat: 23.9739, lng: 121.6014 }

const mapCenter = computed(() => {
  if (displayMode.value === 'realtime') {
    const site = selectedSite.value
    if (site) {
      return {
        lat: site.location.lat,
        lng: site.location.lng,
        zoom: 15
      }
    }
  }

  if (displayMode.value === 'history') {
    const tracesData = filteredVehicleTraces.value || {}
    const traces = selectedTraceVehicles.value.length
      ? selectedTraceVehicles.value.map(id => tracesData[id]).filter(Boolean)
      : Object.values(tracesData)

    const points = traces.flat().filter(point => typeof point?.lat === 'number' && typeof point?.lon === 'number')

    if (points.length > 0) {
      const lats = points.map(point => point.lat)
      const lngs = points.map(point => point.lon)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      const minLng = Math.min(...lngs)
      const maxLng = Math.max(...lngs)
      const centerLat = (minLat + maxLat) / 2
      const centerLng = (minLng + maxLng) / 2
      const latDiff = maxLat - minLat
      const lngDiff = maxLng - minLng
      const maxDiff = Math.max(latDiff, lngDiff)
      let zoom = 13
      if (maxDiff > 0.1) zoom = 10
      else if (maxDiff > 0.05) zoom = 11
      else if (maxDiff > 0.02) zoom = 12
      else if (maxDiff > 0.01) zoom = 13
      else zoom = 14
      return { lat: centerLat, lng: centerLng, zoom }
    }
  }

  const site = selectedSite.value
  if (displayMode.value === 'realtime' && site) {
    return {
      lat: site.location.lat,
      lng: site.location.lng,
      zoom: 15
    }
  }

  const vehicles = realtimeVehicles.value
  if (vehicles.length === 0) {
    return { ...DEFAULT_CENTER, zoom: 12 }
  }

  const lats = vehicles
    .map((v:any) => typeof v.lat === 'number' ? v.lat : v.location?.lat)
    .filter((value: any): value is number => Number.isFinite(value))
  const lngs = vehicles
    .map((v:any) => typeof v.lon === 'number' ? v.lon : v.location?.lng)
    .filter((value: any): value is number => Number.isFinite(value))

  if (lats.length === 0 || lngs.length === 0) {
    return { ...DEFAULT_CENTER, zoom: 12 }
  }

  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  const centerLat = (minLat + maxLat) / 2
  const centerLng = (minLng + maxLng) / 2

  const latDiff = maxLat - minLat
  const lngDiff = maxLng - minLng
  const maxDiff = Math.max(latDiff, lngDiff)

  let zoom = 13
  if (maxDiff > 0.1) zoom = 10
  else if (maxDiff > 0.05) zoom = 11
  else if (maxDiff > 0.02) zoom = 12
  else if (maxDiff > 0.01) zoom = 13
  else zoom = 14

  return {
    lat: centerLat,
    lng: centerLng,
    zoom
  }
})

// 軌跡過濾相關計算屬性
const availableTraceVehicles = computed(() => {
  const traces = filteredVehicleTraces.value || {}
  const vehicleColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]

  return Object.entries(traces).map(([vehicleId, trace], index) => ({
    id: vehicleId,
    label: routeTraceMeta.value[vehicleId]?.label,
    color: vehicleColors[index % vehicleColors.length],
    pointCount: trace.length
  }))
})

const filteredTraces = computed(() => {
  const traces = filteredVehicleTraces.value || {}

  if (selectedTraceVehicles.value.length === 0) {
    return traces
  }

  const filtered: Record<string, any[]> = {}
  selectedTraceVehicles.value.forEach(vehicleId => {
    if (traces[vehicleId]) {
      filtered[vehicleId] = traces[vehicleId]
    }
  })

  return filtered
})

const historyRoutes = computed(() => {
  return Object.entries(filteredTraces.value)
    .map(([traceId, trace]) => ({
      id: traceId,
      label: routeTraceMeta.value[traceId]?.label || traceId,
      createdAt: routeTraceMeta.value[traceId]?.createdAt,
      distanceMeters: routeTraceMeta.value[traceId]?.distanceMeters,
      averageConfidence: routeTraceMeta.value[traceId]?.averageConfidence,
      pointCount: trace.length
    }))
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })
})

// 即時車輛過濾邏輯
const filteredRealtimeVehicles = computed(() => {
  let list: any[] = realtimeVehicles.value

  const brandFilters = sitesStore.filters.brands
  if (brandFilters.length > 0) {
    // 後端尚未提供車輛與場域直接關聯，暫不依品牌過濾
  }

  const site = selectedSite.value
  if (site) {
    list = list.filter(vehicle => isVehicleNearSite(vehicle, site))
  }

  // 權限濾除：member 不顯示使用中
  const role = auth.user?.roleId
  if (role !== 'admin' && role !== 'staff') {
    const currentUserId = auth.user?.id
    const currentUserEmail = auth.user?.email?.toLowerCase() || ''
    list = list.filter((v) => {
      const status = v.status || ''
      if (status === '使用中' || status === 'in-use') {
        const member = v.currentMember || {}
        const memberId = member.id != null ? String(member.id) : null
        const memberEmail = (member.email || member.memberEmail || '').toLowerCase()
        if (memberId && currentUserId && memberId === String(currentUserId)) return true
        if (memberEmail && currentUserEmail && memberEmail === currentUserEmail) return true
        return false
      }
      return true
    })
  }

  // （移除頁面級狀態過濾，統一由右側 VehicleFilter 控制）

  // 搜尋過濾（上方搜尋框）
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(v => {
      // 搜尋車輛ID (bike_id)
      const idMatch = String(v.id || '').toLowerCase().includes(q)

      // 搜尋車輛名稱，但排除與ID重複的情況
      const vehicleName = String(v.name || '').toLowerCase()
      const nameMatch = vehicleName && vehicleName !== String(v.id || '').toLowerCase() && vehicleName.includes(q)

      // 搜尋車型
      const modelMatch = String(v.model || '').toLowerCase().includes(q)

      // 搜尋站點名稱
      const siteMatch = String(v.siteName || '').toLowerCase().includes(q)

      return idMatch || nameMatch || modelMatch || siteMatch
    })
  }

  // 清單選取（右側 VehicleFilter）
  if (selectionApplied.value) {
    if (selectedRealtimeVehicles.value.length === 0) {
      return [] // 明確「全部取消選擇」時顯示空
    }
    const picked = new Set(selectedRealtimeVehicles.value.map(String))
    list = list.filter(v => picked.has(String(v.id)))
  }

  return list
})

// 供右側 VehicleFilter 顯示的候選清單（受上方搜尋與角色限制影響）
const availableVehiclesForFilter = computed(() => {
  let list: any[] = realtimeVehicles.value

  const brandFilters = sitesStore.filters.brands
  if (brandFilters.length > 0) {
    // 後端尚未提供車輛與場域直接關聯，暫不依品牌過濾
  }
  const site = selectedSite.value
  if (site) {
    list = list.filter(vehicle => isVehicleNearSite(vehicle, site))
  }
  // 角色限制：member 不顯示使用中（但保留自己的租借中車輛）
  const role = auth.user?.roleId
  if (role !== 'admin' && role !== 'staff') {
    const currentUserId = auth.user?.id
    const currentUserEmail = auth.user?.email?.toLowerCase() || ''
    list = list.filter(v => {
      if (v.status === '使用中' || v.status === 'in-use') {
        const member = v.currentMember || {}
        const memberId = member.id != null ? String(member.id) : null
        const memberEmail = (member.email || member.memberEmail || '').toLowerCase()
        if (memberId && currentUserId && memberId === String(currentUserId)) return true
        if (memberEmail && currentUserEmail && memberEmail === currentUserEmail) return true
        return false
      }
      return true
    })
  }
  // 上方搜尋框
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(v => String(v.id).toLowerCase().includes(q) || String(v.name || '').toLowerCase().includes(q))
  }
  return list
})

// 監聽右側清單的變化以標記 selectionApplied
watch(selectedRealtimeVehicles, () => {
  selectionApplied.value = true
})

watch(timeRange, () => {
  if (displayMode.value === 'history') {
    loadHistoryTrajectories()
  }
}, { deep: true })

watch(selectedSite, (site) => {
  if (site) {
    sitesStore.selectSite(site)
    selectedItem.value = {
      ...site,
      type: 'site',
      center: {
        lat: site.location.lat,
        lng: site.location.lng,
        zoom: 15
      },
      lat: site.location.lat,
      lon: site.location.lng
    }
    selectionApplied.value = false
  } else {
    sitesStore.selectSite(undefined)
    selectedItem.value = null
    selectionApplied.value = false
  }

  if (displayMode.value === 'history') {
    loadHistoryTrajectories()
  } else {
    loadRealtimePositions()
  }
})

// 計算屬性
const totalVehicles = computed(() => {
  if (displayMode.value === 'realtime') {
    return realtimeVehicles.value.length
  }
  return sitesStore.filteredSites.reduce((sum, site) => sum + site.vehicleCount, 0)
})

const availableVehicles = computed(() => {
  if (displayMode.value === 'realtime') {
    return realtimeVehicles.value.filter((v:any) => v.status === 'available' || v.status === '可租借').length
  }
  return sitesStore.filteredSites.reduce((sum, site) => sum + site.availableCount, 0)
})

const siteVehicleCounts = computed(() => {
  const counts = new Map<string, number>()
  sitesStore.list.forEach(site => counts.set(site.id, 0))

  realtimeVehicles.value.forEach(vehicle => {
    const lat = typeof vehicle?.lat === 'number' ? vehicle.lat : vehicle?.location?.lat
    const lon = typeof vehicle?.lon === 'number' ? vehicle.lon : vehicle?.location?.lng
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
    const nearest = findNearestSite(lat, lon)
    if (nearest) {
      counts.set(nearest.id, (counts.get(nearest.id) ?? 0) + 1)
    }
  })

  return counts
})

const siteVehicles = computed(() => {
  if (!sitesStore.selected) return []
  return vehiclesStore.getVehiclesBySite(sitesStore.selected.id)
})

const recentAlerts = computed(() => {
  if (!sitesStore.selected) return []
  return alertsStore.getRecentAlertsBySite(sitesStore.selected.id, 5)
})

// 圖表配置
const chartTheme = 'light'
const chartOption = computed(() => {
  const labels = sitesStore.list.map(site => site.name)
  const counts = siteVehicleCounts.value
  const values = sitesStore.list.map(site => counts.get(site.id) ?? 0)

  return {
    grid: { top: 20, right: 20, bottom: 20, left: 40 },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } }
    },
    series: [{
      data: values,
      type: 'bar',
      itemStyle: { color: '#6366f1' },
      barWidth: '40%'
    }]
  }
})

// 工具函式
function getStatusBadgeClass(status: string): string {
  const statusClasses = {
    '可租借': 'bg-green-100 text-green-800',
    '使用中': 'bg-blue-100 text-blue-800',
    '離線': 'bg-gray-100 text-gray-800',
    '維修': 'bg-yellow-100 text-yellow-800',
    '低電量': 'bg-red-100 text-red-800',
    // 兼容舊狀態
    'available': 'bg-green-100 text-green-800',
    'in-use': 'bg-blue-100 text-blue-800',
    'rented': 'bg-purple-100 text-purple-800',
    'maintenance': 'bg-yellow-100 text-yellow-800',
    'charging': 'bg-cyan-100 text-cyan-800',
    'low-battery': 'bg-red-100 text-red-800'
  }
  return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'
}

function getRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins < 1) return '剛剛'
  if (diffMins < 60) return `${diffMins}分鐘前`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}小時前`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}天前`
}

function selectVehicle(vehicle: any) {
  selectedItem.value = vehicle
  highlightedVehicle.value = vehicle.id
  // TODO: 高亮地圖上的車輛位置並居中
}

function focusTrace(traceId: string): void {
  const traces = filteredVehicleTraces.value || {}
  if (!traces[traceId]) {
    return
  }

  // 如果當前只選中了這個 traceId，則取消選取（顯示全部）
  if (selectedTraceVehicles.value.length === 1 && selectedTraceVehicles.value[0] === traceId) {
    // 恢復顯示所有軌跡
    selectedTraceVehicles.value = Object.keys(traces)
  } else {
    // 否則只選中這個 traceId
    selectedTraceVehicles.value = [traceId]

    // 計算該路線的中心點並縮放地圖
    const tracePoints = traces[traceId]
    if (tracePoints && tracePoints.length > 0) {
      const validPoints = tracePoints.filter(point =>
        typeof point?.lat === 'number' && typeof point?.lon === 'number'
      )

      if (validPoints.length > 0) {
        const lats = validPoints.map(p => p.lat)
        const lngs = validPoints.map(p => p.lon)
        const minLat = Math.min(...lats)
        const maxLat = Math.max(...lats)
        const minLng = Math.min(...lngs)
        const maxLng = Math.max(...lngs)

        // 計算適當的縮放級別
        const latDiff = maxLat - minLat
        const lngDiff = maxLng - minLng
        const maxDiff = Math.max(latDiff, lngDiff)

        let zoom = 14
        if (maxDiff > 0.1) zoom = 11
        else if (maxDiff > 0.05) zoom = 12
        else if (maxDiff > 0.02) zoom = 13
        else if (maxDiff > 0.01) zoom = 14
        else zoom = 15

        // 觸發地圖中心更新
        selectedItem.value = {
          type: 'trace',
          id: traceId,
          center: {
            lat: (minLat + maxLat) / 2,
            lng: (minLng + maxLng) / 2,
            zoom: zoom
          }
        }
      }
    }
  }
}

function getStatusText(status: string): string {
  const texts = {
    '可租借': '可租借',
    '使用中': '使用中',
    '離線': '離線',
    '維修': '維修中',
    '低電量': '低電量',
    // 兼容舊狀態
    active: '正常運行',
    maintenance: '維修中',
    offline: '離線',
    available: '可用',
    rented: '租借中',
    charging: '充電中'
  }
  return texts[status as keyof typeof texts] || status
}

function getAlertColor(severity: string): string {
  const colors = {
    info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    error: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    critical: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
  }
  return colors[severity as keyof typeof colors] || colors.info
}

function getBatteryColor(level: number): string {
  if (level > 70) return '#10b981'  // green
  if (level > 30) return '#f59e0b'  // yellow
  return '#ef4444'                  // red
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleString('zh-TW')
}

async function handleDisplayModeChange(): Promise<void> {
  console.log('顯示模式切換至:', displayMode.value)
  if (displayMode.value === 'history') {
    // 載入歷史軌跡資料
    await loadHistoryTrajectories()
  } else {
    // 載入即時位置資料
    await loadRealtimePositions()
  }
}

async function loadHistoryTrajectories(): Promise<void> {
  const requestId = ++historyRequestToken
  historyLoading.value = true
  historyError.value = null

  try {
    const startIso = toUtcIso(timeRange.value.start)
    const endIso = toUtcIso(timeRange.value.end)
    let effectiveStart = startIso
    let effectiveEnd = endIso
    if (effectiveStart && effectiveEnd) {
      const startDate = new Date(effectiveStart)
      const endDate = new Date(effectiveEnd)
      if (startDate > endDate) {
        effectiveStart = endIso
        effectiveEnd = startIso
      }
    }

    const params = new URLSearchParams({ limit: '20' })
    if (effectiveStart) params.set('created_at__gte', effectiveStart)
    if (effectiveEnd) params.set('created_at__lte', effectiveEnd)
    if (selectedSite.value) {
      params.set('site_id', selectedSite.value.id)
    }

    const query = params.toString()
    const response: any = await http.get(`/api/statistic/routes/${query ? `?${query}` : ''}`)

    const dataSection = response?.data ?? {}
    let entries: any[] = []
    if (Array.isArray(dataSection?.results)) {
      entries = dataSection.results
    } else if (Array.isArray(dataSection)) {
      entries = dataSection
    } else if (Array.isArray(response?.results)) {
      entries = response.results
    }

    const traces: Record<string, Array<{ lat: number; lon: number; timestamp: string }>> = {}
    const meta: Record<string, RouteTraceMeta> = {}

    entries.forEach((entry: any, memberIndex: number) => {
      const member = entry?.member || {}
      const memberId = member?.id ?? memberIndex + 1
      const memberName: string = member?.full_name || `會員 #${memberId}`
      const routes = Array.isArray(entry?.routes) ? entry.routes : []

      routes.forEach((route: any, routeIndex: number) => {
        const routeIdPart = route?.id != null ? String(route.id) : `${routeIndex + 1}`
        const traceId = `member-${memberId}-route-${routeIdPart}`
        const coordinates = Array.isArray(route?.geometry?.coordinates) ? route.geometry.coordinates : []

        const points = coordinates
          .map((coord: any) => {
            if (!Array.isArray(coord) || coord.length < 2) return null
            const [lon, lat] = coord
            if (typeof lat !== 'number' || typeof lon !== 'number') return null
            return {
              lat,
              lon,
              timestamp: route?.created_at || endIso || startIso || new Date().toISOString()
            }
          })
          .filter((point: { lat: number; lon: number; timestamp: string } | null): point is { lat: number; lon: number; timestamp: string } => Boolean(point))

        if (points.length < 2) return

        traces[traceId] = points

        meta[traceId] = {
          label: `${memberName} · #${routeIdPart}`,
          createdAt: route?.created_at,
          distanceMeters: route?.distance_meters,
          averageConfidence: route?.average_confidence,
          memberName
        }
      })
    })

    if (requestId === historyRequestToken) {
      const rawCount = dataSection?.count
      const parsedCount = typeof rawCount === 'number'
        ? rawCount
        : (typeof rawCount === 'string' && rawCount.trim() !== '' ? Number(rawCount) : null)
      const count = typeof parsedCount === 'number' && Number.isFinite(parsedCount)
        ? parsedCount
        : entries.length
      const next = typeof dataSection?.next === 'string' ? dataSection.next : null
      const previous = typeof dataSection?.previous === 'string' ? dataSection.previous : null

      historyPagination.value = { count, next, previous }
      filteredVehicleTraces.value = traces
      routeTraceMeta.value = meta
      selectedTraceVehicles.value = Object.keys(traces)
    }
  } catch (error) {
    console.error('載入軌跡資料失敗:', error)
    if (requestId === historyRequestToken) {
      historyError.value = error instanceof Error ? error.message : String(error)
      filteredVehicleTraces.value = {}
      routeTraceMeta.value = {}
      selectedTraceVehicles.value = []
      historyPagination.value = { count: 0, next: null, previous: null }
    }
  } finally {
    if (requestId === historyRequestToken) {
      historyLoading.value = false
    }
  }
}

function mapRealtimeStatus(status: string | null | undefined): string {
  switch ((status ?? '').toLowerCase()) {
    case 'idle':
      return 'available'
    case 'rented':
      return 'in-use'
    case 'maintenance':
      return 'maintenance'
    case 'error':
      return 'offline'
    default:
      return status ?? 'available'
  }
}

function toDecimalCoordinate(raw: any, fallback?: any): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw !== 0) {
    return raw
  }
  if (typeof fallback === 'number' && Number.isFinite(fallback) && fallback !== 0) {
    return fallback / 1_000_000
  }
  return null
}

function findNearestSite(lat: number | null, lng: number | null) {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
  let nearest: Site | null = null
  let best = Number.POSITIVE_INFINITY
  for (const site of sitesStore.list) {
    const dLat = lat - site.location.lat
    const dLng = lng - site.location.lng
    const dist = dLat * dLat + dLng * dLng
    if (dist < best) {
      best = dist
      nearest = site
    }
  }
  return nearest
}

function mapRealtimeVehicle(entry: any, index: number): any | null {
  if (!entry) return null
  const bike = entry?.bike ?? {}
  const id = bike?.bike_id ?? `realtime-${index}`
  const lat = toDecimalCoordinate(entry?.lat_decimal, entry?.latitude)
  const lon = toDecimalCoordinate(entry?.lng_decimal, entry?.longitude)
  const nearest = findNearestSite(lat, lon)

  const member = entry?.current_member ?? null
  const memberInfo = member
    ? {
        id: member?.id ?? null,
        name: member?.full_name ?? member?.username ?? '',
        phone: member?.phone ?? ''
      }
    : null

  const location = lat != null && lon != null ? { lat, lng: lon } : null

  return {
    id,
    name: bike?.bike_name ?? bike?.bike_id ?? `車輛 ${index + 1}`,
    model: bike?.bike_model ?? '',
    speedKph: Number(entry?.speed_kph ?? entry?.vehicle_speed ?? 0) || 0,
    vehicleSpeed: Number(entry?.speed_kph ?? entry?.vehicle_speed ?? 0) || 0,
    batteryPct: Number(entry?.soc ?? 0) || 0,
    batteryLevel: Number(entry?.soc ?? 0) || 0,
    status: mapRealtimeStatus(entry?.status),
    originalStatus: entry?.status ?? '',
    lastSeen: entry?.last_seen ?? entry?.updated_at ?? null,
    lat,
    lon,
    location,
    siteId: nearest?.id,
    siteName: nearest?.name,
    siteBrand: nearest?.brand,
    brand: nearest?.brand,
    currentMember: memberInfo,
    raw: entry
  }
}

function applyRealtimeUpdates(batch: BikeRealtimeStatusUpdate[]): void {
  if (!Array.isArray(batch) || batch.length === 0) return

  const current = realtimeVehicles.value
  const nextMap = new Map<string, any>()
  current.forEach((item) => {
    if (item?.id) nextMap.set(item.id, item)
  })

  let shouldUpdate = false

  for (const update of batch) {
    const bikeId = update?.bike_id
    if (!bikeId) continue

    const lat = typeof update.lat_decimal === 'number' ? update.lat_decimal : null
    const lon = typeof update.lng_decimal === 'number' ? update.lng_decimal : null
    const speedValue = Number(update.vehicle_speed ?? NaN)
    const batteryValue = Number(update.soc ?? NaN)
    const lastSeen = update.last_seen ?? null

    const existing = nextMap.get(bikeId)

    if (existing) {
      const patched = { ...existing }

      if (Number.isFinite(speedValue)) {
        patched.vehicleSpeed = speedValue
        patched.speedKph = speedValue
      }

      if (Number.isFinite(batteryValue)) {
        patched.batteryPct = batteryValue
        patched.batteryLevel = batteryValue
      }

      if (lat != null && lon != null) {
        patched.lat = lat
        patched.lon = lon
        patched.location = { lat, lng: lon }
        const nearest = findNearestSite(lat, lon)
        if (nearest) {
          patched.siteId = nearest.id
          patched.siteName = nearest.name
          patched.siteBrand = nearest.brand
          patched.brand = nearest.brand
        }
      }

      if (lastSeen) {
        patched.lastSeen = lastSeen
      }

      nextMap.set(bikeId, patched)
      shouldUpdate = true
    } else {
      const mapped = mapRealtimeVehicle(
        {
          bike: { bike_id: bikeId },
          lat_decimal: update.lat_decimal ?? null,
          lng_decimal: update.lng_decimal ?? null,
          soc: update.soc ?? null,
          vehicle_speed: update.vehicle_speed ?? null,
          last_seen: update.last_seen ?? null
        },
        nextMap.size
      )

      if (mapped) {
        nextMap.set(mapped.id, mapped)
        shouldUpdate = true
      }
    }
  }

  if (shouldUpdate) {
    realtimeVehicles.value = Array.from(nextMap.values())
  }
}

async function loadRealtimePositions(): Promise<void> {
  try {
    const searchParams = new URLSearchParams()
    searchParams.set('limit', '200')
    searchParams.set('offset', '0')

    const response: any = await http.get(`/api/bike/realtime-status/?${searchParams.toString()}`)
    const payload = response?.data ?? response
    const results: any[] = Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload)
        ? payload
        : []

    const mapped = results
      .map((entry, index) => mapRealtimeVehicle(entry, index))
      .filter((item): item is any => Boolean(item))

    realtimeVehicles.value = mapped
  } catch (error) {
    console.error('載入即時位置失敗:', error)
    realtimeVehicles.value = []
  }
}

function handleMapSelect(id: string): void {
  if (displayMode.value === 'realtime') {
    // 選擇車輛
    const vehicle = realtimeVehicles.value.find((v:any) => v.id === id)
    if (vehicle) {
      selectedItem.value = vehicle
    }
  } else {
    // 選擇站點
    const site = sitesStore.list.find(s => s.id === id)
    if (site) {
      sitesStore.selectSite(site)
      selectedSiteId.value = site.id
    }
  }
}

async function handleRentSuccess(rentRecord: any): Promise<void> {
  // 記錄租借成功
  console.log('車輛租借成功:', rentRecord)

  // 設置租借資訊並顯示成功對話框
  currentRental.value = rentRecord
  showRentDialog.value = false
  showRentSuccessDialog.value = true

  // 重新載入相關資料
  if (displayMode.value === 'realtime') {
    // 即時模式：重新載入即時位置資料
    await loadRealtimePositions()
  } else if (sitesStore.selected) {
    // 站點模式：重新載入站點車輛資料
    await Promise.all([
      sitesStore.fetchSites(),
      vehiclesStore.fetchBySite(sitesStore.selected.id)
    ])
  }

  console.log('[SiteMap] Vehicle data refreshed after successful rental')
}


// 租借相關函數
const LOW_BATTERY_THRESHOLD = 20

function isLowBattery(vehicle: any): boolean {
  if (!vehicle) return false
  if (vehicle.status === '低電量' || vehicle.status === 'low-battery') return true
  if (typeof vehicle.batteryPct === 'number') {
    return vehicle.batteryPct < LOW_BATTERY_THRESHOLD
  }
  return false
}

function canRentVehicle(vehicle: any): boolean {
  if (!vehicle) return false
  const blockedStatuses = ['使用中', 'in-use', '租借中', 'rented', '維修', 'maintenance']
  return !blockedStatuses.includes(vehicle.status)
}

function canReturnVehicle(vehicle: any): boolean {
  if (!vehicle) return false
  return vehicle.status === '使用中' || vehicle.status === 'in-use'
}

function getRentButtonTooltip(vehicle: any): string {
  if (!vehicle) return ''
  if (!canRentVehicle(vehicle)) {
    return vehicle.status === '維修' || vehicle.status === 'maintenance'
      ? '車輛維修中，暫不可租借'
      : '目前無法租借此車輛'
  }
  if (isLowBattery(vehicle)) {
    return '車輛電量偏低，請確認是否仍要租借'
  }
  return '點擊租借車輛'
}

function handleRentVehicle(vehicle: any): void {
  if (!canRentVehicle(vehicle)) return
  if (isLowBattery(vehicle)) {
    const proceed = window.confirm('此車輛目前電量偏低，仍要租借嗎？')
    if (!proceed) {
      return
    }
  }
  selectedVehicleForRent.value = vehicle
  showRentDialog.value = true
}

function handleReturnVehicle(vehicle: any): void {
  selectedReturnVehicle.value = vehicle
  showReturnDialog.value = true
}


function handleCloseRentDialog(): void {
  showRentDialog.value = false
  selectedVehicleForRent.value = null
}

function handleCloseSuccessDialog(): void {
  showRentSuccessDialog.value = false
  currentRental.value = null
}

function handleCloseReturnDialog(): void {
  showReturnDialog.value = false
  selectedReturnVehicle.value = null
}

async function onReturnSuccess(returnRecord: any): Promise<void> {
  // 記錄歸還成功
  console.log('車輛歸還成功:', returnRecord)

  // 更新最近歸還記錄
  recentReturns.value.unshift(returnRecord)
  if (recentReturns.value.length > 5) {
    recentReturns.value = recentReturns.value.slice(0, 5)
  }

  // 關閉歸還對話框
  showReturnDialog.value = false
  selectedReturnVehicle.value = null

  // 顯示成功對話框
  showSuccessNotification.value = true
  successMessage.value = `車輛 ${returnRecord.vehicleId} 已成功歸還！`

  // 1秒後自動刷新頁面
  setTimeout(() => {
    window.location.reload()
  }, 1000)

  // 立即重新載入相關資料
  if (sitesStore.selected) {
    await Promise.all([
      sitesStore.fetchSites(),
      returnsStore.fetchReturns({ siteId: sitesStore.selected.id, limit: 5 })
    ])
    await loadRealtimePositions()
  }
}

// 生命週期
onMounted(async () => {
  setRealtimeStatusConnectionCallback((connected) => {
    realtimeWsConnected.value = connected
  })

  if (!realtimeWsUnsubscribe) {
    realtimeWsUnsubscribe = subscribeRealtimeStatus(applyRealtimeUpdates)
  }

  await sitesStore.fetchSites()

  await loadRealtimePositions()
  await bikeMeta.fetchBikeStatusOptions()

  // 設置自動重新整理即時資料 (每30秒)
  const refreshInterval = setInterval(async () => {
    if (displayMode.value === 'realtime') {
      if (!realtimeWsConnected.value) {
        await loadRealtimePositions()
        console.log('[SiteMap] Auto-refreshed realtime vehicle data (fallback poll)')
      } else {
        console.debug('[SiteMap] Realtime WS active, skip fallback poll')
      }
    }
  }, 30000)

  // 頁面卸載時清除定時器
  onBeforeUnmount(() => {
    clearInterval(refreshInterval)
  })
})

onBeforeUnmount(() => {
  if (realtimeWsUnsubscribe) {
    realtimeWsUnsubscribe()
    realtimeWsUnsubscribe = null
  }
})

// 監聽選中站點變化
watch(() => sitesStore.selected, async (newSite) => {
  if (newSite) {
    const [alerts, returns] = await Promise.all([
      alertsStore.fetchBySiteSince(newSite.id),
      returnsStore.fetchRecentReturns(newSite.id, 5)
    ])
    recentReturns.value = returns
  } else {
    recentReturns.value = []
  }
})
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(100%);
}
</style>
