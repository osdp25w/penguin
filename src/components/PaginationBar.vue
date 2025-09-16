<!-- src/components/PaginationBar.vue -->
<template>
  <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
    <!-- 左側：顯示資訊 -->
    <div class="flex flex-1 justify-between sm:hidden">
      <!-- 手機版簡化版本 -->
      <button
        @click="$emit('prev')"
        :disabled="!hasPrevPage"
        class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        上一頁
      </button>
      <button
        @click="$emit('next')"
        :disabled="!hasNextPage"
        class="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        下一頁
      </button>
    </div>

    <!-- 桌面版完整版本 -->
    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <!-- 左側資訊 -->
      <div class="flex items-center gap-4">
        <p class="text-sm text-gray-700">
          顯示第
          <span class="font-medium">{{ startItem }}</span>
          到
          <span class="font-medium">{{ endItem }}</span>
          筆，共
          <span class="font-medium">{{ total }}</span>
          筆資料
        </p>

        <!-- 每頁筆數選擇 -->
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-700">每頁：</label>
          <select
            :value="limit"
            @change="$emit('limit-change', Number($event.target.value))"
            class="rounded border-gray-300 text-sm focus:border-brand-primary focus:ring-brand-primary"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <!-- 右側分頁按鈕 -->
      <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="分頁">
        <!-- 上一頁 -->
        <button
          @click="$emit('prev')"
          :disabled="!hasPrevPage"
          class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="i-ph-caret-left w-4 h-4"></i>
        </button>

        <!-- 頁碼按鈕 -->
        <template v-for="(page, index) in pageRange" :key="index">
          <!-- 省略號 -->
          <span
            v-if="page === -1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
          >
            ...
          </span>

          <!-- 頁碼按鈕 -->
          <button
            v-else
            @click="$emit('page-change', page)"
            :class="[
              'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
              page === currentPage
                ? 'z-10 bg-brand-primary border-brand-primary text-white'
                : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
            ]"
          >
            {{ page }}
          </button>
        </template>

        <!-- 下一頁 -->
        <button
          @click="$emit('next')"
          :disabled="!hasNextPage"
          class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="i-ph-caret-right w-4 h-4"></i>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentPage: number
  totalPages: number
  total: number
  limit: number
  offset: number
  pageRange: number[]
  hasNextPage: boolean
  hasPrevPage: boolean
}

const props = defineProps<Props>()

defineEmits<{
  'page-change': [page: number]
  'limit-change': [limit: number]
  prev: []
  next: []
}>()

const startItem = computed(() => {
  return props.total === 0 ? 0 : props.offset + 1
})

const endItem = computed(() => {
  return Math.min(props.offset + props.limit, props.total)
})
</script>