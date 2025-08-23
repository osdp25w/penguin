<template>
  <div class="space-y-6">
    <!-- Header ---------------------------------------------------- -->
    <header class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-black">警報中心</h2>

      <div class="flex items-center gap-3">
        <!-- 即時串流開 / 關 -->
        <button
          class="btn"
          :class="store.isLive
            ? 'bg-rose-600 hover:bg-rose-500'
            : 'bg-indigo-600 hover:bg-indigo-500'"
          @click="toggleStream"
        >
          <i class="i-ph-lightning w-4 h-4 mr-2"></i>
          {{ store.isLive ? '停止即時' : '重新整理' }}
        </button>
      </div>
    </header>

    <!-- Statistics Cards ------------------------------------------- -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <!-- 危急事件 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div>
          <p class="text-sm font-medium text-gray-600">危急事件</p>
          <p class="text-2xl font-bold text-rose-600">{{ criticalCount }}</p>
        </div>
        <div class="mt-2 flex items-center text-sm">
          <span class="text-gray-500">需要立即處理</span>
        </div>
      </div>

      <!-- 警告事件 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div>
          <p class="text-sm font-medium text-gray-600">警告事件</p>
          <p class="text-2xl font-bold text-amber-600">{{ warningCount }}</p>
        </div>
        <div class="mt-2 flex items-center text-sm">
          <span class="text-gray-500">需要關注處理</span>
        </div>
      </div>

      <!-- 提醒事件 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div>
          <p class="text-sm font-medium text-gray-600">提醒事件</p>
          <p class="text-2xl font-bold text-emerald-600">{{ infoCount }}</p>
        </div>
        <div class="mt-2 flex items-center text-sm">
          <span class="text-gray-500">一般資訊通知</span>
        </div>
      </div>
    </div>

    <!-- List ------------------------------------------------------- -->
    <div class="grid gap-4">
      <div
        v-for="a in store.list"
        :key="a.id"
        class="card flex items-center justify-between"
        :class="{
          'border-emerald-500/60': a.severity === 'info',
          'border-amber-500/60'  : a.severity === 'warning',
          'border-rose-500/60'   : a.severity === 'critical'
        }"
      >
        <div>
          <div class="font-medium">
            <span
              class="px-2 py-0.5 rounded text-xs text-white mr-2"
              :class="sevColor(a.severity)"
            >
              {{ sevLabel(a.severity) }}
            </span>
            <span class="text-black font-semibold">{{ a.message }}</span>
          </div>
          <div class="text-sm text-black">
            車號：{{ a.vehicleId || '未知' }} ｜ {{ formatTime(a.createdAt) }}
          </div>
        </div>

        <!-- 確認（關閉）警報 -->
        <button
          class="btn bg-gray-700 hover:bg-gray-600 text-white"
          @click="store.acknowledge(a.id)"
        >
          確認
        </button>
      </div>
    </div>

    <!-- 空狀態 -->
    <div v-if="!store.isLoading && store.list.length === 0" class="text-center py-8">
      <div class="text-gray-400 mb-2">
        <i class="i-ph-check-circle w-16 h-16 mx-auto"></i>
      </div>
      <h3 class="text-lg font-medium text-black mb-2">暫無警報</h3>
      <p class="text-black">系統運作正常，沒有需要處理的警報</p>
    </div>

    <!-- 載入狀態 -->
    <div v-if="store.isLoading" class="text-center py-8">
      <i class="i-ph-spinner w-8 h-8 animate-spin mx-auto text-gray-400"></i>
      <p class="mt-2 text-black">載入中...</p>
    </div>

    <!-- 錯誤訊息 -->
    <p v-if="store.errMsg" class="text-rose-500 bg-rose-50 p-3 rounded-lg">
      <i class="i-ph-warning-circle w-4 h-4 inline mr-2"></i>
      {{ store.errMsg }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useAlerts } from '@/stores'

const store = useAlerts()

// 計算各種嚴重程度的警報數量
const criticalCount = computed(() => 
  store.list.filter(alert => alert.severity === 'critical').length
)

const warningCount = computed(() => 
  store.list.filter(alert => alert.severity === 'warning').length
)

const infoCount = computed(() => 
  store.list.filter(alert => alert.severity === 'info').length
)

/* 首次進頁面就抓取未關閉警報 */
onMounted(() => store.fetchOpen())

/* 即時串流開 / 關（demo 無真正 stop，這裡用 reload） */
const toggleStream = () => {
  if (store.isLive) location.reload()
  else store.startStream()
}

/* 時間格式化 ------------------------------------------------------ */
const formatTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '時間未知'
  }
}

/* 中文標籤 -------------------------------------------------------- */
const sevLabel = (s: string) =>
  s === 'info'       ? '資訊'
  : s === 'warning'  ? '警告'
  : s === 'critical' ? '危急'
  : s === 'error'    ? '錯誤'
  : s

/* 顏色 ------------------------------------------------------------ */
const sevColor = (s: string) =>
  s === 'info'      ? 'bg-emerald-500'
  : s === 'warning' ? 'bg-amber-500'
  : s === 'error'   ? 'bg-red-500'
  : 'bg-rose-500'
</script>
