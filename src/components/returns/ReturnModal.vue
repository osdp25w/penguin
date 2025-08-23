<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="handleClose"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900">
            車輛歸還
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
                  <div class="text-sm text-gray-700">{{ vehicle.status === 'in-use' ? '使用中' : '其他狀態' }}</div>
                </div>
                <div class="text-sm text-gray-600">
                  {{ vehicle.batteryLevel }}%
                </div>
              </button>
            </div>
          </div>

          <!-- Site Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              歸還站點 <span class="text-red-500">*</span>
            </label>
            <select 
              v-model="form.siteId"
              class="input-base"
              :class="{ 'border-red-300': errors.siteId }"
            >
              <option value="">請選擇站點</option>
              <option v-for="site in sites" :key="site.id" :value="site.id">
                {{ site.name }} ({{ site.availableSpots }}/{{ site.capacity }} 可用)
              </option>
            </select>
            <p v-if="errors.siteId" class="mt-1 text-sm text-red-600">{{ errors.siteId }}</p>
          </div>

          <!-- Odometer Reading -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              里程表讀數 (km) <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="form.odometer"
              type="number"
              min="0"
              step="0.1"
              placeholder="0.0"
              class="input-base"
              :class="{ 'border-red-300': errors.odometer }"
            >
            <p v-if="errors.odometer" class="mt-1 text-sm text-red-600">{{ errors.odometer }}</p>
          </div>

          <!-- Battery Level -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              電池電量 (%) <span class="text-red-500">*</span>
            </label>
            <div class="space-y-2">
              <input
                v-model.number="form.battery"
                type="range"
                min="0"
                max="100"
                class="w-full"
              >
              <div class="flex justify-between text-sm text-gray-700">
                <span>0%</span>
                <span class="font-medium text-gray-900">{{ form.battery }}%</span>
                <span>100%</span>
              </div>
            </div>
            <p v-if="errors.battery" class="mt-1 text-sm text-red-600">{{ errors.battery }}</p>
          </div>

          <!-- Issues -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              問題描述 (選填)
            </label>
            <textarea
              v-model="form.issues"
              rows="3"
              placeholder="如有任何問題或異常情況，請描述..."
              class="input-base resize-none"
            ></textarea>
          </div>

          <!-- Photos -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              相片上傳 (選填)
            </label>
            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div class="space-y-1 text-center">
                <i class="i-ph-camera w-8 h-8 text-gray-600 mx-auto"></i>
                <div class="flex text-sm text-gray-600">
                  <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-brand-primary hover:text-brand-secondary">
                    <span>上傳檔案</span>
                    <input id="file-upload" name="file-upload" type="file" multiple accept="image/*" class="sr-only" @change="handleFileUpload">
                  </label>
                  <p class="pl-1">或拖拉至此處</p>
                </div>
                <p class="text-xs text-gray-700">PNG, JPG, GIF 最多 10MB</p>
              </div>
            </div>
            
            <!-- Preview uploaded photos -->
            <div v-if="form.photos.length > 0" class="mt-3 grid grid-cols-2 gap-2">
              <div 
                v-for="(photo, index) in form.photos" 
                :key="index"
                class="relative group"
              >
                <img 
                  :src="photo" 
                  alt="上傳的相片"
                  class="w-full h-20 object-cover rounded-lg border"
                >
                <button
                  type="button"
                  class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  @click="removePhoto(index)"
                >
                  <i class="i-ph-x w-3 h-3"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" type="button" @click="handleClose">
              取消
            </Button>
            <Button variant="primary" type="submit" :disabled="isSubmitting">
              <i v-if="isSubmitting" class="i-ph-spinner w-4 h-4 mr-2 animate-spin"></i>
              <i v-else class="i-ph-arrow-right w-4 h-4 mr-2"></i>
              {{ isSubmitting ? '處理中...' : '下一步：確認歸還' }}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { z } from 'zod'
import { Button } from '@/design/components'
import { useReturns } from '@/stores/returns'
import { useVehicles } from '@/stores/vehicles'
import { useSites } from '@/stores/sites'

const props = defineProps<{
  prefilledSiteId?: string
}>()

const emit = defineEmits<{
  close: []
  success: [returnRecord: any]
  requestConfirm: [returnData: any]
}>()

// Stores
const returnsStore = useReturns()
const vehiclesStore = useVehicles()
const sitesStore = useSites()

// Form data
const form = reactive({
  vehicleId: '',
  siteId: props.prefilledSiteId || '',
  odometer: 0,
  battery: 50,
  issues: '',
  photos: [] as string[]
})

const isSubmitting = ref(false)
const vehicleSearchResults = ref<any[]>([])

// Validation schema
const ReturnSchema = z.object({
  vehicleId: z.string().min(1, '請選擇車輛'),
  siteId: z.string().min(1, '請選擇歸還站點'),
  odometer: z.number().nonnegative('里程表讀數必須大於等於 0'),
  battery: z.number().min(0, '電池電量最小為 0%').max(100, '電池電量最大為 100%'),
  issues: z.string().optional(),
  photos: z.array(z.string().url()).optional(),
})

const errors = ref<Record<string, string>>({})

// Computed
const sites = computed(() => sitesStore.sites)
const vehicles = computed(() => vehiclesStore.vehicles)

// Methods
const searchVehicles = () => {
  if (!form.vehicleId || form.vehicleId.length < 2) {
    vehicleSearchResults.value = []
    return
  }

  const query = form.vehicleId.toLowerCase()
  vehicleSearchResults.value = vehicles.value
    .filter(v => 
      v.id.toLowerCase().includes(query) ||
      v.status === 'in-use' // Prioritize in-use vehicles
    )
    .slice(0, 5)
}

const selectVehicle = (vehicle: any) => {
  form.vehicleId = vehicle.id
  form.battery = vehicle.batteryLevel || 50
  vehicleSearchResults.value = []
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files) return

  Array.from(files).forEach(file => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('檔案大小超過 10MB 限制')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        form.photos.push(e.target.result)
      }
    }
    reader.readAsDataURL(file)
  })
}

const removePhoto = (index: number) => {
  form.photos.splice(index, 1)
}

const validateForm = () => {
  errors.value = {}

  try {
    ReturnSchema.parse(form)
    return true
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        if (err.path[0]) {
          errors.value[err.path[0] as string] = err.message
        }
      })
    }
    return false
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return

  // 不直接執行歸還，而是發送確認請求
  const returnData = {
    vehicleId: form.vehicleId,
    siteId: form.siteId,
    odometer: form.odometer,
    battery: form.battery,
    issues: form.issues || undefined,
    photos: form.photos.length > 0 ? form.photos : undefined
  }

  emit('requestConfirm', returnData)
}

const handleClose = () => {
  if (!isSubmitting.value) {
    emit('close')
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    vehiclesStore.fetchVehicles(),
    sitesStore.fetchSites()
  ])
})
</script>