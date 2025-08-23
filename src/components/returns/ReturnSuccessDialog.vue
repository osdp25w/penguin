<template>
  <!-- 背景遮罩 -->
  <div 
    v-if="show"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click.self="handleClose"
  >
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- 背景遮罩 -->
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        @click="handleClose"
      ></div>

      <!-- 定位元素 -->
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <!-- Modal 主體 -->
      <div 
        class="inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full"
        @click.stop
      >
        <!-- 成功圖示 -->
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <i class="i-ph-check-circle w-8 h-8 text-green-600"></i>
          </div>
          
          <!-- 標題 -->
          <h3 class="text-xl font-semibold text-gray-900 mb-2">
            歸還成功！
          </h3>
          
          <!-- 描述 -->
          <div class="text-gray-600 mb-6">
            <p class="mb-2">車輛已成功歸還至指定站點</p>
            <p class="font-medium text-indigo-600">{{ returnRecord?.id || '' }}</p>
            
            <!-- 歸還摘要 -->
            <div v-if="returnRecord" class="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4 text-left">
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="font-medium text-gray-700">車輛 ID:</span>
                  <span class="text-gray-900">{{ returnRecord.vehicleId }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium text-gray-700">歸還時間:</span>
                  <span class="text-gray-900">{{ formatTime(returnRecord.createdAt) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium text-gray-700">里程數:</span>
                  <span class="text-gray-900">{{ returnRecord.odometer }} km</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium text-gray-700">剩餘電量:</span>
                  <span class="text-gray-900">{{ returnRecord.battery }}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 提示訊息 -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <div class="flex items-start">
              <i class="i-ph-info w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"></i>
              <div class="text-sm text-blue-800">
                <p class="font-medium mb-1">歸還完成</p>
                <p>感謝您的使用，歸還記錄已保存</p>
              </div>
            </div>
          </div>
          
          <!-- 底部按鈕 -->
          <div class="flex space-x-3">
            <button
              type="button"
              @click="handleClose"
              class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              關閉
            </button>
            <button
              type="button"
              @click="handleGoToHistory"
              class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              <i class="i-ph-clock-clockwise w-4 h-4 mr-2 inline-block"></i>
              查看歷史記錄
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import type { ReturnRecord } from '@/stores/returns'

interface Props {
  show: boolean
  returnRecord: ReturnRecord | null
}

interface Emits {
  close: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()

// 方法
function handleClose() {
  emit('close')
}

function handleGoToHistory() {
  emit('close')
  // 導航到歷史記錄頁面（如果存在的話）
  // router.push('/history')
  console.log('Navigate to history page')
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 鍵盤事件處理
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleClose()
  }
}

// 添加鍵盤事件監聽
watch(() => props.show, (newShow) => {
  if (newShow) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>