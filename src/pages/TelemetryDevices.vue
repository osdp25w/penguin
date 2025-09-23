<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">遙測設備管理</h1>
        <p class="mt-1 text-sm text-gray-700">管理遙測設備（IMEI / 型號 / 狀態），支援分頁與搜尋</p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="refreshData">
          <i class="i-ph-arrow-clockwise w-4 h-4 mr-2"></i>
          重新整理
        </Button>
        <Button variant="primary" size="sm" @click="openCreateModal">
          <i class="i-ph-plus w-4 h-4 mr-2"></i>
          新增設備
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label for="td-status" class="block text-sm font-medium text-gray-700 mb-1">狀態</label>
          <select id="td-status" name="status" v-model="filters.status" class="input-base w-full" aria-label="狀態">
            <option value="">全部</option>
            <option v-for="s in statusOptions" :key="s" :value="s">{{ statusLabel(s) }}</option>
          </select>
        </div>
        <div class="max-w-[14rem]">
          <label for="td-model" class="block text-sm font-medium text-gray-700 mb-1">型號</label>
          <input id="td-model" name="model" v-model.trim="filters.model" class="input-base w-full" placeholder="例如 TD-2024-IoT" />
        </div>
        <div class="max-w-[14rem]">
          <label for="td-imei" class="block text-sm font-medium text-gray-700 mb-1">IMEI</label>
          <input id="td-imei" name="imei" v-model.trim="filters.imei" class="input-base w-full" placeholder="輸入 IMEI" />
        </div>
        <div class="flex items-end">
          <Button class="w-full md:w-auto" @click="applyFilters">套用</Button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr class="text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              <th class="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('imei')">
                <div class="flex items-center gap-1">
                  IMEI
                  <i v-if="sortConfig.field === 'imei'"
                     :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                     class="w-3 h-3"></i>
                  <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
                </div>
              </th>
              <th class="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('name')">
                <div class="flex items-center gap-1">
                  名稱
                  <i v-if="sortConfig.field === 'name'"
                     :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                     class="w-3 h-3"></i>
                  <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
                </div>
              </th>
              <th class="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('model')">
                <div class="flex items-center gap-1">
                  型號
                  <i v-if="sortConfig.field === 'model'"
                     :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                     class="w-3 h-3"></i>
                  <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
                </div>
              </th>
              <th class="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('status')">
                <div class="flex items-center gap-1">
                  狀態
                  <i v-if="sortConfig.field === 'status'"
                     :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                     class="w-3 h-3"></i>
                  <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
                </div>
              </th>
              <th class="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="d in rows" :key="d.IMEI">
              <td class="px-4 py-3 text-sm font-mono text-gray-900">{{ d.IMEI }}</td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ d.name || '-' }}</td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ d.model || '-' }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                  :class="statusClass(d.status)">
                  {{ statusLabel(d.status) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2 justify-end">
                  <button
                    @click="openEditModal(d)"
                    class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500 transition-colors"
                  >
                    <i class="i-ph-pencil-simple w-3.5 h-3.5 mr-1"></i>
                    編輯
                  </button>
                  <button
                    @click="confirmDelete(d)"
                    class="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-red-500 transition-colors"
                  >
                    <i class="i-ph-trash w-3.5 h-3.5 mr-1"></i>
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!rows.length && !paging.loading.value" class="text-center py-8 text-gray-600">目前沒有資料</div>
        <div v-if="paging.loading.value" class="text-center py-8 text-gray-600">
          <i class="i-ph-spinner animate-spin inline-block mr-2" /> 載入中...
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <PaginationBar
      v-if="paging.total.value > 0"
      :current-page="paging.currentPage.value"
      :total-pages="paging.totalPages.value"
      :total="paging.total.value"
      :limit="paging.limit.value"
      :offset="paging.offset.value"
      :page-range="paging.pageRange.value"
      :has-next-page="paging.hasNextPage.value"
      :has-prev-page="paging.hasPrevPage.value"
      @page-change="paging.goToPage"
      @limit-change="paging.changeLimit"
      @prev="paging.prevPage"
      @next="paging.nextPage"
    />

    <!-- Modal -->
    <TelemetryDeviceModal
      v-if="showModal"
      :device="editingDevice"
      :status-options="statusOptions"
      @close="closeModal"
      @submit="submitModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onErrorCaptured } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/design/components'
import PaginationBar from '@/components/PaginationBar.vue'
import TelemetryDeviceModal from '@/components/modals/TelemetryDeviceModal.vue'
import { usePaging } from '@/composables/usePaging'
import { DEFAULT_TELEMETRY_STATUS_OPTIONS, useTelemetry } from '@/stores/telemetry'

// 全局錯誤捕獲
onErrorCaptured((err, instance, info) => {
  console.error('[TelemetryDevices] Component error captured:', {
    error: err,
    instance,
    info,
    stack: err.stack
  })
  return false // 不阻止錯誤傳播
})

const telemetry = useTelemetry()
const route = useRoute()
const router = useRouter()

const filters = ref<{ status: string; model: string; imei: string }>({ status: '', model: '', imei: '' })

// Sorting configuration
const sortConfig = ref({
  field: '' as string,
  order: 'asc' as 'asc' | 'desc'
})

const statusOptions = computed(() => {
  const options = telemetry.statusOptions
  return options && options.length > 0 ? options : DEFAULT_TELEMETRY_STATUS_OPTIONS
})

const paging = usePaging({
  fetcher: async ({ limit, offset }) => {
    return await telemetry.fetchDevicesPaged({
      limit,
      offset,
      status: (filters.value.status || undefined) as any,
      model: filters.value.model || undefined,
      IMEI_q: filters.value.imei || undefined
    })
  },
  syncToUrl: true,
  queryPrefix: 'telemetry'
})

const rows = computed(() => {
  let list = [...paging.data.value]

  // Apply sorting
  if (sortConfig.value.field) {
    list.sort((a, b) => {
      let aVal: any = ''
      let bVal: any = ''

      switch (sortConfig.value.field) {
        case 'imei':
          aVal = a.IMEI
          bVal = b.IMEI
          break
        case 'name':
          aVal = a.name || ''
          bVal = b.name || ''
          break
        case 'model':
          aVal = a.model || ''
          bVal = b.model || ''
          break
        case 'status':
          aVal = statusLabel(a.status)
          bVal = statusLabel(b.status)
          break
      }

      const compareResult = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortConfig.value.order === 'asc' ? compareResult : -compareResult
    })
  }

  return list
})

// Sorting function
function handleSort(field: string) {
  if (sortConfig.value.field === field) {
    sortConfig.value.order = sortConfig.value.order === 'asc' ? 'desc' : 'asc'
  } else {
    sortConfig.value.field = field
    sortConfig.value.order = 'asc'
  }
}

function normStatus(status?: string) {
  const s = String(status || '').toLowerCase().trim()
  if (s === 'available' || s === 'idle' || s === 'free') return 'available'
  if (s === 'maintenance' || s === 'maintain') return 'maintenance'
  if (s === 'disabled' || s === 'inactive') return 'disabled'
  if (s === 'in-use' || s === 'in_use' || s === 'used' || s === 'assigned' || s === 'bound') return 'in-use'
  if (s === 'deployed' || s === 'deploy') return 'deployed'
  return 'available'
}

function statusLabel(status?: string) {
  const s = normStatus(status)
  const labelMap: Record<string, string> = {
    'available': '可用',
    'in-use': '使用中',
    'maintenance': '維護中',
    'disabled': '停用',
    'deployed': '已部署'
  }
  return labelMap[s] || status || '-'
}

function statusClass(status?: string) {
  const s = normStatus(status)
  const map: Record<string, string> = {
    'available': 'bg-green-100 text-green-800 border-green-200',
    'in-use': 'bg-blue-100 text-blue-800 border-blue-200',
    'maintenance': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'disabled': 'bg-gray-100 text-gray-800 border-gray-200',
    'deployed': 'bg-purple-100 text-purple-800 border-purple-200'
  }
  return map[s] || 'bg-gray-100 text-gray-800 border-gray-200'
}

async function refreshData() {
  await paging.refresh()
}

function applyFilters() {
  paging.resetToFirstPage()
  paging.refresh()
  // sync to URL
  const q = { ...route.query }
  q['telemetry_status'] = filters.value.status || undefined
  q['telemetry_model'] = filters.value.model || undefined
  q['telemetry_imei'] = filters.value.imei || undefined
  router.replace({ query: q })
}

// modal state
const showModal = ref(false)
const editingDevice = ref<any | null>(null)

function openCreateModal() {
  editingDevice.value = null
  showModal.value = true
}

function openEditModal(d: any) {
  editingDevice.value = d
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function submitModal(device: any, isEdit: boolean) {
  if (isEdit) await telemetry.updateDevice(device.IMEI, { name: device.name, model: device.model, status: device.status })
  else await telemetry.createDevice(device)
  showModal.value = false
  await paging.refresh()
}

// watch filters from url (但不在初始化時觸發)
let isInitializing = true
watch(
  () => [filters.value.status, filters.value.model, filters.value.imei],
  () => {
    if (!isInitializing) {
      applyFilters()
    }
  },
  { deep: true }
)

async function confirmDelete(d: any) {
  if (!confirm(`確定刪除設備 ${d.IMEI} 嗎？`)) return
  await telemetry.deleteDevice(d.IMEI)
  await paging.refresh()
}

onMounted(async () => {
  console.log('[TelemetryDevices] Component mounted, starting initialization...')

  try {
    // restore from url
    const q = route.query
    filters.value.status = String(q['telemetry_status'] || '')
    filters.value.model = String(q['telemetry_model'] || '')
    filters.value.imei = String(q['telemetry_imei'] || '')

    console.log('[TelemetryDevices] URL filters restored:', filters.value)

    // 同時載入狀態選項和分頁資料
    console.log('[TelemetryDevices] Loading status options and initial data...')
    await Promise.all([
      telemetry.fetchDeviceStatusOptions(),
      paging.refresh({
        status: (filters.value.status || undefined) as any,
        model: filters.value.model || undefined,
        IMEI_q: filters.value.imei || undefined
      })
    ])

    console.log('[TelemetryDevices] Initialization complete:', {
      statusOptions: telemetry.statusOptions,
      dataLength: paging.data.value.length,
      total: paging.total.value,
      loading: paging.loading.value
    })

    // 初始化完成，允許 watch 觸發
    isInitializing = false
  } catch (error) {
    console.error('[TelemetryDevices] Error during initialization:', error)
    isInitializing = false
  }
})
</script>

<style scoped>
.input-base { @apply px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400; }
.card { @apply bg-white rounded-lg border border-gray-200 shadow-sm; }
</style>
