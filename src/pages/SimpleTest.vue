<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-green-600 mb-4">✅ 簡單測試頁面載入成功</h1>
    <p class="mb-4">如果您能看到這個頁面，說明：</p>
    <ul class="list-disc list-inside space-y-2 mb-4">
      <li>Vue 路由工作正常</li>
      <li>動態 import 工作正常</li>
      <li>權限檢查通過（如果這是管理頁面）</li>
      <li>組件能正常載入和渲染</li>
    </ul>

    <div class="bg-blue-50 p-4 rounded-lg">
      <p class="text-sm text-blue-800">
        當前路由: <code class="bg-blue-200 px-1 rounded">{{ $route.path }}</code>
      </p>
      <p class="text-sm text-blue-800 mt-1">
        頁面標題: {{ $route.meta.title }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 最簡單的頁面，不導入任何複雜依賴
console.log('[SimpleTest] Page loaded successfully')
</script>