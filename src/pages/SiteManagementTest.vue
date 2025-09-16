<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">場域管理 (測試版本)</h1>
    <p class="mb-4">如果你能看到這個頁面，說明基本路由是正常的。</p>

    <div class="bg-blue-50 p-4 rounded mb-4">
      <h2 class="font-semibold mb-2">診斷信息：</h2>
      <ul class="space-y-1 text-sm">
        <li>✅ Vue 組件載入正常</li>
        <li>{{ sitesStoreStatus }}</li>
        <li>{{ pagingStatus }}</li>
        <li>載入狀態: {{ loading ? '載入中' : '完成' }}</li>
        <li>資料數量: {{ data.length }}</li>
      </ul>
    </div>

    <div class="bg-gray-50 p-4 rounded">
      <h3 class="font-semibold mb-2">原始數據（前2筆）：</h3>
      <pre class="text-xs">{{ JSON.stringify(data.slice(0, 2), null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onErrorCaptured } from 'vue'
import { useSites } from '@/stores/sites'
import { usePaging } from '@/composables/usePaging'

console.log('[SiteManagementTest] Component loading...')

onErrorCaptured((err, instance, info) => {
  console.error('[SiteManagementTest] Error:', err, instance, info)
  return false
})

const sites = useSites()
const loading = ref(true)
const data = ref([])

const paging = usePaging({
  fetcher: async ({ limit, offset }) => {
    console.log('[SiteManagementTest] Fetcher called with:', { limit, offset })
    try {
      return await sites.fetchSitesPaged({ limit, offset })
    } catch (error) {
      console.error('[SiteManagementTest] Fetcher error:', error)
      return { data: [], total: 0 }
    }
  }
})

const sitesStoreStatus = computed(() => {
  return sites ? '✅ Sites store 載入成功' : '❌ Sites store 載入失敗'
})

const pagingStatus = computed(() => {
  return paging ? '✅ Paging composable 載入成功' : '❌ Paging composable 載入失敗'
})

onMounted(async () => {
  console.log('[SiteManagementTest] Component mounted')

  try {
    loading.value = true

    console.log('[SiteManagementTest] Refreshing paging...')
    await paging.refresh()

    data.value = paging.data.value
    console.log('[SiteManagementTest] Data loaded:', data.value)
  } catch (error) {
    console.error('[SiteManagementTest] Mount error:', error)
  } finally {
    loading.value = false
  }
})
</script>