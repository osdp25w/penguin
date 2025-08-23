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
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">起始日期：</label>
          <input
            v-model="startDate"
            type="date"
            class="input-base w-36"
            @change="updateData"
          />
        </div>
        
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">結束日期：</label>
          <input
            v-model="endDate"
            type="date"
            class="input-base w-36"
            @change="updateData"
          />
        </div>
        
        <Button
          variant="primary"
          @click="refreshData"
          :disabled="isLoading"
        >
          <i class="i-ph-arrow-clockwise w-4 h-4" />
          更新資料
        </Button>
        
        <Button
          variant="ghost"
          @click="exportData"
          :disabled="isLoading"
        >
          <i class="i-ph-download w-4 h-4" />
          匯出報表
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
        icon="i-ph-bicycle"
        color="green"
      />
      
      <KpiCard
        title="離線車輛"
        :value="summary.offline"
        unit="台"
        :change="-2.1"
        trend="down"
        period="昨日"
        icon="i-ph-warning-circle"
        color="red"
      />
      
      <KpiCard
        title="今日總里程"
        :value="summary.distance"
        unit="公里"
        :change="12.8"
        trend="up"
        period="昨日"
        icon="i-ph-map-pin"
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
        icon="i-ph-tree"
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

    <!-- Recent Activity (Disabled) - Removed for cleaner layout -->
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { Button, Card, KpiCard, EmptyState } from '@/design/components'
import SocTrend from '@/components/charts/SocTrend.vue'
import CarbonBar from '@/components/charts/CarbonBar.vue'

// Reactive data
const startDate = ref(getDefaultStartDate())
const endDate = ref(getDefaultEndDate()) 
const isLoading = ref(false)
const socLoading = ref(false)
const carbonLoading = ref(false)

// Helper functions for default dates
function getDefaultStartDate(): string {
  const today = new Date()
  const lastWeek = new Date(today)
  lastWeek.setDate(today.getDate() - 7)
  return lastWeek.toISOString().split('T')[0]
}

function getDefaultEndDate(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

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
  // Update data based on selected date range
  console.log('更新資料日期範圍:', { 
    startDate: startDate.value, 
    endDate: endDate.value 
  })
  
  // Validate date range
  if (startDate.value && endDate.value) {
    const start = new Date(startDate.value)
    const end = new Date(endDate.value)
    
    if (start > end) {
      alert('起始日期不能晚於結束日期')
      return
    }
    
    // Calculate days difference
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    console.log('日期範圍天數:', diffDays)
    
    // In real app, fetch data from API based on date range
    // Example API call: fetchData({ startDate: startDate.value, endDate: endDate.value })
  }
}

const exportData = () => {
  // Validate date range before export
  if (!startDate.value || !endDate.value) {
    alert('請選擇完整的日期範圍')
    return
  }
  
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  
  if (start > end) {
    alert('起始日期不能晚於結束日期')
    return
  }
  
  // Prepare export data
  const exportData = {
    dateRange: {
      startDate: startDate.value,
      endDate: endDate.value
    },
    kpi: {
      onlineVehicles: summary.online,
      offlineVehicles: summary.offline,
      totalDistance: summary.distance,
      carbonSaved: summary.carbon
    },
    chartData: {
      socTrend: {
        labels: socLabels,
        values: socValues
      },
      carbonReduction: {
        labels: carbonLabels,
        values: carbonValues
      }
    },
    exportTime: new Date().toISOString(),
    exportedBy: 'system'
  }
  
  // Create and download CSV file
  const csvContent = generateCSVContent(exportData)
  downloadCSV(csvContent, `system-overview-${startDate.value}-to-${endDate.value}.csv`)
  
  console.log('匯出資料:', exportData)
}

const generateCSVContent = (data: any): string => {
  const lines = []
  
  // Header
  lines.push('系統總覽報表')
  lines.push(`匯出時間：${new Date(data.exportTime).toLocaleString('zh-TW')}`)
  lines.push(`日期範圍：${data.dateRange.startDate} 至 ${data.dateRange.endDate}`)
  lines.push('')
  
  // KPI Data
  lines.push('KPI 指標')
  lines.push('指標名稱,數值,單位')
  lines.push(`上線車輛,${data.kpi.onlineVehicles},台`)
  lines.push(`離線車輛,${data.kpi.offlineVehicles},台`)
  lines.push(`今日總里程,${data.kpi.totalDistance},公里`)
  lines.push(`減碳效益,${data.kpi.carbonSaved},kg CO₂`)
  lines.push('')
  
  // SoC Trend Data
  lines.push('電池狀態趨勢')
  lines.push('時間,平均 SoC (%)')
  data.chartData.socTrend.labels.forEach((label: string, index: number) => {
    lines.push(`${label},${data.chartData.socTrend.values[index]}`)
  })
  lines.push('')
  
  // Carbon Reduction Data
  lines.push('減碳量統計')
  lines.push('日期,減碳量 (kg CO₂)')
  data.chartData.carbonReduction.labels.forEach((label: string, index: number) => {
    lines.push(`${label},${data.chartData.carbonReduction.values[index]}`)
  })
  
  return lines.join('\n')
}

const downloadCSV = (content: string, filename: string) => {
  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

// Cleanup: Removed unused helper methods for disabled alert and status sections

onMounted(() => {
  // Initial data load
  updateData()
})
</script>
