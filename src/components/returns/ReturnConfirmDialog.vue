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
        class="inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        @click.stop
      >
        <!-- 警告圖示 -->
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
            <i class="i-ph-warning w-8 h-8 text-amber-600"></i>
          </div>
          
          <!-- 標題 -->
          <h3 class="text-xl font-semibold text-gray-900 mb-2">
            確認完成歸還
          </h3>
          
          <!-- 描述 -->
          <div class="text-gray-600 mb-6">
            <p class="mb-4">請確認車輛已正確停放並完成歸還流程：</p>
            
            <!-- 歸還資訊摘要 -->
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="font-medium text-gray-700">車輛 ID:</span>
                  <span class="text-gray-900">{{ returnData?.vehicleId || '' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium text-gray-700">歸還站點:</span>
                  <span class="text-gray-900">{{ siteName || returnData?.siteId || '' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium text-gray-700">里程數:</span>
                  <span class="text-gray-900">{{ returnData?.odometer || 0 }} km</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium text-gray-700">電池電量:</span>
                  <span class="text-gray-900">{{ returnData?.battery || 0 }}%</span>
                </div>
                <div v-if="returnData?.issues" class="border-t border-gray-200 pt-2">
                  <span class="font-medium text-gray-700">問題描述:</span>
                  <p class="text-gray-900 mt-1">{{ returnData.issues }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 確認檢查清單 -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <div class="flex items-start">
              <i class="i-ph-info w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"></i>
              <div class="text-sm text-blue-800">
                <p class="font-medium mb-2">歸還前請確認：</p>
                <ul class="space-y-1 text-sm">
                  <li class="flex items-center">
                    <i class="i-ph-check w-4 h-4 mr-2 text-blue-600"></i>
                    車輛已停放在指定站點
                  </li>
                  <li class="flex items-center">
                    <i class="i-ph-check w-4 h-4 mr-2 text-blue-600"></i>
                    車輛已正確鎖定
                  </li>
                  <li class="flex items-center">
                    <i class="i-ph-check w-4 h-4 mr-2 text-blue-600"></i>
                    已記錄正確的里程數和電量
                  </li>
                  <li v-if="returnData?.issues" class="flex items-center">
                    <i class="i-ph-check w-4 h-4 mr-2 text-blue-600"></i>
                    已記錄車輛問題描述
                  </li>
                </ul>
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
              @click="handleConfirm"
              class="flex-1 px-4 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="loading"
            >
              <i v-if="loading" class="i-ph-spinner w-4 h-4 mr-2 animate-spin inline-block"></i>
              <i v-else class="i-ph-check-circle w-4 h-4 mr-2 inline-block"></i>
              {{ loading ? '處理中...' : '確認完成歸還' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSites } from '@/stores/sites'

interface ReturnData {
  vehicleId: string
  siteId: string
  odometer: number
  battery: number
  issues?: string
  photos?: string[]
}

interface Props {
  show: boolean
  returnData: ReturnData | null
}

interface Emits {
  close: []
  confirm: [returnData: ReturnData]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const sitesStore = useSites()
const loading = ref(false)

// 計算站點名稱
const siteName = computed(() => {
  if (!props.returnData?.siteId) return ''
  const site = sitesStore.list.find(s => s.id === props.returnData!.siteId)
  return site?.name || props.returnData.siteId
})

// 方法
function handleClose() {
  if (!loading.value) {
    emit('close')
  }
}

async function handleConfirm() {
  if (!props.returnData || loading.value) return

  loading.value = true
  
  try {
    // 延遲一下以模擬處理時間
    await new Promise(resolve => setTimeout(resolve, 1000))
    emit('confirm', props.returnData)
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