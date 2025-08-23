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
        <!-- 標題 -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-900">
            車輛租借
          </h3>
          <button 
            @click="handleClose"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i class="i-ph-x w-5 h-5"></i>
          </button>
        </div>

        <!-- 表單 -->
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- 車輛 ID -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              車輛 ID
            </label>
            <input
              :value="vehicle?.id || ''"
              type="text"
              readonly
              class="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
            >
          </div>

          <!-- 使用者姓名 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              使用者姓名 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.userName"
              type="text"
              placeholder="請輸入姓名（2-30字）"
              class="w-full px-4 py-3 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="errors.userName ? 'border-red-300 bg-red-50' : 'border-gray-300'"
              :disabled="loading"
            >
            <p v-if="errors.userName" class="mt-1 text-xs text-red-600">{{ errors.userName }}</p>
          </div>

          <!-- 聯絡電話 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              聯絡電話 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.phone"
              type="tel"
              placeholder="09xxxxxxxx 或 +886xxxxxxxxx"
              class="w-full px-4 py-3 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'"
              :disabled="loading"
            >
            <p v-if="errors.phone" class="mt-1 text-xs text-red-600">{{ errors.phone }}</p>
          </div>

          <!-- 身分證末四碼 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              身分證末四碼 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.idLast4"
              type="text"
              placeholder="請輸入身分證末四碼"
              maxlength="4"
              class="w-full px-4 py-3 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="errors.idLast4 ? 'border-red-300 bg-red-50' : 'border-gray-300'"
              :disabled="loading"
            >
            <p v-if="errors.idLast4" class="mt-1 text-xs text-red-600">{{ errors.idLast4}}</p>
          </div>

          <!-- 底部按鈕 -->
          <div class="flex space-x-3 pt-4">
            <button
              type="button"
              @click="handleClose"
              class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              :disabled="loading"
            >
              取消
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="loading || !isFormValid"
            >
              <i v-if="loading" class="i-ph-spinner w-4 h-4 mr-2 animate-spin inline-block"></i>
              <i v-else class="i-ph-check-circle w-4 h-4 mr-2 inline-block"></i>
              {{ loading ? '處理中...' : '確定租借' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useRentals } from '@/stores/rentals'
import { CreateRentalSchema } from '@/types/rental'
import type { Vehicle } from '@/types/vehicle'

interface Props {
  show: boolean
  vehicle: Vehicle | null
}

interface Emits {
  close: []
  success: [rental: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const rentalsStore = useRentals()

// 表單資料
const form = reactive({
  userName: '',
  phone: '',
  idLast4: ''
})

// 錯誤狀態
const errors = reactive({
  userName: '',
  phone: '',
  idLast4: ''
})

const loading = ref(false)

// 計算屬性
const isFormValid = computed(() => {
  return form.userName.trim() && 
         form.phone.trim() && 
         form.idLast4.trim() &&
         !errors.userName &&
         !errors.phone &&
         !errors.idLast4
})

// 方法
function validateField(field: keyof typeof form) {
  errors[field] = ''

  switch (field) {
    case 'userName':
      if (!form.userName.trim()) {
        errors.userName = '請輸入使用者姓名'
      } else if (form.userName.length < 2 || form.userName.length > 30) {
        errors.userName = '姓名長度必須在 2-30 字之間'
      }
      break

    case 'phone':
      if (!form.phone.trim()) {
        errors.phone = '請輸入聯絡電話'
      } else if (!/^(09\d{8}|(\+886|886)9\d{8})$/.test(form.phone)) {
        errors.phone = '請輸入有效的台灣手機號碼'
      }
      break

    case 'idLast4':
      if (!form.idLast4.trim()) {
        errors.idLast4 = '請輸入身分證末四碼'
      } else if (!/^\d{4}$/.test(form.idLast4)) {
        errors.idLast4 = '請輸入四位數字'
      }
      break
  }
}

function validateForm(): boolean {
  validateField('userName')
  validateField('phone')
  validateField('idLast4')

  return !errors.userName && !errors.phone && !errors.idLast4
}

async function handleSubmit() {
  if (!validateForm() || !props.vehicle) return

  loading.value = true
  rentalsStore.clearError()

  try {
    // 驗證表單資料
    const formData = CreateRentalSchema.parse({
      bikeId: props.vehicle.id,
      userName: form.userName.trim(),
      phone: form.phone.trim(),
      idLast4: form.idLast4.trim()
    })

    // 建立租借單
    const rental = await rentalsStore.createRental(formData)

    // 開鎖
    await rentalsStore.unlockCurrent()

    // 更新車輛狀態
    rentalsStore.setInUse(props.vehicle.id)

    // 成功
    emit('success', rental)
    clearForm()
    handleClose()

  } catch (error) {
    console.error('租借失敗:', error)
    // 錯誤已經在 store 中處理
  } finally {
    loading.value = false
  }
}

function handleClose() {
  if (!loading.value) {
    emit('close')
    clearForm()
  }
}

function clearForm() {
  form.userName = ''
  form.phone = ''
  form.idLast4 = ''
  
  errors.userName = ''
  errors.phone = ''
  errors.idLast4 = ''
}

// 監聽表單變化進行即時驗證
watch(() => form.userName, () => validateField('userName'), { flush: 'post' })
watch(() => form.phone, () => validateField('phone'), { flush: 'post' })
watch(() => form.idLast4, () => validateField('idLast4'), { flush: 'post' })

// 監聽 show 狀態變化
watch(() => props.show, async (newShow) => {
  if (newShow) {
    await nextTick()
    // 焦點設置到第一個可編輯欄位
    const firstInput = document.querySelector('input[type="text"]:not([readonly])') as HTMLElement
    firstInput?.focus()
  } else {
    clearForm()
  }
})

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