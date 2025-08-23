<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">啟用測試資料</h3>
      
      <div class="space-y-4 text-sm text-gray-600 dark:text-gray-600">
        <div>
          <h4 class="font-medium text-gray-900 dark:text-white">1. 設定環境變數</h4>
          <p>在 .env 檔案中加入：</p>
          <code class="block bg-gray-100 dark:bg-gray-800 p-2 mt-1 rounded text-xs">
            VITE_SEED_MOCK=1
          </code>
        </div>
        
        <div>
          <h4 class="font-medium text-gray-900 dark:text-white">2. 使用測試模式啟動</h4>
          <code class="block bg-gray-100 dark:bg-gray-800 p-2 mt-1 rounded text-xs">
            npm run dev:mock
          </code>
        </div>
        
        <div>
          <p class="text-yellow-600 dark:text-yellow-400">
            ⚠️ 測試資料僅用於開發展示，不包含真實地名或座標
          </p>
        </div>
      </div>
      
      <div class="flex justify-end mt-6">
        <button 
          @click="$emit('close')"
          class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          了解
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  close: []
}>()
</script>