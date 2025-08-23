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
        <!-- 資訊圖示 -->
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <i class="i-ph-info w-8 h-8 text-blue-600"></i>
          </div>
          
          <!-- 標題 -->
          <h3 class="text-xl font-semibold text-gray-900 mb-4">
            確認歸還車輛
          </h3>
          
          <!-- 通知訊息 -->
          <div class="text-gray-700 mb-6 leading-relaxed">
            <p>請確認車輛與停靠點已設定好！</p>
            <p class="mt-2">完成歸還請點選「確定歸還」，以結束本次租借</p>
          </div>
          
          <!-- 車輛資訊（如果有的話） -->
          <div v-if="vehicle" class="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 text-left">
            <div class="text-sm">
              <div class="flex justify-between items-center">
                <span class="font-medium text-gray-700">車輛 ID:</span>
                <span class="text-gray-900">{{ vehicle.id }}</span>
              </div>
            </div>
          </div>
          
          <!-- 底部按鈕 -->
          <div class="flex space-x-3">
            <button
              type="button"
              @click="handleClose"
              class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              :disabled="loading"
            >
              取消
            </button>
            <button
              type="button"
              @click="handleConfirmReturn"
              class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="loading"
            >
              <i v-if="loading" class="i-ph-spinner w-4 h-4 mr-2 animate-spin inline-block"></i>
              <i v-else class="i-ph-check-circle w-4 h-4 mr-2 inline-block"></i>
              {{ loading ? '處理中...' : '確定歸還' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useReturns } from '@/stores/returns'
import type { ReturnRecord } from '@/stores/returns'

interface Vehicle {
  id: string
  [key: string]: any
}

interface Props {
  show: boolean
  vehicle: Vehicle | null
}

interface Emits {
  close: []
  success: [returnRecord: ReturnRecord]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const returnsStore = useReturns()
const loading = ref(false)

// 方法
function handleClose() {
  if (!loading.value) {
    emit('close')
  }
}

async function handleConfirmReturn() {
  if (!props.vehicle || loading.value) return

  loading.value = true
  
  try {
    // 創建簡化的歸還記錄
    const returnData = {
      vehicleId: props.vehicle.id,
      siteId: props.vehicle.siteId || 'unknown', // 使用車輛當前站點或預設值
      odometer: 0, // 簡化版不需要填寫
      battery: props.vehicle.batteryPct || 50, // 使用當前電量
      issues: undefined,
      photos: undefined
    }

    const returnRecord = await returnsStore.confirmReturnVehicle(returnData)
    emit('success', returnRecord)
    emit('close')
  } catch (error) {
    console.error('歸還失敗:', error)
    // TODO: 顯示錯誤提示
  } finally {
    loading.value = false
  }
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