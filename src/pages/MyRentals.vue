<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">我的租借</h1>
        <p class="mt-1 text-sm text-gray-600">查看個人租借歷程與詳細資訊。</p>
      </div>
      <Button variant="outline" size="sm" @click="refresh" :disabled="loading">
        <i class="i-ph-arrow-clockwise w-4 h-4 mr-2"></i>
        重新整理
      </Button>
    </div>


    <div v-if="!isMember" class="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-700">
      <p>此頁面僅提供會員檢視個人租借紀錄。請使用會員帳號登入，或改至「租借管理」檢視全站租借狀態。</p>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-10 text-gray-500">
      <i class="i-ph-spinner w-10 h-10 animate-spin mb-3"></i>
      載入租借紀錄中…
    </div>

    <div v-else-if="error" class="flex flex-col items-center justify-center py-10 text-rose-500 gap-3">
      <i class="i-ph-warning-circle w-10 h-10"></i>
      <p>{{ error }}</p>
      <Button variant="outline" size="sm" @click="refresh">重試</Button>
    </div>

    <div v-else-if="rentals.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-500 gap-2">
      <i class="i-ph-bicycle w-12 h-12"></i>
      <p>目前沒有任何租借紀錄</p>
    </div>

    <div v-else class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr class="text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
            <th class="px-4 py-3">租借編號</th>
            <th class="px-4 py-3">車輛</th>
            <th class="px-4 py-3">開始時間</th>
            <th class="px-4 py-3">結束時間</th>
            <th class="px-4 py-3">狀態</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 text-sm text-gray-700">
          <tr
            v-for="rental in rentals"
            :key="rental.id"
            class="hover:bg-indigo-50 cursor-pointer"
            @click="openDetail(rental)"
          >
            <td class="px-4 py-3 font-mono text-gray-900">{{ rental.id }}</td>
            <td class="px-4 py-3">
              <div class="font-medium text-gray-900">{{ rental.bike?.bike_name || rental.bike?.bike_id || '未知車輛' }}</div>
              <div class="text-xs text-gray-500">{{ rental.bike?.bike_id }}</div>
            </td>
            <td class="px-4 py-3">{{ formatDateTime(rental.start_time || rental.startTime) }}</td>
            <td class="px-4 py-3">{{ formatDateTime(rental.end_time || rental.endTime, '尚未結束') }}</td>
            <td class="px-4 py-3">
              <span :class="statusClass(rental.rental_status || rental.status)">
                {{ statusText(rental.rental_status || rental.status) }}
              </span>
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Button } from '@/design/components'
import { useRentals } from '@/stores/rentals'
import { useAuth } from '@/stores/auth'

const rentalsStore = useRentals()
const auth = useAuth()

const rentals = ref<any[]>([])
const loading = ref(false)
const detailLoading = ref(false)
const error = ref('')
const selectedRental = ref<any | null>(null)

const userRole = computed(() => auth.user?.roleId || sessionStorage.getItem('penguin.role') || localStorage.getItem('penguin.role'))
const isMember = computed(() => userRole.value === 'member')

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

const formatDateTime = (value?: string, fallback = '—') => {
  if (!value) return fallback
  return new Date(value).toLocaleString('zh-TW')
}


const refresh = async () => {
  if (!isMember.value) {
    rentals.value = []
    error.value = ''
    selectedRental.value = null
    return
  }

  loading.value = true
  error.value = ''
  try {
    const { data } = await rentalsStore.fetchMemberRentals(undefined, { updateState: false })
    rentals.value = Array.isArray(data) ? data : []
    if (selectedRental.value) {
      const match = rentals.value.find(r => r.id === selectedRental.value?.id)
      if (!match) selectedRental.value = null
    }
  } catch (err) {
    console.error('[MyRentals] refresh failed:', err)
    error.value = err?.message || '載入租借紀錄失敗'
  } finally {
    loading.value = false
  }
}

const openDetail = async (rental: any) => {
  selectedRental.value = rental
  detailLoading.value = true
  try {
    const detail = await rentalsStore.fetchMemberRentalDetail(rental.id)
    if (detail) {
      selectedRental.value = detail
    }
  } catch (err) {
    console.error('[MyRentals] detail failed:', err)
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => {
  if (isMember.value) {
    refresh()
  }
})

watch(userRole, (role, prev) => {
  if (role === 'member' && prev !== 'member') {
    refresh()
  }
}, { immediate: false })

watch(() => auth.isLogin, (loggedIn) => {
  if (loggedIn && isMember.value) {
    refresh()
  }
})
</script>
