<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click="handleBackdropClick"
      >
        <div
          class="w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[90vh] overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">歸還車輛</h2>
            <Button
              variant="ghost"
              size="sm"
              @click="$emit('close')"
              class="!p-2"
            >
              <i class="i-ph:x w-5 h-5"></i>
            </Button>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="p-6 space-y-6 overflow-y-auto">
            <!-- Vehicle ID -->
            <div>
              <label for="vehicleId" class="block text-sm font-medium text-gray-700 mb-2">
                車輛編號 <span class="text-red-500">*</span>
              </label>
              <select
                id="vehicleId"
                v-model="form.vehicleId"
                class="input-base"
                :class="{ 'border-red-500': errors.vehicleId }"
                @change="clearError('vehicleId')"
              >
                <option value="">請選擇車輛</option>
                <option
                  v-for="vehicle in availableVehicles"
                  :key="vehicle.id"
                  :value="vehicle.id"
                >
                  {{ vehicle.id }} - {{ vehicle.model || '未知型號' }}
                </option>
              </select>
              <p v-if="errors.vehicleId" class="mt-1 text-sm text-red-600">
                {{ errors.vehicleId }}
              </p>
            </div>

            <!-- Site ID -->
            <div>
              <label for="siteId" class="block text-sm font-medium text-gray-700 mb-2">
                歸還站點 <span class="text-red-500">*</span>
              </label>
              <select
                id="siteId"
                v-model="form.siteId"
                class="input-base"
                :class="{ 'border-red-500': errors.siteId }"
                @change="clearError('siteId')"
              >
                <option value="">請選擇站點</option>
                <option
                  v-for="site in sites"
                  :key="site.id"
                  :value="site.id"
                >
                  {{ site.name }}
                </option>
              </select>
              <p v-if="errors.siteId" class="mt-1 text-sm text-red-600">
                {{ errors.siteId }}
              </p>
            </div>

            <!-- Odometer -->
            <div>
              <label for="odometer" class="block text-sm font-medium text-gray-700 mb-2">
                里程表 (km) <span class="text-red-500">*</span>
              </label>
              <input
                id="odometer"
                v-model.number="form.odometer"
                type="number"
                step="0.1"
                min="0"
                class="input-base"
                :class="{ 'border-red-500': errors.odometer }"
                placeholder="請輸入當前里程數"
                @input="clearError('odometer')"
              />
              <p v-if="errors.odometer" class="mt-1 text-sm text-red-600">
                {{ errors.odometer }}
              </p>
            </div>

            <!-- Battery -->
            <div>
              <label for="battery" class="block text-sm font-medium text-gray-700 mb-2">
                電池電量 (%) <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  id="battery"
                  v-model.number="form.battery"
                  type="number"
                  min="0"
                  max="100"
                  class="input-base"
                  :class="{ 'border-red-500': errors.battery }"
                  placeholder="0-100"
                  @input="clearError('battery')"
                />
                <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                  <div
                    :class="getBatteryIconClass(form.battery)"
                    class="w-5 h-5"
                  ></div>
                </div>
              </div>
              <div class="mt-2">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    :class="getBatteryBarClass(form.battery)"
                    class="h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${Math.max(0, Math.min(100, form.battery || 0))}%` }"
                  ></div>
                </div>
              </div>
              <p v-if="errors.battery" class="mt-1 text-sm text-red-600">
                {{ errors.battery }}
              </p>
            </div>

            <!-- Issues (Optional) -->
            <div>
              <label for="issues" class="block text-sm font-medium text-gray-700 mb-2">
                問題描述 (選填)
              </label>
              <textarea
                id="issues"
                v-model="form.issues"
                rows="3"
                class="input-base resize-none"
                placeholder="如有車輛問題請詳細描述..."
                @input="clearError('issues')"
              ></textarea>
              <p v-if="errors.issues" class="mt-1 text-sm text-red-600">
                {{ errors.issues }}
              </p>
            </div>

            <!-- Photos (Optional) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                照片上傳 (選填)
              </label>
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <i class="i-ph:camera w-8 h-8 text-gray-400 mx-auto mb-2"></i>
                <p class="text-sm text-gray-600">點擊上傳或拖拽檔案至此</p>
                <p class="text-xs text-gray-500 mt-1">支援 JPG, PNG 格式，最大 5MB</p>
              </div>
            </div>
          </form>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <Button
              variant="ghost"
              @click="$emit('close')"
              :disabled="loading"
            >
              取消
            </Button>
            <Button
              variant="primary"
              @click="handleSubmit"
              :disabled="loading || !isFormValid"
            >
              <div v-if="loading" class="i-ph:spinner w-4 h-4 animate-spin mr-2"></div>
              {{ loading ? '處理中...' : '確認歸還' }}
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { Button } from '@/design/components'
import { useReturnsStore, type ReturnPayload } from '@/stores/returns'
import { useVehiclesStore } from '@/stores/vehicles'
import { useSitesStore } from '@/stores/sites'

interface Props {
  visible: boolean
  presetSiteId?: string
}

interface Emits {
  close: []
  success: [record: any]
}

const props = withDefaults(defineProps<Props>(), {
  presetSiteId: '',
})

const emit = defineEmits<Emits>()

// Stores
const returnsStore = useReturnsStore()
const vehiclesStore = useVehiclesStore()
const sitesStore = useSitesStore()

// Form state
const form = reactive<ReturnPayload>({
  vehicleId: '',
  siteId: props.presetSiteId,
  odometer: 0,
  battery: 0,
  issues: '',
  photos: [],
})

const errors = reactive<Partial<Record<keyof ReturnPayload, string>>>({})
const loading = ref(false)

// Computed
const availableVehicles = computed(() => {
  return vehiclesStore.list.filter(v => v.status === 'rented' || v.status === 'available')
})

const sites = computed(() => sitesStore.list)

const isFormValid = computed(() => {
  return form.vehicleId && form.siteId && form.odometer >= 0 && form.battery >= 0 && form.battery <= 100
})

// Methods
const clearError = (field: keyof ReturnPayload) => {
  delete errors[field]
}

const validateForm = (): boolean => {
  // Clear previous errors
  Object.keys(errors).forEach(key => {
    delete errors[key as keyof ReturnPayload]
  })

  let isValid = true

  if (!form.vehicleId) {
    errors.vehicleId = '請選擇車輛'
    isValid = false
  }

  if (!form.siteId) {
    errors.siteId = '請選擇歸還站點'
    isValid = false
  }

  if (form.odometer < 0) {
    errors.odometer = '里程數不能為負'
    isValid = false
  }

  if (form.battery < 0 || form.battery > 100) {
    errors.battery = '電池電量必須在 0-100% 之間'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    loading.value = true
    const record = await returnsStore.returnVehicle(form)
    
    // Success feedback
    emit('success', record)
    
    // Reset form
    resetForm()
    
    // Close modal
    emit('close')
  } catch (err) {
    console.error('Return vehicle error:', err)
    // Error is already handled in store
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.vehicleId = ''
  form.siteId = props.presetSiteId
  form.odometer = 0
  form.battery = 0
  form.issues = ''
  form.photos = []
  Object.keys(errors).forEach(key => {
    delete errors[key as keyof ReturnPayload]
  })
}

const handleBackdropClick = (e: Event) => {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

const getBatteryIconClass = (level: number): string => {
  if (level >= 75) return 'i-ph:battery-high text-green-500'
  if (level >= 50) return 'i-ph:battery-medium text-yellow-500'
  if (level >= 25) return 'i-ph:battery-low text-orange-500'
  return 'i-ph:battery-empty text-red-500'
}

const getBatteryBarClass = (level: number): string => {
  if (level >= 75) return 'bg-green-500'
  if (level >= 50) return 'bg-yellow-500'  
  if (level >= 25) return 'bg-orange-500'
  return 'bg-red-500'
}

// Watch for preset site changes
watch(() => props.presetSiteId, (newSiteId) => {
  form.siteId = newSiteId
})

// Initialize data on mount
onMounted(async () => {
  if (vehiclesStore.list.length === 0) {
    await vehiclesStore.fetchVehicles()
  }
  if (sitesStore.list.length === 0) {
    await sitesStore.fetchSites()
  }
})
</script>