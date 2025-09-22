<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto" @click.self="handleClose">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" @click="handleClose"></div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" @click.stop>
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-900">車輛租借</h3>
          <button @click="handleClose" class="text-gray-400 hover:text-gray-600 transition-colors">
            <i class="i-ph-x w-5 h-5"></i>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- 車輛 ID（縮短顯示，避免超出） -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">車輛 ID</label>
            <div class="relative md:max-w-[20rem] lg:max-w-[24rem]">
              <div
                class="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700 font-mono text-sm truncate"
                :title="vehicle?.id || ''"
              >
                {{ truncatedVehicleId }}
              </div>
            </div>
          </div>

          <!-- 使用者資訊：member 直接顯示目前登入者；admin/staff 可選擇代租對象 -->
          <div v-if="!isStaff">
            <label class="block text-sm font-medium text-gray-700 mb-2">使用者</label>
            <div class="p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800">
              <div class="font-medium">{{ currentUserName }}</div>
              <div class="text-sm text-gray-600">{{ currentUserPhone || '未提供電話' }}</div>
              <div v-if="currentUserIdLast4" class="text-xs text-gray-500">身分末四碼：{{ currentUserIdLast4 }}</div>
            </div>
          </div>

          <div v-else>
            <label class="block text-sm font-medium text-gray-700 mb-2">代租對象</label>

            <!-- 代租：搜尋 + 下拉（staff 僅保留代租功能） -->
            <div class="space-y-2">
              <div class="relative md:max-w-[20rem] lg:max-w-[24rem]">
                <input v-model="memberQuery" type="text" placeholder="搜尋姓名/帳號/電話" class="w-full px-4 py-3 border border-gray-300 rounded-xl" @input="filterMembers" />
              </div>
              <div class="relative md:max-w-[20rem] lg:max-w-[24rem]">
                <select v-model="selectedMemberId" class="w-full px-4 py-3 border border-gray-300 rounded-xl">
                  <option value="">請選擇成員</option>
                  <option v-for="m in filteredMemberOptions" :key="m.id" :value="String(m.id)">
                    {{ memberLabel(m) }}
                  </option>
                </select>
              </div>
              <p v-if="errors.userName" class="mt-1 text-xs text-red-600">{{ errors.userName }}</p>
            </div>
          </div>

          <div class="flex space-x-3 pt-4">
            <button type="button" @click="handleClose" class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors" :disabled="loading">
              取消
            </button>
            <button type="submit" class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" :disabled="loading || !canSubmit">
              <i v-if="loading" class="i-ph-spinner w-4 h-4 mr-2 animate-spin inline-block"></i>
              <i v-else class="i-ph-check-circle w-4 h-4 mr-2 inline-block"></i>
              {{ loading ? '處理中...' : '確定租借' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useRentals } from '@/stores/rentals'
import { CreateRentalSchema } from '@/types/rental'
import { useAuth } from '@/stores/auth'
import { Koala } from '@/services/koala'
import { useToasts } from '@/stores/toasts'

interface Vehicle { id: string }
const props = defineProps<{ show: boolean; vehicle: Vehicle | null }>()
const emit = defineEmits<{ close: []; success: [rental: any] }>()

const rentalsStore = useRentals()
const auth = useAuth()
const toasts = useToasts()

const isStaff = computed(() => auth.user?.roleId === 'admin' || auth.user?.roleId === 'staff')
// staff 僅保留代租功能（不提供「為自己」）
const isProxy = ref(true)
const currentUserName = computed(() => auth.user?.name || '')
const currentUserPhone = computed(() => auth.user?.phone || '')
const currentUserIdLast4 = computed(() => (auth.user?.idNumber ? String(auth.user.idNumber).slice(-4) : ''))

const loading = ref(false)
const errors = reactive({ userName: '' })

// staff 代租：成員選擇
const memberOptions = ref<any[]>([])
const filteredMemberOptions = ref<any[]>([])
const selectedMemberId = ref<string>('')
const memberQuery = ref('')

const canSubmit = computed(() => {
  if (!props.vehicle) return false
  if (isStaff.value) return !!selectedMemberId.value
  return !!currentUserName.value
})

async function handleSubmit() {
  if (!props.vehicle) return
  loading.value = true
  rentalsStore.clearError()
  try {
    // 準備租借資料
    let userName = currentUserName.value
    let phone = currentUserPhone.value
    let idLast4 = currentUserIdLast4.value

    if (isStaff.value) {
      const m = memberOptions.value.find(x => String(x.id) === selectedMemberId.value)
      if (!m) {
        errors.userName = '請選擇要代租的成員'
        loading.value = false
        return
      }
      userName = m?.full_name || m?.username || ''
      phone = m?.phone || ''
      // Staff 代租時不需要身分證末四碼
      idLast4 = ''
    }

    // 處理可選欄位：確保符合 schema 規則或設為空字符串
    if (!phone) {
      // 如果 auth.user.phone 存在且符合台灣手機號碼格式，使用它；否則留空
      const userPhone = auth.user?.phone || ''
      phone = /^(09\d{8}|(\+886|886)9\d{8})$/.test(userPhone) ? userPhone : ''
    }

    if (!idLast4) {
      // 如果有 user idNumber，取末四碼；否則留空
      if (auth.user?.idNumber) {
        const lastFour = String(auth.user.idNumber).slice(-4)
        idLast4 = /^\d{4}$/.test(lastFour) ? lastFour : ''
      } else {
        idLast4 = ''
      }
    }

    const formData = CreateRentalSchema.parse({ bikeId: props.vehicle.id, userName, phone, idLast4 })
    const isPhone = !!phone && /(^(09\d{8})$)|(^((\+886|886)9\d{8})$)/.test(phone)
    const rental = await rentalsStore.createRental({
      ...formData,
      member_phone: isPhone ? phone : undefined,
      member_email: !isPhone ? (isStaff.value ? (memberOptions.value.find(x => String(x.id) === selectedMemberId.value)?.email || undefined) : (auth.user?.email || undefined)) : undefined
    })
    await rentalsStore.unlockCurrent()
    rentalsStore.setInUse(props.vehicle.id)
    toasts.success('租借成功，車輛已啟用')
    emit('success', rental)
    handleClose()
  } catch (error: any) {
    console.error('租借失敗:', error)
    let message = error?.message || error?.detail || '租借失敗，請稍後再試'
    if (message.startsWith('{')) {
      try {
        const parsed = JSON.parse(message)
        message = parsed?.msg || parsed?.message || message
        const bikeError = parsed?.details?.bike_id?.[0]
        if (bikeError) message = bikeError
      } catch {}
    }
    toasts.error(message)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  if (!loading.value) emit('close')
}

watch(() => props.show, async (open) => {
  if (open) {
    await nextTick()
    if (isStaff.value && memberOptions.value.length === 0) {
      try {
        const list = await Koala.listMembers()
        memberOptions.value = list
        filteredMemberOptions.value = list
      } catch (e) {
        console.warn('無法載入成員清單', e)
      }
    }
  }
})

function filterMembers() {
  const q = memberQuery.value.trim().toLowerCase()
  if (!q) { filteredMemberOptions.value = memberOptions.value; return }
  filteredMemberOptions.value = memberOptions.value.filter((m) => {
    const s = `${m.full_name || ''} ${m.username || ''} ${m.phone || ''} ${m.email || ''}`.toLowerCase()
    return s.includes(q)
  })
}

// 顯示輔助：截斷字串與組裝成員選項
const truncatedVehicleId = computed(() => {
  const id = props.vehicle?.id || ''
  return id.length > 18 ? `${id.slice(0, 8)}…${id.slice(-6)}` : id
})

function short(val: string | undefined, max = 18): string {
  const s = String(val || '')
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function memberLabel(m: any): string {
  const name = short(m.full_name || m.username || '—', 12)
  const contact = short(m.phone || m.email || '無', 14)
  return `${name}（${contact}）`
}
</script>
