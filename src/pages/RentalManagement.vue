<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4">
      <!-- 標題區 -->
      <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">租借管理</h1>
          <p class="mt-1 text-sm text-gray-600">掌握全站租借狀態，協助會員處理租借與歸還。</p>
        </div>
        <Button variant="outline" size="sm" @click="refresh" :disabled="loading">
          <i class="i-ph-arrow-clockwise w-4 h-4 mr-2"></i>
          重新整理
        </Button>
      </div>

      <!-- 搜尋和篩選區 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- 搜尋欄 -->
          <div class="relative flex-1 max-w-md">
            <i class="i-ph-magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"></i>
            <input
              type="text"
              v-model="filters.search"
              placeholder="搜尋租借編號、車輛 ID、會員名稱..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              @keyup.enter="refresh"
            />
          </div>

          <!-- 狀態篩選 -->
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700 whitespace-nowrap">狀態：</label>
            <select
              v-model="filters.status"
              class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              @change="refresh"
            >
              <option value="">所有狀態</option>
              <option value="active">🔵 進行中</option>
              <option value="completed">✅ 已完成</option>
              <option value="cancelled">❌ 已取消</option>
            </select>
          </div>

          <!-- 清除篩選按鈕 -->
          <button
            v-if="filters.search || filters.status"
            @click="clearFilters"
            class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-gray-500 transition-colors"
          >
            <i class="i-ph-x-circle w-4 h-4 mr-1.5"></i>
            清除篩選
          </button>
        </div>

        <!-- 搜尋提示 -->
        <div v-if="filters.search || filters.status" class="mt-3 flex items-center text-sm text-gray-600">
          <i class="i-ph-info-circle w-4 h-4 mr-1"></i>
          <span>
            正在顯示
            <span v-if="filters.search" class="font-medium">包含 "{{ filters.search }}"</span>
            <span v-if="filters.search && filters.status"> 且 </span>
            <span v-if="filters.status" class="font-medium">狀態為「{{ statusText(filters.status) }}」</span>
            的租借紀錄
          </span>
        </div>
      </div>
    </div>

    <div v-if="!canAccess" class="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-700">
      <p>此頁面僅限管理員或工作人員使用。若您是會員，請改至「我的租借」查看個人紀錄。</p>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-10 text-gray-500">
      <i class="i-ph-spinner w-10 h-10 animate-spin mb-3"></i>
      載入租借資料中…
    </div>

    <div v-else-if="error" class="flex flex-col items-center justify-center py-10 text-rose-500 gap-3">
      <i class="i-ph-warning-circle w-10 h-10"></i>
      <p>{{ error }}</p>
      <Button variant="outline" size="sm" @click="refresh">重試</Button>
    </div>

    <div v-else-if="rentals.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-500 gap-2">
      <i class="i-ph-clipboard-text w-12 h-12"></i>
      <p>沒有符合條件的租借紀錄</p>
    </div>

    <div v-else class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr class="text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
            <th class="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="toggleSort('id')">
              <div class="flex items-center gap-1">
                租借編號
                <i v-if="sortConfig.field === 'id'" :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'" class="w-3 h-3"></i>
                <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
              </div>
            </th>
            <th class="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="toggleSort('bike_id')">
              <div class="flex items-center gap-1">
                車輛
                <i v-if="sortConfig.field === 'bike_id'" :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'" class="w-3 h-3"></i>
                <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
              </div>
            </th>
            <th class="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="toggleSort('member_name')">
              <div class="flex items-center gap-1">
                會員
                <i v-if="sortConfig.field === 'member_name'" :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'" class="w-3 h-3"></i>
                <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
              </div>
            </th>
            <th class="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="toggleSort('start_time')">
              <div class="flex items-center gap-1">
                開始
                <i v-if="sortConfig.field === 'start_time'" :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'" class="w-3 h-3"></i>
                <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
              </div>
            </th>
            <th class="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="toggleSort('end_time')">
              <div class="flex items-center gap-1">
                結束
                <i v-if="sortConfig.field === 'end_time'" :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'" class="w-3 h-3"></i>
                <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
              </div>
            </th>
            <th class="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="toggleSort('status')">
              <div class="flex items-center gap-1">
                狀態
                <i v-if="sortConfig.field === 'status'" :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'" class="w-3 h-3"></i>
                <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
              </div>
            </th>
            <th class="px-4 py-3">處理</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 text-sm text-gray-700">
          <tr
            v-for="rental in sortedRentals"
            :key="rental.id"
            class="hover:bg-indigo-50"
          >
            <td class="px-4 py-3 font-mono text-gray-900">{{ rental.id }}</td>
            <td class="px-4 py-3">
              <div class="font-medium text-gray-900">{{ rental.bike?.bike_name || rental.bike?.bike_id || '未知車輛' }}</div>
              <div class="text-xs text-gray-500">{{ rental.bike?.bike_id }}</div>
            </td>
            <td class="px-4 py-3">
              <div class="font-medium text-gray-900">{{ rental.member?.full_name || rental.member?.email || '未知會員' }}</div>
              <div class="text-xs text-gray-500">{{ rental.member?.phone || '—' }}</div>
            </td>
            <td class="px-4 py-3">{{ formatDateTime(rental.start_time || rental.startTime) }}</td>
            <td class="px-4 py-3">{{ formatDateTime(rental.end_time || rental.endTime, '尚未結束') }}</td>
            <td class="px-4 py-3">
              <span :class="statusClass(rental.rental_status || rental.status)">
                {{ statusText(rental.rental_status || rental.status) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <Button size="xs" variant="outline" @click="openDetail(rental)">
                查看
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="selectedRental" class="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">租借詳情 #{{ selectedRental.id }}</h2>
        <Button variant="ghost" size="sm" @click="selectedRental = null">
          <i class="i-ph-x w-4 h-4"></i>
        </Button>
      </div>
      <div v-if="detailLoading" class="text-sm text-gray-500 flex items-center gap-2">
        <i class="i-ph-spinner w-4 h-4 animate-spin"></i>
        載入詳情中…
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div>
          <p class="text-gray-500">車輛</p>
          <p class="font-medium text-gray-900">{{ selectedRental.bike?.bike_name || selectedRental.bike?.bike_id }}</p>
        </div>
        <div>
          <p class="text-gray-500">會員</p>
          <p class="font-medium text-gray-900">{{ selectedRental.member?.full_name || selectedRental.member?.email }}</p>
          <p class="text-xs text-gray-500">電話：{{ selectedRental.member?.phone || '—' }}</p>
        </div>
        <div>
          <p class="text-gray-500">開始時間</p>
          <p class="font-medium text-gray-900">{{ formatDateTime(selectedRental.start_time || selectedRental.startTime) }}</p>
        </div>
        <div>
          <p class="text-gray-500">結束時間</p>
          <p class="font-medium text-gray-900">{{ formatDateTime(selectedRental.end_time || selectedRental.endTime, '尚未結束') }}</p>
        </div>
        <div>
          <p class="text-gray-500">租借狀態</p>
          <p class="font-medium">
            <span :class="statusClass(selectedRental.rental_status || selectedRental.status)">
              {{ statusText(selectedRental.rental_status || selectedRental.status) }}
            </span>
          </p>
        </div>
        <div>
          <p class="text-gray-500">租借時長</p>
          <p class="font-medium text-gray-900">{{ durationText(selectedRental.duration_seconds || selectedRental.durationSeconds) }}</p>
        </div>
        <div>
          <p class="text-gray-500">里程</p>
          <p class="font-medium text-gray-900">{{ formatDistance(selectedRental.distance_km || selectedRental.distanceKm) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Button } from '@/design/components'
import { useAuth } from '@/stores/auth'
import { useRentals } from '@/stores/rentals'

const rentalsStore = useRentals()
const auth = useAuth()

const rentals = ref<any[]>([])
const loading = ref(false)
const detailLoading = ref(false)
const error = ref('')
const selectedRental = ref<any | null>(null)

const filters = reactive({
  status: '',
  search: ''
})

const sortConfig = reactive({
  field: '' as string,
  order: 'asc' as 'asc' | 'desc'
})

const canAccess = computed(() => auth.user?.roleId === 'admin' || auth.user?.roleId === 'staff')

const statusText = (status?: string) => {
  const map: Record<string, string> = {
    'active': '進行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  if (!status) return '未知'
  return map[status] || status
}

const statusClass = (status?: string) => {
  const map: Record<string, string> = {
    'active': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700',
    'completed': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700',
    'cancelled': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600'
  }
  return map[status || ''] || 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600'
}

const durationText = (seconds?: number) => {
  if (!seconds) return '—'
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} 分鐘`
  const hours = Math.floor(mins / 60)
  const remain = mins % 60
  return `${hours} 小時 ${remain} 分鐘`
}

const formatDateTime = (value?: string, fallback = '—') => {
  if (!value) return fallback
  return new Date(value).toLocaleString('zh-TW')
}

const formatDistance = (distance?: number, fallback = '—') => {
  if (typeof distance !== 'number') return fallback
  return `${distance.toFixed(2)} km`
}

// 搜尋過濾後的租借紀錄
const filteredRentals = computed(() => {
  if (!filters.search) return rentals.value

  const searchLower = filters.search.toLowerCase()
  return rentals.value.filter(rental => {
    // 搜尋租借編號
    if (String(rental.id).includes(searchLower)) return true

    // 搜尋車輛 ID 或名稱
    if (rental.bike?.bike_id?.toLowerCase().includes(searchLower)) return true
    if (rental.bike?.bike_name?.toLowerCase().includes(searchLower)) return true

    // 搜尋會員名稱或 email
    if (rental.member?.full_name?.toLowerCase().includes(searchLower)) return true
    if (rental.member?.email?.toLowerCase().includes(searchLower)) return true

    return false
  })
})

// 排序後的租借紀錄
const sortedRentals = computed(() => {
  if (!sortConfig.field) return filteredRentals.value

  return [...filteredRentals.value].sort((a, b) => {
    let aVal: any = a
    let bVal: any = b

    switch (sortConfig.field) {
      case 'id':
        aVal = a.id
        bVal = b.id
        break
      case 'bike_id':
        aVal = a.bike?.bike_id || ''
        bVal = b.bike?.bike_id || ''
        break
      case 'member_name':
        aVal = a.member?.full_name || a.member?.email || ''
        bVal = b.member?.full_name || b.member?.email || ''
        break
      case 'start_time':
        aVal = new Date(a.start_time || a.startTime || 0).getTime()
        bVal = new Date(b.start_time || b.startTime || 0).getTime()
        break
      case 'end_time':
        aVal = a.end_time || a.endTime ? new Date(a.end_time || a.endTime).getTime() : 0
        bVal = b.end_time || b.endTime ? new Date(b.end_time || b.endTime).getTime() : 0
        break
      case 'status':
        aVal = a.rental_status || a.status || ''
        bVal = b.rental_status || b.status || ''
        break
    }

    if (sortConfig.order === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    }
  })
})

// 切換排序
const toggleSort = (field: string) => {
  if (sortConfig.field === field) {
    sortConfig.order = sortConfig.order === 'asc' ? 'desc' : 'asc'
  } else {
    sortConfig.field = field
    sortConfig.order = 'asc'
  }
}

// 清除篩選
const clearFilters = () => {
  filters.search = ''
  filters.status = ''
  refresh()
}

const refresh = async () => {
  loading.value = true
  error.value = ''
  try {
    if (!canAccess.value) {
      rentals.value = []
      return
    }
    const { data } = await rentalsStore.fetchStaffRentals({ status: filters.status || undefined })

    // 如果有選擇狀態篩選，在前端也進行過濾（以防後端沒有正確過濾）
    let filteredData = data
    if (filters.status) {
      filteredData = data.filter((rental: any) => {
        const rentalStatus = rental.rental_status || rental.status
        return rentalStatus === filters.status
      })
    }

    rentals.value = filteredData
    if (selectedRental.value) {
      const match = filteredData.find(r => r.id === selectedRental.value.id)
      if (!match) {
        selectedRental.value = null
      }
    }
  } catch (err: any) {
    error.value = err?.message || '載入租借紀錄失敗'
  } finally {
    loading.value = false
  }
}

const openDetail = async (rental: any) => {
  selectedRental.value = rental
  detailLoading.value = true
  try {
    const detail = await rentalsStore.fetchStaffRentalDetail(rental.id)
    if (detail) {
      selectedRental.value = detail
    }
  } catch (err) {
    console.error('[RentalManagement] detail failed:', err)
  } finally {
    detailLoading.value = false
  }
}

watch(() => filters.status, refresh)

onMounted(refresh)
</script>
