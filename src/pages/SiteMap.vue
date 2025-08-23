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
                v-model="selectedDomain"
                class="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                @change="handleDomainChange"
              >
                <option value="huali">華麗轉身</option>
                <option value="shunqi">順其自然</option>
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
                <option value="history">歷史位置</option>
              </select>
            </div>
          </div>
          
          <!-- 右側控制組 -->
          <div class="flex items-center space-x-4">
            <!-- 時段選擇 -->
            <div class="flex items-center space-x-2">
              <input 
                v-model="timeRange.start"
                type="datetime-local" 
                class="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span class="text-gray-500">-</span>
              <input 
                v-model="timeRange.end"
                type="datetime-local" 
                class="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <!-- 搜尋框 -->
            <div class="relative">
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="搜尋車輛/編號/標籤"
                class="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <i class="i-ph-magnifying-glass absolute left-2.5 top-2 w-4 h-4 text-gray-400"></i>
            </div>
            
            <!-- 套用按鈕 -->
            <button class="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
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
                    ? `軌跡過濾 (${Object.keys(filteredTraces).length}/${Object.keys(mockVehicleTraces).length})` 
                    : `車輛過濾 (${filteredRealtimeVehicles.length}/${mockVehicles.length})` 
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
              :available-vehicles="mockVehicles"
            />
          </div>


          <!-- 車輛卡片清單 -->
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            <div 
              v-for="vehicle in displayMode === 'realtime' ? filteredRealtimeVehicles : filteredVehicles" 
              :key="vehicle.id"
              :class="{ 'ring-2 ring-indigo-500 bg-indigo-50': highlightedVehicle === vehicle.id }"
              class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              @click="selectVehicle(vehicle)"
            >
              <!-- 車輛標題 -->
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <h4 class="font-semibold text-gray-900">{{ vehicle.id }}</h4>
                  <span :class="getStatusBadgeClass(vehicle.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                    {{ getStatusText(vehicle.status) }}
                  </span>
                </div>
              </div>
              
              <!-- 車輛詳細資訊網格 -->
              <div class="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                <div class="flex items-center space-x-1">
                  <i class="i-ph-gauge w-4 h-4"></i>
                  <span>{{ vehicle.speedKph || 0 }} km/h</span>
                </div>
                <div class="flex items-center space-x-1">
                  <i class="i-ph-battery-high w-4 h-4"></i>
                  <span>{{ vehicle.batteryPct }}%</span>
                </div>
                <div class="flex items-center space-x-1">
                  <i class="i-ph-map-pin w-4 h-4"></i>
                  <span>{{ vehicle.lat.toFixed(6) }}, {{ vehicle.lon.toFixed(6) }}</span>
                </div>
                <div class="flex items-center space-x-1">
                  <i class="i-ph-clock w-4 h-4"></i>
                  <span>{{ getRelativeTime(vehicle.lastSeen || new Date().toISOString()) }}</span>
                </div>
              </div>
              
              <!-- 使用人資訊 (僅在使用中時顯示) -->
              <div v-if="(vehicle.status === '使用中' || vehicle.status === 'in-use') && vehicle.registeredUser" class="mb-3">
                <div class="flex items-center space-x-1 text-sm text-blue-700">
                  <i class="i-ph-user w-4 h-4"></i>
                  <span>{{ vehicle.registeredUser }}</span>
                </div>
              </div>

              <!-- 動作按鈕 -->
              <div class="flex justify-end">
                <!-- 主要動作按鈕：租借/歸還 -->
                  <button 
                    v-if="vehicle.status === '可租借' || vehicle.status === 'available'"
                    :disabled="!canRentVehicle(vehicle)"
                    :title="getRentButtonTooltip(vehicle)"
                    @click="handleRentVehicle(vehicle)"
                    class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                    :class="canRentVehicle(vehicle) 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'"
                  >
                    <i class="i-ph-key w-4 h-4 mr-1"></i>
                    租借
                  </button>
                  
                  <button 
                    v-else-if="vehicle.status === '使用中' || vehicle.status === 'in-use'"
                    @click="handleReturnVehicle(vehicle)"
                    class="px-3 py-1.5 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                  >
                    <i class="i-ph-handbag w-4 h-4 mr-1"></i>
                    歸還
                  </button>
                  
                  <span 
                    v-else
                    class="px-3 py-1.5 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg"
                  >
                    {{ getStatusText(vehicle.status) }}
                  </span>
              </div>
            </div>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useSites } from '@/stores/sites'
import { useVehicles } from '@/stores/vehicles'  
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

// ECharts 註冊
use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

// Stores
const sitesStore = useSites()
const vehiclesStore = useVehicles()
const alertsStore = useAlerts()
const returnsStore = useReturns()
const rentalsStore = useRentals()

// 響應式狀態
const showSetupGuide = ref(false)
const showSeedGuide = ref(false)
const showReturnModal = ref(false)
const showRentModal = ref(false)
const recentReturns = ref<any[]>([])

// 新的響應式狀態
const selectedDomain = ref('huali')
const displayMode = ref('realtime')
const selectedItem = ref<any>(null)
const vehicleFilter = ref('all')
const highlightedVehicle = ref<string | null>(null)
const searchQuery = ref('')
const timeRange = ref({
  start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  end: new Date().toISOString().slice(0, 16)
})
const activeFilter = ref('all')
const selectedVehicle = ref<any>(null)

// 軌跡過濾相關狀態
const selectedTraceVehicles = ref<string[]>([])
const filteredVehicleTraces = ref<Record<string, any[]>>({})

// 即時車輛過濾相關狀態
const selectedRealtimeVehicles = ref<string[]>([])
const showRentDialog = ref(false)
const selectedVehicleForRent = ref<any>(null)
const showReturnDialog = ref(false)
const selectedReturnVehicle = ref<any>(null)
const showRentSuccessDialog = ref(false)
const currentRental = ref<any>(null)

const seedMockEnabled = computed(() => import.meta.env.VITE_SEED_MOCK === '1')

// Mock 車輛資料 - 花蓮真實座標
const mockVehicles = computed(() => [
  {
    id: 'BIKE001',
    name: '花蓮火車站-001',
    lat: 23.9917, // 花蓮火車站
    lon: 121.6014,
    speedKph: 0,
    batteryPct: 85,
    signal: '良好' as const,
    status: '可租借' as const,
    lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    // 兼容欄位
    batteryLevel: 85,
    brand: selectedDomain.value,
    location: { lat: 23.9917, lng: 121.6014 },
    siteId: 'hualien_station',
    model: 'E-Bike Pro',
    speed: 0,
    registeredUser: null
  },
  {
    id: 'BIKE002',
    name: '東大門夜市-002',
    lat: 23.9750, // 東大門夜市
    lon: 121.6060,
    speedKph: 15,
    batteryPct: 72,
    signal: '良好' as const,
    status: '使用中' as const,
    lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    // 兼容欄位
    batteryLevel: 72,
    brand: selectedDomain.value,
    location: { lat: 23.9750, lng: 121.6060 },
    siteId: 'hualien_night_market',
    model: 'E-Bike Pro',
    speed: 15,
    registeredUser: '張小明 (0912-345-678)'
  },
  {
    id: 'BIKE003',
    name: '花蓮港-003',
    lat: 23.9739, // 花蓮港
    lon: 121.6175,
    speedKph: 0,
    batteryPct: 45,
    signal: '中等' as const,
    status: '可租借' as const,
    lastSeen: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    // 兼容欄位
    batteryLevel: 45,
    brand: selectedDomain.value,
    location: { lat: 23.9739, lng: 121.6175 },
    siteId: 'hualien_port',
    model: 'E-Bike Standard',
    speed: 0,
    registeredUser: null
  },
  {
    id: 'BIKE004',
    name: '海洋公園-004',
    lat: 23.8979, // 花蓮遠雄海洋公園
    lon: 121.6172,
    speedKph: 0,
    batteryPct: 91,
    signal: '良好' as const,
    status: '可租借' as const,
    lastSeen: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    // 兼容欄位
    batteryLevel: 91,
    brand: selectedDomain.value,
    location: { lat: 23.8979, lng: 121.6172 },
    siteId: 'hualien_ocean_park',
    model: 'E-Bike Pro',
    speed: 0,
    registeredUser: null
  },
  {
    id: 'BIKE005',
    name: '縣政府-005',
    lat: 23.9847, // 花蓮縣政府
    lon: 121.6064,
    speedKph: 0,
    batteryPct: 15,
    signal: '弱' as const,
    status: '低電量' as const,
    lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    // 兼容欄位
    batteryLevel: 15,
    brand: selectedDomain.value,
    location: { lat: 23.9847, lng: 121.6064 },
    siteId: 'hualien_county_hall',
    model: 'E-Bike Standard',
    speed: 0,
    registeredUser: null
  },
  {
    id: 'BIKE006',
    name: '中華紙漿-006',
    lat: 23.9739, // 花蓮中華紙漿
    lon: 121.5994,
    speedKph: 8,
    batteryPct: 63,
    signal: '中等' as const,
    status: '使用中' as const,
    lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    // 兼容欄位
    batteryLevel: 63,
    brand: selectedDomain.value,
    location: { lat: 23.9739, lng: 121.5994 },
    siteId: 'hualien_zhonghua',
    model: 'E-Bike Pro',
    speed: 8,
    registeredUser: '李小華 (0987-654-321)'
  },
  {
    id: 'BIKE007',
    name: '美崙山公園-007',
    lat: 23.9709, // 花蓮美崙山公園
    lon: 121.6028,
    speedKph: 0,
    batteryPct: 92,
    signal: '良好' as const,
    status: '可租借' as const,
    lastSeen: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    // 兼容欄位
    batteryLevel: 92,
    brand: selectedDomain.value,
    location: { lat: 23.9709, lng: 121.6028 },
    siteId: 'hualien_meilun_park',
    model: 'E-Bike Pro',
    speed: 0,
    registeredUser: null
  },
  {
    id: 'BIKE008',
    name: '慈濟醫院-008',
    lat: 23.9786, // 花蓮慈濟醫院
    lon: 121.5996,
    speedKph: 12,
    batteryPct: 54,
    signal: '中等' as const,
    status: '使用中' as const,
    lastSeen: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    // 兼容欄位
    batteryLevel: 54,
    brand: selectedDomain.value,
    location: { lat: 23.9786, lng: 121.5996 },
    siteId: 'hualien_tzu_chi',
    model: 'E-Bike Standard',
    speed: 12,
    registeredUser: '王大明 (0976-123-456)'
  },
  {
    id: 'BIKE009',
    name: '市公所-009',
    lat: 23.9847, // 花蓮市公所
    lon: 121.6064,
    speedKph: 0,
    batteryPct: 78,
    signal: '良好' as const,
    status: '可租借' as const,
    lastSeen: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    batteryLevel: 78,
    brand: selectedDomain.value,
    location: { lat: 23.9847, lng: 121.6064 },
    siteId: 'hualien_city_office',
    model: 'E-Bike Pro',
    speed: 0,
    registeredUser: null
  },
  {
    id: 'BIKE010',
    name: '松園別館-010',
    lat: 23.9853, // 花蓮松園別館
    lon: 121.6097,
    speedKph: 0,
    batteryPct: 89,
    signal: '良好' as const,
    status: '可租借' as const,
    lastSeen: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    batteryLevel: 89,
    brand: selectedDomain.value,
    location: { lat: 23.9853, lng: 121.6097 },
    siteId: 'hualien_pine_garden',
    model: 'E-Bike Standard',
    speed: 0,
    registeredUser: null
  },
  {
    id: 'BIKE011',
    name: '曼波海灘-011',
    lat: 23.9750, // 花蓮曼波海灘
    lon: 121.6150,
    speedKph: 6,
    batteryPct: 67,
    signal: '中等' as const,
    status: '使用中' as const,
    lastSeen: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    batteryLevel: 67,
    brand: selectedDomain.value,
    location: { lat: 23.9750, lng: 121.6150 },
    siteId: 'hualien_manbo_beach',
    model: 'E-Bike Pro',
    speed: 6,
    registeredUser: '陳小美 (0955-777-888)'
  },
  {
    id: 'BIKE012',
    name: '創意文化園區-012',
    lat: 23.9715, // 花蓮創意文化園區
    lon: 121.6080,
    speedKph: 0,
    batteryPct: 33,
    signal: '弱' as const,
    status: '可租借' as const,
    lastSeen: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    batteryLevel: 33,
    brand: selectedDomain.value,
    location: { lat: 23.9715, lng: 121.6080 },
    siteId: 'hualien_cultural_park',
    model: 'E-Bike Standard',
    speed: 0,
    registeredUser: null
  }
])

// Mock 車輛歷史軌跡資料 - 花蓮真實路線
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

// 計算車輛分布的中心點和最佳縮放級別
const mapCenter = computed(() => {
  const vehicles = mockVehicles.value
  if (vehicles.length === 0) {
    // 預設花蓮市中心
    return { lat: 23.9739, lng: 121.6014, zoom: 12 }
  }
  
  // 計算所有車輛位置的邊界
  const lats = vehicles.map(v => v.lat)
  const lngs = vehicles.map(v => v.lon)
  
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  
  // 計算中心點
  const centerLat = (minLat + maxLat) / 2
  const centerLng = (minLng + maxLng) / 2
  
  // 計算適當的縮放級別
  const latDiff = maxLat - minLat
  const lngDiff = maxLng - minLng
  const maxDiff = Math.max(latDiff, lngDiff)
  
  let zoom = 13 // 預設縮放
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
  const traces = mockVehicleTraces.value
  const vehicleColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  
  return Object.entries(traces).map(([vehicleId, trace], index) => ({
    id: vehicleId,
    color: vehicleColors[index % vehicleColors.length],
    pointCount: trace.length
  }))
})

const filteredTraces = computed(() => {
  if (selectedTraceVehicles.value.length === 0) {
    return mockVehicleTraces.value
  }
  
  const filtered: Record<string, any[]> = {}
  selectedTraceVehicles.value.forEach(vehicleId => {
    if (mockVehicleTraces.value[vehicleId]) {
      filtered[vehicleId] = mockVehicleTraces.value[vehicleId]
    }
  })
  
  return filtered
})

// 即時車輛過濾邏輯
const filteredRealtimeVehicles = computed(() => {
  if (selectedRealtimeVehicles.value.length === 0) {
    return mockVehicles.value
  }
  
  return mockVehicles.value.filter(vehicle => 
    selectedRealtimeVehicles.value.includes(vehicle.id)
  )
})

// 過濾後的車輛
const filteredVehicles = computed(() => {
  let vehicles = mockVehicles.value
  
  // 根據篩選條件過濾
  if (vehicleFilter.value !== 'all') {
    vehicles = vehicles.filter(vehicle => {
      switch (vehicleFilter.value) {
        case 'moving':
          return vehicle.status === 'in-use' && (vehicle.speed || 0) > 0
        case 'offline':
          return vehicle.status === 'maintenance'
        case 'low-battery':
          return vehicle.status === 'low-battery' || vehicle.batteryLevel < 20
        default:
          return true
      }
    })
  }
  
  // 根據搜尋條件過濾
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    vehicles = vehicles.filter(vehicle => 
      vehicle.id.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query)
    )
  }
  
  return vehicles
})

// 計算屬性
const totalVehicles = computed(() => {
  if (displayMode.value === 'realtime') {
    return mockVehicles.value.length
  }
  return sitesStore.filteredSites.reduce((sum, site) => sum + site.vehicleCount, 0)
})

const availableVehicles = computed(() => {
  if (displayMode.value === 'realtime') {
    return mockVehicles.value.filter(v => v.status === 'available').length
  }
  return sitesStore.filteredSites.reduce((sum, site) => sum + site.availableCount, 0)
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
const chartOption = computed(() => ({
  grid: { top: 20, right: 20, bottom: 20, left: 40 },
  xAxis: {
    type: 'category',
    data: ['華麗轉身', '順其自然'],
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
    data: [
      sitesStore.filteredSites.filter(s => s.brand === 'huali').length,
      sitesStore.filteredSites.filter(s => s.brand === 'shunqi').length
    ],
    type: 'bar',
    itemStyle: { color: '#6366f1' },
    barWidth: '40%'
  }]
}))

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

// Filter and search functions
function setActiveFilter(filter: string) {
  vehicleFilter.value = filter
}

function getStatusColor(status: string): string {
  const colors = {
    active: 'text-green-600 dark:text-green-400',
    maintenance: 'text-yellow-600 dark:text-yellow-400',
    offline: 'text-red-600 dark:text-red-400'
  }
  return colors[status as keyof typeof colors] || 'text-gray-600'
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

function getBrandText(brand: string): string {
  return brand === 'huali' ? '華麗轉身' : '順騎自然'
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

async function handleDomainChange(): Promise<void> {
  // 根據選擇的場域篩選資料
  console.log('場域切換至:', selectedDomain.value)
  // TODO: 根據場域更新地圖上的車輛標記
  await loadVehiclesByDomain()
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

async function loadVehiclesByDomain(): Promise<void> {
  // 根據選擇的場域載入車輛資料
  try {
    console.log(`載入場域 ${selectedDomain.value} 的車輛資料`)
    // TODO: 呼叫 API 載入特定場域的車輛資料
  } catch (error) {
    console.error('載入車輛資料失敗:', error)
  }
}

async function loadHistoryTrajectories(): Promise<void> {
  // 載入歷史軌跡資料
  try {
    console.log('載入歷史軌跡資料')
    // TODO: 呼叫 API 載入車輛歷史移動軌跡
  } catch (error) {
    console.error('載入軌跡資料失敗:', error)
  }
}

async function loadRealtimePositions(): Promise<void> {
  // 載入即時位置資料
  try {
    console.log('載入即時位置資料')
    // TODO: 呼叫 API 載入車輛即時位置
  } catch (error) {
    console.error('載入即時位置失敗:', error)
  }
}

function handleMapSelect(id: string): void {
  if (displayMode.value === 'realtime') {
    // 選擇車輛
    const vehicle = mockVehicles.value.find(v => v.id === id)
    if (vehicle) {
      selectedItem.value = vehicle
    }
  } else {
    // 選擇站點
    const site = sitesStore.list.find(s => s.id === id)
    if (site) {
      sitesStore.selected = site
      selectedItem.value = site
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
  if (sitesStore.selected) {
    await Promise.all([
      sitesStore.fetchSites(),
      vehiclesStore.fetchBySite(sitesStore.selected.id)
    ])
  }

  // TODO: 顯示成功訊息和更新地圖上的車輛狀態
}


// 租借相關函數
function canRentVehicle(vehicle: any): boolean {
  // 檢查車輛狀態
  if (vehicle.status !== '可租借') return false
  
  // 檢查電量
  if (vehicle.batteryPct < 20) return false
  
  // 檢查信號
  if (vehicle.signal === '弱') return false
  
  // 檢查最後更新時間
  const lastSeenTime = new Date(vehicle.lastSeen).getTime()
  const now = new Date().getTime()
  const minutesSinceLastSeen = (now - lastSeenTime) / (1000 * 60)
  
  return minutesSinceLastSeen <= 5
}

function getRentButtonTooltip(vehicle: any): string {
  if (vehicle.status !== '可租借') {
    return `車輛狀態：${getStatusText(vehicle.status)}`
  }
  
  if (vehicle.batteryPct < 20) {
    return '電量不足，需要充電'
  }
  
  if (vehicle.signal === '弱') {
    return '信號過弱，無法租借'
  }
  
  const lastSeenTime = new Date(vehicle.lastSeen).getTime()
  const now = new Date().getTime()
  const minutesSinceLastSeen = (now - lastSeenTime) / (1000 * 60)
  
  if (minutesSinceLastSeen > 5) {
    return '車輛離線時間過長'
  }
  
  return '點擊租借車輛'
}

function handleRentVehicle(vehicle: any): void {
  if (!canRentVehicle(vehicle)) return
  
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

  // 重新載入相關資料
  if (sitesStore.selected) {
    await Promise.all([
      sitesStore.fetchSites(),
      vehiclesStore.fetchBySite(sitesStore.selected.id),
      returnsStore.fetchReturns({ siteId: sitesStore.selected.id, limit: 5 })
    ])
  }
}

// 生命週期
onMounted(async () => {
  await sitesStore.fetchSites()
})

// 監聽選中站點變化
watch(() => sitesStore.selected, async (newSite) => {
  if (newSite) {
    const [vehicles, alerts, returns] = await Promise.all([
      vehiclesStore.fetchBySite(newSite.id),
      alertsStore.fetchBySiteSince(newSite.id),
      returnsStore.fetchRecentReturns(newSite.id, 5)
    ])
    recentReturns.value = returns
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