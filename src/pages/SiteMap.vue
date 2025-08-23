<template>
  <div class="h-full flex">
    <!-- 左側篩選面板 -->
    <div class="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-6">
      <h2 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white">場域地圖</h2>
      
      <!-- 區域選擇 -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          區域 *
        </label>
        <select 
          v-model="sitesStore.filters.region"
          @change="handleRegionChange"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="hualien">花蓮縣</option>
          <option value="taitung">台東縣</option>
        </select>
      </div>

      <!-- 品牌篩選 -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          品牌
        </label>
        <div class="space-y-2">
          <label class="flex items-center">
            <input
              type="checkbox"
              value="huali"
              v-model="sitesStore.filters.brands"
              class="mr-2"
            />
            華麗轉身
          </label>
          <label class="flex items-center">
            <input
              type="checkbox"
              value="shunqi"
              v-model="sitesStore.filters.brands"
              class="mr-2"
            />
            順騎自然
          </label>
        </div>
      </div>

      <!-- 狀態篩選 -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          狀態
        </label>
        <div class="space-y-2">
          <label class="flex items-center">
            <input
              type="checkbox"
              value="active"
              v-model="sitesStore.filters.statuses"
              class="mr-2"
            />
            正常運行
          </label>
          <label class="flex items-center">
            <input
              type="checkbox"
              value="maintenance"
              v-model="sitesStore.filters.statuses"
              class="mr-2"
            />
            維護中
          </label>
          <label class="flex items-center">
            <input
              type="checkbox"
              value="offline"
              v-model="sitesStore.filters.statuses"
              class="mr-2"
            />
            離線
          </label>
        </div>
      </div>

      <!-- 電量範圍 -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          電量範圍: {{ sitesStore.filters.batteryRange[0] }}% - {{ sitesStore.filters.batteryRange[1] }}%
        </label>
        <div class="space-y-2">
          <input
            type="range"
            min="0"
            max="100"
            v-model.number="sitesStore.filters.batteryRange[0]"
            class="w-full"
          />
          <input
            type="range"
            min="0"
            max="100"
            v-model.number="sitesStore.filters.batteryRange[1]"
            class="w-full"
          />
        </div>
      </div>

      <!-- 統計摘要 -->
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">統計摘要</h3>
        <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div>站點總數: {{ sitesStore.filteredSites.length }}</div>
          <div>車輛總數: {{ totalVehicles }}</div>
          <div>可用車輛: {{ availableVehicles }}</div>
        </div>
      </div>
    </div>

    <!-- 地圖區域 -->
    <div class="flex-1 relative">
      <!-- 右上角 KPI 迷你圖 -->
      <div class="absolute top-4 right-4 z-10 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 w-80">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white">站點分佈趨勢</h3>
        </div>
        <div class="h-32">
          <v-chart 
            :option="chartOption" 
            :theme="chartTheme"
            class="w-full h-full"
          />
        </div>
      </div>

      <!-- 地圖容器 -->
      <MapLibreMap 
        :sites="sitesStore.filteredSites"
        :selected="sitesStore.selected"
        @select="handleSiteSelect"
      />

      <!-- 空狀態顯示 -->
      <div 
        v-if="sitesStore.filteredSites.length === 0 && !sitesStore.loading" 
        class="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 z-20"
      >
        <div class="text-center p-8">
          <MapIcon class="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">目前沒有站點資料</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {{ seedMockEnabled ? '請調整篩選條件或重新載入頁面' : '啟用測試資料以查看示範內容' }}
          </p>
          <button 
            v-if="!seedMockEnabled"
            @click="showSeedGuide = true"
            class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            啟用測試資料
          </button>
        </div>
      </div>
    </div>

    <!-- 右側抽屜 -->
    <Transition name="slide-left">
      <div 
        v-if="sitesStore.selected" 
        class="w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto"
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ sitesStore.selected.name }}
          </h3>
          <button 
            @click="sitesStore.selectSite(undefined)"
            class="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- 站點基本資訊 -->
        <div class="mb-6">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">狀態</span>
              <div :class="getStatusColor(sitesStore.selected.status)" class="font-medium">
                {{ getStatusText(sitesStore.selected.status) }}
              </div>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">品牌</span>
              <div class="font-medium">{{ getBrandText(sitesStore.selected.brand) }}</div>
            </div>
          </div>
        </div>

        <!-- KPI 卡片 -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ sitesStore.selected.vehicleCount }}
            </div>
            <div class="text-sm text-blue-600 dark:text-blue-400">總車輛數</div>
          </div>
          <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ sitesStore.selected.availableCount }}
            </div>
            <div class="text-sm text-green-600 dark:text-green-400">可用車輛</div>
          </div>
        </div>

        <!-- 最近告警 -->
        <div class="mb-6">
          <h4 class="font-medium text-gray-900 dark:text-white mb-3">最近告警</h4>
          <div class="space-y-2">
            <div 
              v-for="alert in recentAlerts" 
              :key="alert.id"
              :class="getAlertColor(alert.severity)"
              class="p-3 rounded-lg text-sm"
            >
              <div class="font-medium">{{ alert.message }}</div>
              <div class="text-xs opacity-75">
                {{ formatTime(alert.createdAt) }}
              </div>
            </div>
            <div v-if="recentAlerts.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-2">
              暫無告警
            </div>
          </div>
        </div>

        <!-- 在站車輛 -->
        <div>
          <h4 class="font-medium text-gray-900 dark:text-white mb-3">在站車輛</h4>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div 
              v-for="vehicle in siteVehicles" 
              :key="vehicle.id"
              class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
            >
              <div class="flex-1">
                <div class="font-medium text-sm">{{ vehicle.model }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ getStatusText(vehicle.status) }}
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium">{{ vehicle.batteryLevel }}%</div>
                <div class="w-16 h-2 bg-gray-200 rounded-full">
                  <div 
                    :class="getBatteryColor(vehicle.batteryLevel)"
                    :style="{ width: `${vehicle.batteryLevel}%` }"
                    class="h-2 rounded-full"
                  />
                </div>
              </div>
            </div>
            <div v-if="siteVehicles.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-2">
              暫無車輛資料
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 設定指引彈窗 -->
    <SetupGuideModal 
      v-if="showSetupGuide" 
      @close="showSetupGuide = false"
    />
    <SeedGuideModal 
      v-if="showSeedGuide" 
      @close="showSeedGuide = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { MapIcon, XMarkIcon } from 'lucide-vue-next'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { useSitesStore } from '@/stores/sites'
import { useVehicles } from '@/stores/vehicles'  
import { useAlerts } from '@/stores/alerts'
import SetupGuideModal from '@/components/modals/SetupGuideModal.vue'
import SeedGuideModal from '@/components/modals/SeedGuideModal.vue'
import MapLibreMap from '@/components/map/MapLibreMap.vue'
import type { Site } from '@/types/site'

// ECharts 註冊
use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

// Stores
const sitesStore = useSitesStore()
const vehiclesStore = useVehicles()
const alertsStore = useAlerts()

// 響應式狀態
const showSetupGuide = ref(false)
const showSeedGuide = ref(false)

const seedMockEnabled = computed(() => import.meta.env.VITE_SEED_MOCK === '1')

// 計算屬性
const totalVehicles = computed(() => 
  sitesStore.filteredSites.reduce((sum, site) => sum + site.vehicleCount, 0)
)

const availableVehicles = computed(() => 
  sitesStore.filteredSites.reduce((sum, site) => sum + site.availableCount, 0)
)

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
    data: ['花蓮', '台東'],
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
      sitesStore.filteredSites.filter(s => s.region === 'hualien').length,
      sitesStore.filteredSites.filter(s => s.region === 'taitung').length
    ],
    type: 'bar',
    itemStyle: { color: '#6366f1' },
    barWidth: '40%'
  }]
}))

// 工具函式
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
    active: '正常運行',
    maintenance: '維護中',
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
  if (level > 70) return 'bg-green-500'
  if (level > 30) return 'bg-yellow-500'
  return 'bg-red-500'
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleString('zh-TW')
}

async function handleRegionChange(): Promise<void> {
  await sitesStore.fetchSites()
}

function handleSiteSelect(siteId: string): void {
  const site = sitesStore.list.find(s => s.id === siteId)
  if (site) {
    sitesStore.selectSite(site)
  }
}

// 生命週期
onMounted(async () => {
  await sitesStore.fetchSites()
})

// 監聽選中站點變化
watch(() => sitesStore.selected, async (newSite) => {
  if (newSite) {
    await Promise.all([
      vehiclesStore.fetchBySite(newSite.id),
      alertsStore.fetchBySiteSince(newSite.id)
    ])
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