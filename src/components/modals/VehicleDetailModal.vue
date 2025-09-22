<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <!-- This element is to trick the browser into centering the modal contents. -->
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900">
            車輛詳情 - {{ currentVehicle?.id ?? '—' }}
          </h3>
          <div class="flex items-center gap-2">
            <Button
              v-if="!isEditing"
              variant="outline"
              size="sm"
              @click="startEdit"
              :disabled="detailLoading"
            >
              <i class="i-ph-pencil-simple w-4 h-4 mr-1"></i>
              編輯
            </Button>
            <Button variant="ghost" size="sm" @click="$emit('close')">
              <i class="i-ph-x w-4 h-4"></i>
            </Button>
          </div>
        </div>

        <p v-if="detailError" class="text-sm text-rose-500 mb-3">{{ detailError }}</p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left Column - Basic Info & Battery -->
          <div class="space-y-6">
            <!-- Basic Information -->
            <div class="card p-4">
              <h4 class="font-medium text-gray-900 mb-3">基本資訊</h4>
              <div v-if="detailLoading" class="py-6 text-center text-sm text-gray-500">
                <i class="i-ph-spinner w-5 h-5 animate-spin inline-block mr-2"></i>
                載入中…
              </div>
              <div v-else>
                <div v-if="!isEditing" class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-black">車輛 ID:</span>
                    <span class="font-medium text-black">{{ currentVehicle?.id ?? '—' }}</span>
                  </div>
                  <div class="flex justify-between" v-if="hasCoord">
                    <span class="text-black">經緯度:</span>
                    <span class="font-medium font-mono text-black">{{ currentVehicle?.lat?.toFixed(6) || 'N/A' }}, {{ currentVehicle?.lon?.toFixed(6) || 'N/A' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-black">狀態:</span>
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getStatusStyle(currentVehicle?.status || 'available')"
                    >
                      {{ getStatusText(currentVehicle?.status || 'available') }}
                    </span>
                  </div>
                  <div v-if="currentVehicle?.currentMember?.name" class="flex justify-between">
                    <span class="text-black">使用者:</span>
                    <span class="font-medium text-blue-700">{{ currentVehicle.currentMember.name }}</span>
                  </div>
                  <div class="flex justify-between" v-if="currentVehicle?.siteId">
                    <span class="text-black">站點:</span>
                    <span class="font-medium text-black">{{ getSiteName(String(currentVehicle?.siteId)) }}</span>
                  </div>
                  <div class="flex justify-between" v-if="currentVehicle?.telemetryImei">
                    <span class="text-black">設備 IMEI:</span>
                    <span class="font-medium font-mono text-black">{{ currentVehicle.telemetryImei }}</span>
                  </div>
                  <div class="flex justify-between" v-if="currentVehicle?.lastSeen">
                    <span class="text-black">最後更新:</span>
                    <span class="font-medium text-black">{{ formatDateTime(currentVehicle.lastSeen) }}</span>
                  </div>
                </div>

                <div v-else class="space-y-3">
                  <div class="flex items-center gap-3">
                    <label class="w-24 text-sm text-gray-700">名稱</label>
                    <input
                      v-model="editForm.name"
                      type="text"
                      placeholder="車輛名稱"
                      class="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div class="flex items-center gap-3">
                    <label class="w-24 text-sm text-gray-700">型號</label>
                    <input
                      v-model="editForm.model"
                      type="text"
                      placeholder="車輛型號"
                      class="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div class="flex items-center gap-3">
                    <label class="w-24 text-sm text-gray-700">站點</label>
                    <select
                      v-model="editForm.siteId"
                      class="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">未指派</option>
                      <option v-for="site in siteOptions" :key="site.id" :value="String(site.id)">
                        {{ site.name }}
                      </option>
                    </select>
                  </div>
                  <div class="flex items-center gap-3">
                    <label class="w-24 text-sm text-gray-700">設備 IMEI</label>
                    <input
                      v-model="editForm.telemetryImei"
                      type="text"
                      placeholder="8672..."
                      class="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Battery Status -->
            <div class="card p-4" v-if="batteryLevelSafe !== null">
              <h4 class="font-medium text-gray-900 mb-3">電池狀態</h4>
              <div class="space-y-4">
                <!-- Battery Level Gauge -->
                <div class="text-center">
                  <div class="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gray-100 relative">
                    <svg class="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#e5e7eb"
                        stroke-width="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        :stroke="getBatteryColor(batteryLevelSafe || 0)"
                        stroke-width="8"
                        fill="none"
                        stroke-linecap="round"
                        :stroke-dasharray="`${((batteryLevelSafe || 0) / 100) * 251.2} 251.2`"
                        class="transition-all duration-500"
                      />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <div class="text-center">
                        <div class="text-2xl font-bold text-gray-900">{{ batteryLevelSafe }}%</div>
                        <div class="text-xs text-gray-700">電量</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Battery Metrics -->
                <div class="grid grid-cols-2 gap-4">
                  <div class="text-center p-3 bg-gray-50 rounded-lg" v-if="currentVehicle?.soh !== undefined && currentVehicle?.soh !== null">
                    <div class="text-lg font-semibold text-gray-900">{{ currentVehicle?.soh }}%</div>
                    <div class="text-sm text-gray-700">健康度 (SOH)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column intentionally simplified: charts/events移除（API無） -->
          <div class="space-y-6"></div>
        </div>

        <!-- Actions -->
        <div class="mt-6 flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            @click="$emit('close')"
          >
            關閉
          </Button>
          <Button
            variant="outline"
            class="border-rose-300 text-rose-600 hover:bg-rose-50 disabled:opacity-60"
            @click="handleDelete"
            :disabled="removing || detailLoading"
          >
            <i v-if="removing" class="i-ph-spinner w-4 h-4 mr-2 animate-spin"></i>
            <i v-else class="i-ph-trash w-4 h-4 mr-2"></i>
            刪除
          </Button>
          <template v-if="isEditing">
            <Button variant="outline" @click="cancelEdit" :disabled="saving">
              取消
            </Button>
            <Button variant="primary" @click="saveEdit" :disabled="saving">
              <i v-if="saving" class="i-ph-spinner w-4 h-4 mr-2 animate-spin"></i>
              <i v-else class="i-ph-check w-4 h-4 mr-2"></i>
              保存
            </Button>
          </template>
          <template v-else>
            <Button variant="outline" @click="startEdit" :disabled="detailLoading">
              <i class="i-ph-pencil-simple w-4 h-4 mr-2"></i>
              編輯
            </Button>
            <Button variant="primary" @click="performMaintenance">
              <i class="i-ph-wrench w-4 h-4 mr-2"></i>
              安排維護
            </Button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive, watch } from 'vue'
import { Button } from '@/design/components'
import { useSites } from '@/stores/sites'
import { useVehicles } from '@/stores/vehicles'
import type { Vehicle } from '@/types/vehicle'

const props = defineProps<{ vehicle: Vehicle | null }>()

const emit = defineEmits<{
  close: []
  updated: [Vehicle]
  deleted: [string]
}>()

const vehiclesStore = useVehicles()
const sitesStore = useSites()

const detail = ref<Vehicle | null>(props.vehicle ? { ...(props.vehicle as Vehicle) } : null)
const detailLoading = ref(false)
const detailError = ref('')

const isEditing = ref(false)
const saving = ref(false)
const removing = ref(false)

const editForm = reactive({
  name: '',
  model: '',
  siteId: '',
  telemetryImei: ''
})

const siteOptions = computed<any[]>(() => {
  const raw = (sitesStore as any).list
  if (Array.isArray(raw)) return raw
  if (raw && Array.isArray(raw.value)) return raw.value
  return []
})

const currentVehicle = computed<Vehicle | null>(() => detail.value ?? (props.vehicle as Vehicle | null) ?? null)

const hasCoord = computed(() => {
  const v = currentVehicle.value
  return typeof v?.lat === 'number' && typeof v?.lon === 'number'
})

const batteryLevelSafe = computed<number | null>(() => {
  const v = currentVehicle.value
  const level = v?.batteryLevel ?? v?.batteryPct
  return typeof level === 'number' ? Math.max(0, Math.min(100, Math.round(level))) : null
})

function initEditForm() {
  const v = currentVehicle.value
  editForm.name = v?.name || v?.model || ''
  editForm.model = v?.model || ''
  editForm.siteId = v?.siteId ? String(v.siteId) : ''
  editForm.telemetryImei = v?.telemetryImei || ''
}

async function loadDetail(id: string) {
  detailLoading.value = true
  detailError.value = ''
  try {
    const data = await vehiclesStore.fetchVehicleDetail(id)
    if (data) {
      detail.value = { ...(currentVehicle.value || {}), ...data }
      initEditForm()
    }
  } catch (error: any) {
    console.error('載入車輛詳情失敗:', error)
    detailError.value = error?.message || '取得車輛詳情失敗'
  } finally {
    detailLoading.value = false
  }
}

function startEdit() {
  initEditForm()
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  initEditForm()
}

async function saveEdit() {
  const vehicle = currentVehicle.value
  if (!vehicle?.id) return

  const patch: Record<string, any> = {}
  const trimmedName = editForm.name.trim()
  const trimmedModel = editForm.model.trim()
  const trimmedTelemetry = editForm.telemetryImei.trim()
  const normalizedSite = editForm.siteId.trim()

  if (trimmedName && trimmedName !== (vehicle.name || vehicle.model || '')) {
    patch.bike_name = trimmedName
  }
  if (trimmedModel && trimmedModel !== (vehicle.model || '')) {
    patch.bike_model = trimmedModel
  }
  const currentSite = vehicle.siteId ? String(vehicle.siteId) : ''
  if (normalizedSite !== currentSite) {
    patch.site_id = normalizedSite || null
  }
  if (trimmedTelemetry !== (vehicle.telemetryImei || '')) {
    patch.telemetry_device_imei = trimmedTelemetry || null
  }

  if (Object.keys(patch).length === 0) {
    isEditing.value = false
    return
  }

  saving.value = true
  try {
    const updated = await vehiclesStore.updateVehicleInfo(vehicle.id, patch)
    if (updated) {
      detail.value = { ...vehicle, ...updated }
      initEditForm()
      emit('updated', detail.value)
      isEditing.value = false
    }
  } catch (error: any) {
    console.error('更新車輛資訊失敗:', error)
    detailError.value = error?.message || '更新車輛資訊失敗'
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  const vehicle = currentVehicle.value
  if (!vehicle?.id) return
  if (!window.confirm(`確定要刪除車輛 ${vehicle.id} 嗎？`)) return
  removing.value = true
  try {
    await vehiclesStore.removeVehicle(vehicle.id)
    emit('deleted', vehicle.id)
    emit('close')
  } catch (error: any) {
    console.error('刪除車輛失敗:', error)
    detailError.value = error?.message || '刪除車輛失敗'
  } finally {
    removing.value = false
  }
}

const getSiteName = (siteId?: string) => {
  if (!siteId) return '未知站點'
  const site = siteOptions.value.find((s: any) => String(s.id) === String(siteId))
  return site?.name || '未知站點'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'available': '可用',
    'in-use': '使用中', 
    'maintenance': '維護中',
    'low-battery': '低電量',
    '可租借': '可租借',
    '使用中': '使用中',
    '維修': '維修',
    '離線': '離線',
    '低電量': '低電量'
  }
  return statusMap[status] || status
}

const getStatusStyle = (status: string) => {
  const styleMap: Record<string, string> = {
    'available': 'bg-green-100 text-green-800',
    'in-use': 'bg-blue-100 text-blue-800',
    'maintenance': 'bg-yellow-100 text-yellow-800',
    'low-battery': 'bg-red-100 text-red-800',
    '可租借': 'bg-green-100 text-green-800',
    '使用中': 'bg-blue-100 text-blue-800',
    '維修': 'bg-yellow-100 text-yellow-800',
    '離線': 'bg-gray-100 text-gray-800',
    '低電量': 'bg-red-100 text-red-800'
  }
  return styleMap[status] || 'bg-gray-100 text-gray-800'
}

const getBatteryColor = (level: number) => {
  if (level > 60) return '#10b981'
  if (level > 30) return '#f59e0b'
  return '#ef4444'
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('zh-TW')
const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('zh-TW')

const performMaintenance = () => {
  const vehicle = currentVehicle.value
  console.log('安排維護:', vehicle?.id)
  alert('維護排程功能尚未實作')
}

watch(() => props.vehicle, (value) => {
  detail.value = value ? { ...(value as Vehicle) } : null
  initEditForm()
  if (value?.id) loadDetail(value.id)
})

watch(() => currentVehicle.value?.id, () => {
  initEditForm()
})

onMounted(async () => {
  if (!siteOptions.value.length) {
    try { await sitesStore.fetchSites() } catch { /* ignore */ }
  }
  const initialId = props.vehicle?.id
  if (initialId) {
    await loadDetail(initialId)
  } else {
    initEditForm()
  }
})
</script>
