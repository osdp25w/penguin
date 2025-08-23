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
            租借成功！
          </h3>
          
          <!-- 描述 -->
          <div class="text-gray-600 mb-6">
            <p class="mb-2">恭喜您成功租借車輛</p>
            <p class="font-medium text-indigo-600">{{ rental?.rentalId || '' }}</p>
          </div>
          
          <!-- 提示訊息 -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <div class="flex items-start">
              <i class="i-ph-info w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"></i>
              <div class="text-sm text-blue-800">
                <p class="font-medium mb-1">租借流程已完成</p>
                <p>請至「個人車輛」查看與操作您的租借車輛</p>
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
              稍後
            </button>
            <button
              type="button"
              @click="handleGoToMyVehicles"
              class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              <i class="i-ph-bicycle w-4 h-4 mr-2 inline-block"></i>
              前往個人車輛
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
import type { Rental } from '@/types/rental'

interface Props {
  show: boolean
  rental: Rental | null
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

function handleGoToMyVehicles() {
  emit('close')
  router.push('/my-vehicles')
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