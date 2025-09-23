<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">遙測設備管理 (測試版本)</h1>
    <p class="mb-4">如果你能看到這個頁面，說明基本路由是正常的。</p>

    <div class="bg-blue-50 p-4 rounded mb-4">
      <h2 class="font-semibold mb-2">診斷信息：</h2>
      <ul class="space-y-1 text-sm">
        <li>✅ Vue 組件載入正常</li>
        <li>{{ telemetryStoreStatus }}</li>
        <li>{{ pagingStatus }}</li>
        <li>狀態選項數量: {{ statusOptions.length }}</li>
      </ul>
    </div>

    <div class="bg-gray-50 p-4 rounded">
      <h3 class="font-semibold mb-2">原始數據：</h3>
      <pre class="text-xs">{{ JSON.stringify({ loading, data: data.slice(0, 2) }, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onErrorCaptured } from 'vue'
import { DEFAULT_TELEMETRY_STATUS_OPTIONS, useTelemetry } from '@/stores/telemetry'
import { usePaging } from '@/composables/usePaging'

console.log('[TelemetryDevicesTest] Component loading...')

onErrorCaptured((err, instance, info) => {
  console.error('[TelemetryDevicesTest] Error:', err, instance, info)
  return false
})

const telemetry = useTelemetry()
const loading = ref(true)
const data = ref([])

const paging = usePaging({
  fetcher: async ({ limit, offset }) => {
    console.log('[TelemetryDevicesTest] Fetcher called with:', { limit, offset })
    try {
      return await telemetry.fetchDevicesPaged({ limit, offset })
    } catch (error) {
      console.error('[TelemetryDevicesTest] Fetcher error:', error)
      return { data: [], total: 0 }
    }
  }
})

const statusOptions = computed(() => {
  console.log('[TelemetryDevicesTest] StatusOptions computed:', telemetry.statusOptions)
  const options = telemetry.statusOptions || []
  return options.length > 0 ? options : DEFAULT_TELEMETRY_STATUS_OPTIONS
})

const telemetryStoreStatus = computed(() => {
  return telemetry ? '✅ Telemetry store 載入成功' : '❌ Telemetry store 載入失敗'
})

const pagingStatus = computed(() => {
  return paging ? '✅ Paging composable 載入成功' : '❌ Paging composable 載入失敗'
})

onMounted(async () => {
  console.log('[TelemetryDevicesTest] Component mounted')

  try {
    loading.value = true

    console.log('[TelemetryDevicesTest] Fetching status options...')
    await telemetry.fetchDeviceStatusOptions()

    console.log('[TelemetryDevicesTest] Refreshing paging...')
    await paging.refresh()

    data.value = paging.data.value
    console.log('[TelemetryDevicesTest] Data loaded:', data.value)
  } catch (error) {
    console.error('[TelemetryDevicesTest] Mount error:', error)
  } finally {
    loading.value = false
  }
})
</script>
