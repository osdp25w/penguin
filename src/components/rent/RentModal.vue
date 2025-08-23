<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="handleClose"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900">
            車輛租借
          </h3>
          <Button variant="ghost" size="sm" @click="handleClose">
            <i class="i-ph-x w-4 h-4"></i>
          </Button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Vehicle Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              車輛 ID <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="form.vehicleId"
                type="text"
                placeholder="輸入或搜尋車輛 ID..."
                class="input-base"
                :class="{ 'border-red-300': errors.vehicleId }"
                @input="searchVehicles"
              >
              <i class="i-ph-magnifying-glass absolute right-3 top-2.5 w-4 h-4 text-gray-600"></i>
            </div>
            <p v-if="errors.vehicleId" class="mt-1 text-sm text-red-600">{{ errors.vehicleId }}</p>
            
            <!-- Vehicle Search Results -->
            <div v-if="vehicleSearchResults.length > 0" class="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              <button
                v-for="vehicle in vehicleSearchResults"
                :key="vehicle.id"
                type="button"
                class="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                @click="selectVehicle(vehicle)"
              >
                <div>
                  <div class="font-medium">{{ vehicle.id }}</div>
                  <div class="text-sm text-gray-700">電量: {{ vehicle.batteryLevel }}%</div>
                </div>
                <div class="text-right">
                  <div class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                    可租借
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- User Info -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              使用者姓名 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.userName"
              type="text"
              placeholder="請輸入使用者姓名"
              class="input-base"
              :class="{ 'border-red-300': errors.userName }"
            >
            <p v-if="errors.userName" class="mt-1 text-sm text-red-600">{{ errors.userName }}</p>
          </div>

          <!-- Contact Info -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              聯絡電話 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.userPhone"
              type="tel"
              placeholder="請輸入聯絡電話"
              class="input-base"
              :class="{ 'border-red-300': errors.userPhone }"
            >
            <p v-if="errors.userPhone" class="mt-1 text-sm text-red-600">{{ errors.userPhone }}</p>
          </div>

          <!-- Site Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              租借站點 <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.siteId"
              class="input-base"
              :class="{ 'border-red-300': errors.siteId }"
            >
              <option value="">請選擇租借站點</option>
              <option value="site_hualien_001">華麗轉身 - 花蓮站點 A</option>
              <option value="site_hualien_002">華麗轉身 - 花蓮站點 B</option>
              <option value="site_taitung_001">順其自然 - 台東站點 A</option>
              <option value="site_taitung_002">順其自然 - 台東站點 B</option>
            </select>
            <p v-if="errors.siteId" class="mt-1 text-sm text-red-600">{{ errors.siteId }}</p>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              備註
            </label>
            <textarea
              v-model="form.notes"
              rows="3"
              placeholder="其他備註事項..."
              class="input-base resize-none"
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="flex space-x-3 pt-4">
            <Button type="button" variant="ghost" class="flex-1" @click="handleClose">
              取消
            </Button>
            <Button type="submit" variant="primary" class="flex-1" :disabled="isSubmitting">
              <i v-if="isSubmitting" class="i-ph-spinner w-4 h-4 mr-2 animate-spin"></i>
              <i v-else class="i-ph-bicycle w-4 h-4 mr-2"></i>
              確認租借
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Button } from '@/design/components'

// Props
interface Props {
  prefilledSiteId?: string
}

const props = withDefaults(defineProps<Props>(), {
  prefilledSiteId: undefined
})

// Emits
const emit = defineEmits<{
  close: []
  success: [rentRecord: any]
}>()

// Form data
const form = reactive({
  vehicleId: '',
  userName: '',
  userPhone: '',
  siteId: props.prefilledSiteId || '',
  notes: ''
})

// Form state
const errors = reactive({
  vehicleId: '',
  userName: '',
  userPhone: '',
  siteId: ''
})

const isSubmitting = ref(false)
const vehicleSearchResults = ref<any[]>([])

// Mock available vehicles
const mockAvailableVehicles = [
  { id: 'BIKE001', batteryLevel: 85, status: 'available' },
  { id: 'BIKE002', batteryLevel: 92, status: 'available' },
  { id: 'BIKE003', batteryLevel: 78, status: 'available' },
  { id: 'BIKE004', batteryLevel: 95, status: 'available' },
  { id: 'BIKE005', batteryLevel: 67, status: 'available' }
]

// Methods
function searchVehicles() {
  const query = form.vehicleId.toLowerCase()
  if (query.length >= 1) {
    vehicleSearchResults.value = mockAvailableVehicles.filter(vehicle => 
      vehicle.id.toLowerCase().includes(query)
    )
  } else {
    vehicleSearchResults.value = []
  }
}

function selectVehicle(vehicle: any) {
  form.vehicleId = vehicle.id
  vehicleSearchResults.value = []
}

function validateForm(): boolean {
  // Clear previous errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })

  let isValid = true

  // Vehicle ID validation
  if (!form.vehicleId.trim()) {
    errors.vehicleId = '請選擇車輛'
    isValid = false
  }

  // User name validation
  if (!form.userName.trim()) {
    errors.userName = '請輸入使用者姓名'
    isValid = false
  }

  // Phone validation
  if (!form.userPhone.trim()) {
    errors.userPhone = '請輸入聯絡電話'
    isValid = false
  } else if (!/^[0-9-+().\s]+$/.test(form.userPhone)) {
    errors.userPhone = '請輸入有效的電話號碼'
    isValid = false
  }

  // Site validation
  if (!form.siteId) {
    errors.siteId = '請選擇租借站點'
    isValid = false
  }

  return isValid
}

async function handleSubmit() {
  if (!validateForm()) return

  isSubmitting.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const rentRecord = {
      id: 'rent_' + Date.now(),
      vehicleId: form.vehicleId,
      userName: form.userName,
      userPhone: form.userPhone,
      siteId: form.siteId,
      notes: form.notes,
      rentTime: new Date().toISOString(),
      status: 'active'
    }

    console.log('租借記錄:', rentRecord)

    // Success feedback
    emit('success', rentRecord)
    handleClose()

  } catch (error) {
    console.error('租借失敗:', error)
    // TODO: 顯示錯誤訊息
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  emit('close')
}
</script>