<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen p-4 text-center">
      <div class="fixed inset-0 bg-black/40" @click="$emit('close')"></div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-xl">
        <div class="px-6 pt-5 pb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">{{ isEdit ? '編輯設備' : '新增設備' }}</h3>
            <Button variant="ghost" size="sm" @click="$emit('close')" aria-label="關閉">
              <i class="i-ph-x w-4 h-4" />
            </Button>
          </div>

          <form class="space-y-4" @submit.prevent="handleSubmit">
            <div class="max-w-[18rem]">
              <label class="block text-sm font-medium text-gray-700 mb-1">IMEI <span class="text-red-500">*</span></label>
              <input
                v-model.trim="form.IMEI"
                type="text"
                class="input-base w-full"
                :disabled="isEdit"
                placeholder="867295075673999"
              />
              <p v-if="errors.IMEI" class="text-xs text-red-600 mt-1">{{ errors.IMEI }}</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="max-w-[16rem]">
                <label class="block text-sm font-medium text-gray-700 mb-1">名稱</label>
                <input v-model.trim="form.name" type="text" class="input-base w-full" placeholder="裝置名稱" />
              </div>
              <div class="max-w-[16rem]">
                <label class="block text-sm font-medium text-gray-700 mb-1">型號</label>
                <input v-model.trim="form.model" type="text" class="input-base w-full" placeholder="例如 TD-2024-IoT" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">狀態</label>
              <select v-model="form.status" class="input-base w-full">
                <option v-for="opt in statusOptions" :key="opt" :value="opt">{{ statusLabel(opt) }}</option>
              </select>
            </div>
          </form>
        </div>

        <div class="px-6 py-4 bg-gray-50 flex items-center justify-end gap-2 border-t border-gray-200">
          <Button variant="outline" @click="$emit('close')">取消</Button>
          <Button variant="primary" :disabled="submitting" @click="handleSubmit">
            <i v-if="submitting" class="i-ph-spinner animate-spin mr-2" />
            儲存
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Button } from '@/design/components'
import type { TelemetryDevice } from '@/stores/telemetry'
import { DEFAULT_TELEMETRY_STATUS_OPTIONS } from '@/stores/telemetry'

const props = defineProps<{
  device?: TelemetryDevice | null
  statusOptions?: string[]
}>()

const emit = defineEmits<{
  close: []
  submit: [device: TelemetryDevice, isEdit: boolean]
}>()

const submitting = ref(false)
const isEdit = computed(() => !!props.device)
const statusOptions = computed(() => {
  const options = props.statusOptions
  return options && options.length > 0 ? options : DEFAULT_TELEMETRY_STATUS_OPTIONS
})

function statusLabel(status?: string) {
  const labelMap: Record<string, string> = {
    'available': '可用',
    'in-use': '使用中',
    'maintenance': '維護中',
    'disabled': '停用',
    'deployed': '已部署'
  }
  return labelMap[status || ''] || status || '-'
}

const form = reactive<TelemetryDevice>({
  IMEI: props.device?.IMEI || '',
  name : props.device?.name || '',
  model: props.device?.model || '',
  status: props.device?.status || 'available'
})

const errors = reactive<{ IMEI?: string }>({})

function validate(): boolean {
  errors.IMEI = undefined
  let ok = true
  if (!form.IMEI) { errors.IMEI = '請輸入 IMEI'; ok = false }
  return ok
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    emit('submit', { ...form }, isEdit.value)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  // no-op
})
</script>

<style scoped>
.input-base { @apply px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400; }
</style>
