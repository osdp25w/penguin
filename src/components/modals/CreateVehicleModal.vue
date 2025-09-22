<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen p-4 text-center">
      <div class="fixed inset-0 bg-black/40" @click="$emit('close')"></div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-xl">
        <div class="px-6 pt-5 pb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">新增車輛</h3>
            <Button variant="ghost" size="sm" @click="$emit('close')">
              <i class="i-ph-x w-4 h-4" />
            </Button>
          </div>

          <form class="space-y-4" @submit.prevent="handleSubmit">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">車輛 ID <span class="text-red-500">*</span></label>
              <input v-model.trim="form.id" type="text" class="input-base w-full" placeholder="例如 KU-A_1234-01 或 IMEI" />
              <p v-if="errors.id" class="text-xs text-red-600 mt-1">{{ errors.id }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">名稱（選填）</label>
              <input v-model.trim="form.name" type="text" class="input-base w-full" placeholder="顯示名稱或 BI" />
            </div>

            <!-- 基礎屬性 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                <select v-model="form.status" class="input-base w-full">
                  <option value="available">可用</option>
                  <option value="in-use">使用中</option>
                  <option value="maintenance">維護中</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">站點</label>
                <select v-model="form.siteId" class="input-base w-full">
                  <option value="">未指定</option>
                  <option v-for="s in siteOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
              </div>
            </div>

            <!-- 類型 / 系列 / 型號 -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">類型</label>
                <select v-model="form.categoryId" class="input-base w-full">
                  <option value="">未指定</option>
                  <option v-for="c in categoryOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">系列</label>
                <select v-model="form.seriesId" class="input-base w-full">
                  <option value="">未指定</option>
                  <option v-for="s in seriesOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">型號</label>
                <input v-model.trim="form.model" type="text" class="input-base w-full" placeholder="例如 CB-2024-001" />
              </div>
            </div>

            <!-- 遙測設備（IMEI） -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">遙測設備 IMEI（選填，僅顯示閒置）</label>
                <div class="flex gap-2">
                  <input
                    v-model="imeiQuery"
                    type="text"
                    class="input-base w-40"
                    placeholder="搜尋 IMEI"
                    @input="refreshAvailableDevices"
                  />
                  <select v-model="form.telemetryImei" class="input-base flex-1">
                    <option value="">不關聯</option>
                    <option v-for="d in filteredAvailableDevices" :key="d.IMEI" :value="d.IMEI">
                      {{ d.IMEI }} - {{ d.name || d.model || 'device' }}
                    </option>
                  </select>
                </div>
              </div>
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
import { computed, reactive, ref, onMounted } from 'vue'
import { Button } from '@/design/components'
import type { Vehicle } from '@/types'
import { useBikeMeta } from '@/stores/bikeMeta'
import { useTelemetry } from '@/stores/telemetry'

const props = defineProps<{ 
  sites?: { id: string; name: string }[]
}>()

const emits = defineEmits<{ 
  close: []
  created: [vehicle: Vehicle]
}>()

const submitting = ref(false)
const meta = useBikeMeta()
const telemetry = useTelemetry()
const imeiQuery = ref('')

const form = reactive<{
  id: string
  name: string
  status: Vehicle['status']
  siteId: string
  categoryId?: string | number | ''
  seriesId?: string | number | ''
  model?: string
  telemetryImei?: string | ''
}>({
  id: '',
  name: '',
  status: 'available',
  siteId: '',
  categoryId: '',
  seriesId: '',
  model: '',
  telemetryImei: ''
})

const errors = reactive<{ id?: string }>({})

const siteOptions = computed(() => props.sites || [])
const categoryOptions = computed(() => meta.categories)
const seriesOptions = computed(() => meta.series)
const filteredAvailableDevices = computed(() => {
  if (!imeiQuery.value) return telemetry.available
  const q = imeiQuery.value.toLowerCase()
  return telemetry.available.filter(d => d.IMEI.toLowerCase().includes(q))
})

async function refreshAvailableDevices() {
  await telemetry.fetchAvailable()
}

onMounted(async () => {
  // fetch options
  await Promise.all([
    meta.fetchCategories(),
    meta.fetchSeries(),
    telemetry.fetchAvailable()
  ])
})

function validate() {
  errors.id = undefined
  let ok = true
  if (!form.id) {
    errors.id = '請輸入車輛 ID'
    ok = false
  }
  return ok
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    const vehicle: Vehicle & { seriesId?: number | string; telemetryImei?: string | null } = {
      id: form.id,
      name: form.name || undefined,
      batteryLevel: undefined,
      batteryPct: undefined,
      status: form.status,
      siteId: form.siteId || undefined,
      lat: undefined,
      lon: undefined,
      mqttStatus: 'online',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      seriesId: form.seriesId || undefined,
      telemetryImei: form.telemetryImei || undefined
    }
    emits('created', vehicle)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.input-base {
  @apply px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400;
}
.card { @apply bg-white rounded-lg border border-gray-200 shadow-sm; }
</style>
