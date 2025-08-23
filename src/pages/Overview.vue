<!-- src/pages/Overview.vue -->
<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">系統總覽</h1>
        <p class="text-gray-600 mt-1">智慧自行車租賃系統營運狀況</p>
      </div>
      
      <div class="flex items-center gap-3">
        <select
          v-model="selectedPeriod"
          class="input-base w-32"
          @change="updateData"
        >
          <option value="today">今日</option>
          <option value="week">本週</option>
          <option value="month">本月</option>
        </select>
        
        <Button
          variant="primary"
          @click="refreshData"
          :disabled="isLoading"
        >
          <i-ph:arrow-clockwise class="w-4 h-4" />
          更新資料
        </Button>
      </div>
    </div>

    <!-- KPI Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <KpiCard
        title="上線車輛"
        :value="summary.online"
        unit="台"
        :change="5.2"
        trend="up"
        period="昨日"
        icon="i-ph:bicycle"
        color="green"
      />
      
      <KpiCard
        title="離線車輛"
        :value="summary.offline"
        unit="台"
        :change="-2.1"
        trend="down"
        period="昨日"
        icon="i-ph:warning-circle"
        color="red"
      />
      
      <KpiCard
        title="今日總里程"
        :value="summary.distance"
        unit="公里"
        :change="12.8"
        trend="up"
        period="昨日"
        icon="i-ph:map-pin"
        color="blue"
        format="number"
        :precision="1"
      />
      
      <KpiCard
        title="減碳效益"
        :value="summary.carbon"
        unit="kg CO₂"
        :change="8.5"
        trend="up"
        period="昨日"
        icon="i-ph:leaf"
        color="green"
        format="number"
        :precision="1"
      />
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- SoC Trend Chart -->
      <Card class="xl:col-span-2" padding="md">
        <template #header>
          <div class="flex-between">
            <h3 class="text-lg font-semibold text-gray-900">電池狀態趨勢</h3>
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span class="text-sm text-gray-600">平均 SoC (%)</span>
              </div>
            </div>
          </div>
        </template>
        
        <div class="h-80">
          <SocTrend
            v-if="!socLoading"
            :labels="socLabels"
            :values="socValues"
            class="w-full h-full"
          />
          <div v-else class="flex-center h-full">
            <div class="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </Card>

      <!-- Carbon Reduction Chart -->
      <Card padding="md">
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900">減碳量統計</h3>
        </template>
        
        <div class="h-80">
          <CarbonBar
            v-if="!carbonLoading"
            :labels="carbonLabels"
            :values="carbonValues"
            class="w-full h-full"
          />
          <div v-else class="flex-center h-full">
            <div class="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </Card>
    </div>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Recent Alerts -->
      <Card padding="md">
        <template #header>
          <div class="flex-between">
            <h3 class="text-lg font-semibold text-gray-900">最新警報</h3>
            <Button variant="ghost" size="sm">
              查看全部
              <i-ph:arrow-right class="w-4 h-4" />
            </Button>
          </div>
        </template>
        
        <div class="space-y-3">
          <div
            v-for="alert in recentAlerts"
            :key="alert.id"
            class="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors duration-200"
          >
            <div :class="getAlertIconClass(alert.type)">
              <component :is="getAlertIcon(alert.type)" class="w-4 h-4" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900">{{ alert.message }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ alert.time }}</p>
            </div>
          </div>
        </div>
        
        <div v-if="recentAlerts.length === 0" class="py-8">
          <EmptyState
            title="目前沒有警報"
            description="系統運作正常，沒有需要注意的警報"
            icon="i-ph:check-circle"
            variant="default"
          />
        </div>
      </Card>

      <!-- System Status -->
      <Card padding="md">
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900">系統狀態</h3>
        </template>
        
        <div class="space-y-4">
          <div
            v-for="status in systemStatus"
            :key="status.name"
            class="flex items-center justify-between p-3 rounded-lg bg-gray-50"
          >
            <div class="flex items-center gap-3">
              <div :class="getStatusIconClass(status.status)">
                <component :is="getStatusIcon(status.status)" class="w-4 h-4" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ status.name }}</p>
                <p class="text-xs text-gray-500">{{ status.description }}</p>
              </div>
            </div>
            <span :class="getStatusBadgeClass(status.status)" class="px-2 py-1 text-xs font-medium rounded-full">
              {{ getStatusText(status.status) }}
            </span>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { Button, Card, KpiCard, EmptyState } from '@/design/components'
import SocTrend from '@/components/charts/SocTrend.vue'
import CarbonBar from '@/components/charts/CarbonBar.vue'

// Reactive data
const selectedPeriod = ref('today')
const isLoading = ref(false)
const socLoading = ref(false)
const carbonLoading = ref(false)

const summary = reactive({ 
  online: 42, 
  offline: 8, 
  distance: 128.5, 
  carbon: 9.6 
})

// Chart data
const socLabels = ['00h','02h','04h','06h','08h','10h','12h','14h','16h','18h','20h','22h']
const socValues = [92,90,87,84,80,75,70,65,60,55,50,45]

const carbonLabels = ['06-20','06-21','06-22','06-23','06-24','06-25','06-26']
const carbonValues = [9.6,10.2,8.7,11.3,9.9,12.1,10.4]

// Recent alerts mock data
const recentAlerts = reactive([
  {
    id: 1,
    type: 'warning',
    message: '站點 A01 電池電量不足',
    time: '2 分鐘前'
  },
  {
    id: 2,
    type: 'error',
    message: '車輛 BK001 GPS 信號異常',
    time: '5 分鐘前'
  },
  {
    id: 3,
    type: 'info',
    message: '系統維護已完成',
    time: '15 分鐘前'
  }
])

// System status mock data
const systemStatus = reactive([
  {
    name: 'API 服務',
    description: '資料處理與同步',
    status: 'healthy'
  },
  {
    name: 'GPS 追蹤',
    description: '車輛位置監控',
    status: 'healthy'
  },
  {
    name: '電池監測',
    description: '電池狀態監控',
    status: 'warning'
  },
  {
    name: '資料庫',
    description: '資料儲存服務',
    status: 'healthy'
  }
])

// Methods
const refreshData = async () => {
  isLoading.value = true
  socLoading.value = true
  carbonLoading.value = true
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  isLoading.value = false
  socLoading.value = false
  carbonLoading.value = false
}

const updateData = () => {
  // Update data based on selected period
  console.log('更新資料期間:', selectedPeriod.value)
  // In real app, fetch data from API based on period
}

// Helper methods for status indicators
const getAlertIcon = (type: string) => {
  const icons = {
    warning: 'i-ph:warning',
    error: 'i-ph:x-circle',
    info: 'i-ph:info'
  }
  return icons[type as keyof typeof icons] || 'i-ph:info'
}

const getAlertIconClass = (type: string) => {
  const classes = {
    warning: 'p-2 rounded-lg bg-yellow-100 text-yellow-600',
    error: 'p-2 rounded-lg bg-red-100 text-red-600',
    info: 'p-2 rounded-lg bg-blue-100 text-blue-600'
  }
  return classes[type as keyof typeof classes] || classes.info
}

const getStatusIcon = (status: string) => {
  const icons = {
    healthy: 'i-ph:check-circle',
    warning: 'i-ph:warning',
    error: 'i-ph:x-circle'
  }
  return icons[status as keyof typeof icons] || 'i-ph:check-circle'
}

const getStatusIconClass = (status: string) => {
  const classes = {
    healthy: 'p-2 rounded-lg bg-green-100 text-green-600',
    warning: 'p-2 rounded-lg bg-yellow-100 text-yellow-600',
    error: 'p-2 rounded-lg bg-red-100 text-red-600'
  }
  return classes[status as keyof typeof classes] || classes.healthy
}

const getStatusBadgeClass = (status: string) => {
  const classes = {
    healthy: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  }
  return classes[status as keyof typeof classes] || classes.healthy
}

const getStatusText = (status: string) => {
  const texts = {
    healthy: '正常',
    warning: '警告',
    error: '異常'
  }
  return texts[status as keyof typeof texts] || '正常'
}

onMounted(() => {
  // Initial data load
  updateData()
})
</script>
