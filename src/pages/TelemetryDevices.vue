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
                    data-testid="telemetry-delete-btn"
                    @click="confirmDelete(d)"
                    :disabled="isDeleting(d.IMEI)"
                    :aria-busy="isDeleting(d.IMEI)"
                    class="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-red-500"
                    :class="isDeleting(d.IMEI) ? 'opacity-60 cursor-not-allowed bg-red-50' : 'hover:bg-red-50'"
                  >
                    <i v-if="!isDeleting(d.IMEI)" class="i-ph-trash w-3.5 h-3.5 mr-1"></i>
                    <i v-else class="i-ph-spinner w-3.5 h-3.5 mr-1 animate-spin"></i>
                    <span>{{ isDeleting(d.IMEI) ? translate('telemetry.delete.working') : translate('telemetry.delete.action') }}</span>
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
import { useToasts } from '@/stores/toasts'

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
const toasts = useToasts()
const route = useRoute()
const router = useRouter()

type LocaleKey = 'zh-TW' | 'en'
type MessageKey =
  | 'telemetry.delete.confirm'
  | 'telemetry.delete.success'
  | 'telemetry.delete.error.title'
  | 'telemetry.delete.error.association'
  | 'telemetry.delete.error.generic'
  | 'telemetry.delete.action'
  | 'telemetry.delete.working'
  | 'telemetry.create.success'
  | 'telemetry.create.error.title'
  | 'telemetry.create.error.generic'

const LOCALE_MESSAGES: Record<LocaleKey, Record<MessageKey, string>> = {
  'zh-TW': {
    'telemetry.delete.confirm': '確定要刪除設備 {imei} 嗎？',
    'telemetry.delete.success': '已刪除設備：{label}',
    'telemetry.delete.error.title': '刪除失敗',
    'telemetry.delete.error.association': '無法刪除，該設備仍綁定腳踏車（例如：{bike}）。請先解除綁定後再刪除。',
    'telemetry.delete.error.generic': '刪除失敗，請稍後再試。',
    'telemetry.delete.action': '刪除',
    'telemetry.delete.working': '刪除中…',
    'telemetry.create.success': '已新增設備：{label}',
    'telemetry.create.error.title': '新增失敗',
    'telemetry.create.error.generic': '新增失敗，請稍後再試。'
  },
  en: {
    'telemetry.delete.confirm': 'Are you sure you want to delete device {imei}?',
    'telemetry.delete.success': 'Device deleted: {label}',
    'telemetry.delete.error.title': 'Delete failed',
    'telemetry.delete.error.association': 'Cannot delete because the device is still bound to a bike (e.g. {bike}). Please unbind it before deleting.',
    'telemetry.delete.error.generic': 'Delete failed. Please try again later.',
    'telemetry.delete.action': 'Delete',
    'telemetry.delete.working': 'Deleting…',
    'telemetry.create.success': 'Device created: {label}',
    'telemetry.create.error.title': 'Create failed',
    'telemetry.create.error.generic': 'Create failed. Please try again later.'
  }
}

function resolveLocale(): LocaleKey {
  if (typeof navigator === 'undefined') return 'en'
  const lang = navigator.language || navigator.languages?.[0] || 'en'
  return lang.toLowerCase().includes('zh') ? 'zh-TW' : 'en'
}

const currentLocale: LocaleKey = resolveLocale()

function translate(key: MessageKey, params?: Record<string, string | number>): string {
  const table = LOCALE_MESSAGES[currentLocale] ?? LOCALE_MESSAGES.en
  const fallback = LOCALE_MESSAGES.en
  const template = table[key] ?? fallback[key] ?? key
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, token) => String(params[token] ?? `{${token}}`))
}

const filters = ref<{ status: string; model: string; imei: string }>({ status: '', model: '', imei: '' })
const deletingMap = ref<Record<string, boolean>>({})

// Sorting configuration
const sortConfig = ref({
  field: '' as string,
  order: 'asc' as 'asc' | 'desc'
})

const statusOptions = computed(() => {
  const options = telemetry.statusOptions
  return options && options.length > 0 ? options : DEFAULT_TELEMETRY_STATUS_OPTIONS
})

function setDeleting(imei: string, value: boolean) {
  if (value) {
    deletingMap.value = { ...deletingMap.value, [imei]: true }
  } else {
    const { [imei]: _removed, ...rest } = deletingMap.value
    deletingMap.value = rest
  }
}

function isDeleting(imei: string) {
  return Boolean(deletingMap.value[imei])
}

function deviceLabel(device: any): string {
  const name = typeof device?.name === 'string' ? device.name.trim() : ''
  if (name) return name
  return String(device?.IMEI ?? '')
}

function parseKoalaError(error: unknown): any {
  if (!error) return null
  const raw = typeof error === 'string'
    ? error
    : typeof (error as any)?.message === 'string'
      ? (error as any).message
      : ''
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function extractErrorDetail(payload: any): string | null {
  if (!payload || !payload.details) return null

  const details = payload.details
  if (typeof details === 'string') return details
  if (Array.isArray(details)) return details.filter(Boolean).join('\n')

  if (typeof details === 'object') {
    const parts: string[] = []
    for (const value of Object.values(details)) {
      if (!value) continue
      if (typeof value === 'string') parts.push(value)
      else if (Array.isArray(value)) parts.push(value.filter(Boolean).join('\n'))
    }
    return parts.length ? parts.join('\n') : null
  }

  return null
}

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
  try {
    if (isEdit) {
      await telemetry.updateDevice(device.IMEI, { name: device.name, model: device.model, status: device.status })
    } else {
      await telemetry.createDevice(device)
      toasts.success(translate('telemetry.create.success', {
        label: deviceLabel(device),
        imei: device.IMEI
      }))
    }

    showModal.value = false
    await paging.refresh()
  } catch (error) {
    if (!isEdit) {
      const payload = parseKoalaError(error)
      const detail = extractErrorDetail(payload) || payload?.msg || payload?.message
      const message = detail
        ? `${translate('telemetry.create.error.generic')}\n${detail}`
        : translate('telemetry.create.error.generic')
      toasts.error(message, translate('telemetry.create.error.title'))
    }

    console.error('[TelemetryDevices] Failed to submit device:', error)
  }
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
  if (isDeleting(d.IMEI)) return

  const confirmed = confirm(translate('telemetry.delete.confirm', { imei: d.IMEI }))
  if (!confirmed) return

  setDeleting(d.IMEI, true)
  try {
    await telemetry.deleteDevice(d.IMEI)
    toasts.success(translate('telemetry.delete.success', {
      label: deviceLabel(d),
      imei: d.IMEI
    }))
    await paging.refresh()
  } catch (error: any) {
    const payload = parseKoalaError(error)
    const associationMessage = typeof payload?.details?.bike_association === 'string'
      ? payload.details.bike_association
      : undefined

    if (payload?.code === 4000 && associationMessage) {
      const match = /bike\s+([A-Za-z0-9_-]+)/i.exec(associationMessage)
      const bikeId = match?.[1] || '-'
      const message = translate('telemetry.delete.error.association', { bike: bikeId })
      toasts.error(`${message}\n${associationMessage}`, translate('telemetry.delete.error.title'))
    } else {
      toasts.error(translate('telemetry.delete.error.generic'), translate('telemetry.delete.error.title'))
    }

    console.error('[TelemetryDevices] Delete device failed:', error)
  } finally {
    setDeleting(d.IMEI, false)
  }
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
