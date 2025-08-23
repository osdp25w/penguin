<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">地圖設定指引</h3>
      
      <div class="space-y-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <h4 class="font-medium text-gray-900 dark:text-white">1. 設定地圖圖層</h4>
          <p>在專案根目錄的 .env 檔案中設定 NLSC WMTS 圖層：</p>
          <code class="block bg-gray-100 dark:bg-gray-800 p-2 mt-1 rounded text-xs">
            VITE_EMAP_LAYER=EMAP<br/>
            VITE_EMAP_MATRIXSET=GoogleMapsCompatible
          </code>
        </div>
        
        <div>
          <h4 class="font-medium text-gray-900 dark:text-white">2. 設定地圖中心與縮放</h4>
          <code class="block bg-gray-100 dark:bg-gray-800 p-2 mt-1 rounded text-xs">
            VITE_MAP_CENTER=23.8,121.6<br/>
            VITE_MAP_ZOOM=10
          </code>
        </div>
        
        <div>
          <h4 class="font-medium text-gray-900 dark:text-white">3. 重新啟動開發伺服器</h4>
          <code class="block bg-gray-100 dark:bg-gray-800 p-2 mt-1 rounded text-xs">
            npm run dev
          </code>
        </div>
        
        <div class="text-xs text-gray-500 dark:text-gray-400">
          <p>地圖資料來源：© 內政部國土測繪中心（NLSC）</p>
          <p>可選圖層：EMAP（通用電子地圖）、EMAP2（透明版）、PHOTO2（正射影像）</p>
        </div>
      </div>
      
      <div class="flex justify-end mt-6">
        <button 
          @click="$emit('close')"
          class="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600"
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