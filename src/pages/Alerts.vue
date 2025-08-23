<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <i class="i-ph:bell w-6 h-6 text-brand-primary" />
          <h1 class="text-xl font-semibold text-gray-900">警報中心</h1>
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="store.fetchOpen"
            class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <i class="i-ph:arrow-clockwise w-4 h-4" />
            <span>重新抓取</span>
          </button>
          <button
            @click="toggleStream"
            :class="[
              'flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg',
              store.isLive
                ? 'text-white bg-red-600 hover:bg-red-700'
                : 'text-white bg-green-600 hover:bg-green-700'
            ]"
          >
            <i class="i-ph:lightning w-4 h-4" />
            <span>{{ store.isLive ? '停止即時' : '啟動即時' }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="flex h-[calc(100vh-80px)]">
      <!-- Left Panel: Filters and Summary -->
      <div class="w-80 border-r border-gray-200 bg-white overflow-hidden flex flex-col">
        <!-- Summary Stats -->
        <div class="p-4 border-b border-gray-200">
          <div class="grid grid-cols-3 gap-3">
            <div class="text-center">
              <div class="text-xl font-bold text-red-600">{{ criticalCount }}</div>
              <div class="text-xs text-gray-500">危急</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-yellow-600">{{ warningCount }}</div>
              <div class="text-xs text-gray-500">警告</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-blue-600">{{ infoCount }}</div>
              <div class="text-xs text-gray-500">資訊</div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="p-4 border-b border-gray-200">
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">嚴重等級</label>
              <select
                v-model="selectedSeverity"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="all">全部</option>
                <option value="critical">危急</option>
                <option value="warning">警告</option>
                <option value="info">資訊</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">車輛編號</label>
              <input
                v-model="vehicleFilter"
                type="text"
                placeholder="輸入車輛編號..."
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <!-- Alerts List -->
        <div class="flex-1 overflow-y-auto">
          <div class="divide-y divide-gray-200">
            <div
              v-for="alert in filteredAlerts"
              :key="alert.id"
              @click="selectAlert(alert)"
              :class="[
                'p-4 cursor-pointer hover:bg-gray-50 transition-colors',
                selectedAlert?.id === alert.id ? 'bg-blue-50 border-r-2 border-brand-primary' : ''
              ]"
            >
              <div class="flex items-start space-x-3">
                <div
                  :class="[
                    'w-3 h-3 rounded-full mt-1 flex-shrink-0',
                    getSeverityColor(alert.severity)
                  ]"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        getSeverityBadgeClass(alert.severity)
                      ]"
                    >
                      {{ sevLabel(alert.severity) }}
                    </span>
                    <span class="text-xs text-gray-500">{{ formatTime(alert.ts) }}</span>
                  </div>
                  <p class="text-sm font-medium text-gray-900 mb-1">{{ alert.message }}</p>
                  <p class="text-xs text-gray-600">車號：{{ alert.vehicleId }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredAlerts.length === 0" class="p-8 text-center">
            <i class="i-ph:bell-slash w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 class="text-sm font-medium text-gray-900 mb-2">暫無警報</h3>
            <p class="text-xs text-gray-500">目前沒有符合條件的警報</p>
          </div>
        </div>
      </div>

      <!-- Right Panel: Alert Details -->
      <div class="flex-1 bg-white overflow-hidden">
        <div v-if="selectedAlert" class="h-full flex flex-col">
          <!-- Alert Header -->
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-start justify-between">
              <div class="flex items-start space-x-4">
                <div
                  :class="[
                    'w-4 h-4 rounded-full mt-1 flex-shrink-0',
                    getSeverityColor(selectedAlert.severity)
                  ]"
                />
                <div>
                  <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ selectedAlert.message }}</h2>
                  <div class="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{{ formatFullTime(selectedAlert.ts) }}</span>
                    <span>•</span>
                    <span>車輛：{{ selectedAlert.vehicleId }}</span>
                    <span>•</span>
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full',
                        getSeverityBadgeClass(selectedAlert.severity)
                      ]"
                    >
                      {{ sevLabel(selectedAlert.severity) }}
                    </span>
                  </div>
                </div>
              </div>
              <button
                @click="store.acknowledge(selectedAlert.id)"
                class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                確認處理
              </button>
            </div>
          </div>

          <!-- Alert Content -->
          <div class="flex-1 p-6 overflow-y-auto">
            <div class="space-y-6">
              <div>
                <h3 class="text-sm font-medium text-gray-900 mb-3">警報詳情</h3>
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="font-medium text-gray-700">嚴重等級：</span>
                      <span :class="getSeverityTextClass(selectedAlert.severity)">
                        {{ sevLabel(selectedAlert.severity) }}
                      </span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-700">車輛編號：</span>
                      <span class="text-gray-900">{{ selectedAlert.vehicleId }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-700">發生時間：</span>
                      <span class="text-gray-900">{{ formatFullTime(selectedAlert.ts) }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-700">警報ID：</span>
                      <span class="text-gray-900 font-mono">{{ selectedAlert.id }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-900 mb-3">建議處理方式</h3>
                <div class="space-y-2">
                  <div
                    v-for="action in getRecommendedActions(selectedAlert.severity)"
                    :key="action"
                    class="flex items-start space-x-2"
                  >
                    <i class="i-ph:check-circle w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span class="text-sm text-gray-700">{{ action }}</span>
                  </div>
                </div>
              </div>

              <div v-if="store.isLive" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-center space-x-2 mb-2">
                  <i class="i-ph:lightning w-4 h-4 text-blue-600" />
                  <h4 class="text-sm font-medium text-blue-900">即時監控中</h4>
                </div>
                <p class="text-xs text-blue-700">系統正在即時監控此警報狀態，如有更新將自動顯示</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="h-full flex items-center justify-center">
          <div class="text-center">
            <i class="i-ph:bell w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">選擇警報</h3>
            <p class="text-gray-500">點擊左側列表中的警報以查看詳細資訊</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="store.errMsg"
      class="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg"
    >
      <div class="flex items-center space-x-2">
        <i class="i-ph:warning-circle w-5 h-5" />
        <span class="text-sm font-medium">{{ store.errMsg }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAlerts } from '@/stores'

const store = useAlerts()

// State
const selectedAlert = ref<any>(null)
const selectedSeverity = ref<string>('all')
const vehicleFilter = ref<string>('')

// Computed
const filteredAlerts = computed(() => {
  return store.list.filter((alert: any) => {
    const severityMatch = selectedSeverity.value === 'all' || alert.severity === selectedSeverity.value
    const vehicleMatch = !vehicleFilter.value || alert.vehicleId.toLowerCase().includes(vehicleFilter.value.toLowerCase())
    return severityMatch && vehicleMatch
  }).sort((a: any, b: any) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
})

const criticalCount = computed(() => store.list.filter((a: any) => a.severity === 'critical').length)
const warningCount = computed(() => store.list.filter((a: any) => a.severity === 'warning').length)
const infoCount = computed(() => store.list.filter((a: any) => a.severity === 'info').length)

// Methods
const selectAlert = (alert: any) => {
  selectedAlert.value = alert
}

/* 首次進頁面就抓取未關閉警報 */
onMounted(() => {
  store.fetchOpen()
  // Auto-select first alert when available
  const unwatch = computed(() => filteredAlerts.value.length)
  const stopWatcher = unwatch.effect(() => {
    if (filteredAlerts.value.length > 0 && !selectedAlert.value) {
      selectAlert(filteredAlerts.value[0])
    }
  })
})

/* 即時串流開 / 關（demo 無真正 stop，這裡用 reload） */
const toggleStream = () => {
  if (store.isLive) location.reload()
  else store.startStream()
}

/* 中文標籤 -------------------------------------------------------- */
const sevLabel = (s: string) =>
  s === 'info'       ? '資訊'
  : s === 'warning'  ? '警告'
  : s === 'critical' ? '危急'
  : s

/* 顏色 ------------------------------------------------------------ */
const getSeverityColor = (s: string) =>
  s === 'info'      ? 'bg-blue-500'
  : s === 'warning' ? 'bg-yellow-500'
  : 'bg-red-500'

const getSeverityBadgeClass = (s: string) =>
  s === 'info'      ? 'bg-blue-100 text-blue-800'
  : s === 'warning' ? 'bg-yellow-100 text-yellow-800'
  : 'bg-red-100 text-red-800'

const getSeverityTextClass = (s: string) =>
  s === 'info'      ? 'text-blue-600 font-medium'
  : s === 'warning' ? 'text-yellow-600 font-medium'
  : 'text-red-600 font-medium'

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (minutes < 60) {
    return `${minutes}分鐘前`
  } else if (hours < 24) {
    return `${hours}小時前`
  } else {
    return date.toLocaleDateString()
  }
}

const formatFullTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getRecommendedActions = (severity: string) => {
  switch (severity) {
    case 'critical':
      return [
        '立即派遣維修人員前往現場',
        '暫停該車輛使用並標記為故障',
        '通知管理員進行緊急處理',
        '記錄故障詳情並建立維修工單'
      ]
    case 'warning':
      return [
        '安排定期檢查該車輛狀態',
        '監控相關數據變化',
        '考慮預防性維護措施',
        '更新車輛維護記錄'
      ]
    case 'info':
      return [
        '記錄相關資訊供後續分析',
        '持續監控系統狀態',
        '如有異常請及時回報'
      ]
    default:
      return ['請聯繫系統管理員處理']
  }
}
</script>
