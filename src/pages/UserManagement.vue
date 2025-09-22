<!-- src/pages/UserManagement.vue -->
<template>
  <div class="space-y-6">
    <!-- ── Toolbar ─────────────────────────────────────────────── -->
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h2 class="text-2xl font-bold text-gray-900">使用者與角色管理</h2>
        <!-- 新增使用者 -->
        <button
          class="btn-add flex items-center gap-1 shadow-lg hover:shadow-xl transition"
          @click="openCreate"
        >
          <Plus class="w-4 h-4"/> 新增使用者
        </button>
      </div>

      <button
        class="btn text-sm i-ph-arrow-clockwise flex items-center gap-1"
        :disabled="store.isLoading"
        @click="store.fetchAll"
      >
        <RefreshCw class="w-4 h-4"/> 重新整理
      </button>
    </header>

    <!-- ── User / Role 表格 ─────────────────────────────────────── -->
    <div class="card overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead class="bg-gray-50 text-gray-600 sticky top-0">
          <tr class="text-left text-xs font-semibold uppercase tracking-wider">
            <th class="px-4 py-3 w-[180px] cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('email')">
              <div class="flex items-center gap-1">
                Email
                <i v-if="sortConfig.field === 'email'"
                   :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                   class="w-3 h-3"></i>
                <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
              </div>
            </th>
            <th class="px-4 py-3 w-[120px] cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('fullName')">
              <div class="flex items-center gap-1">
                姓名
                <i v-if="sortConfig.field === 'fullName'"
                   :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                   class="w-3 h-3"></i>
                <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
              </div>
            </th>
            <th class="px-4 py-3 w-[100px] cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('phone')">
              <div class="flex items-center gap-1">
                手機
                <i v-if="sortConfig.field === 'phone'"
                   :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                   class="w-3 h-3"></i>
                <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
              </div>
            </th>
            <th class="px-4 py-3 w-[100px] cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('nationalId')">
              <div class="flex items-center gap-1">
                身份證號
                <i v-if="sortConfig.field === 'nationalId'"
                   :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                   class="w-3 h-3"></i>
                <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
              </div>
            </th>
            <th class="px-4 py-3 w-[80px] cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('role')">
              <div class="flex items-center gap-1">
                角色
                <i v-if="sortConfig.field === 'role'"
                   :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                   class="w-3 h-3"></i>
                <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
              </div>
            </th>
            <th class="px-4 py-3 text-center w-[70px] cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('status')">
              <div class="flex items-center gap-1 justify-center">
                狀態
                <i v-if="sortConfig.field === 'status'"
                   :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                   class="w-3 h-3"></i>
                <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
              </div>
            </th>
            <th class="px-4 py-3 w-[160px]"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="u in sortedUsers"
            :key="u.id"
            class="border-t border-white/5 hover:bg-brand-400/5 transition"
          >
            <!-- 編輯模式 -->
            <template v-if="editingId === u.id">
              <td class="px-3 py-1">
                <input
                  v-model="draft.email"
                  class="input"
                  type="email"
                  placeholder="email"
                />
              </td>
              <td class="px-3 py-1">
                <input
                  v-model="draft.fullName"
                  class="input"
                  type="text"
                  placeholder="姓名"
                />
              </td>
              <td class="px-3 py-1">
                <input
                  v-model="draft.phone"
                  class="input"
                  type="tel"
                  placeholder="手機號碼 (如: 0912345678)"
                />
              </td>
              <td class="px-3 py-1">
                <input
                  v-model="draft.nationalId"
                  class="input"
                  type="text"
                  placeholder="身份證號"
                />
              </td>
              <td class="px-3 py-1">
                <select v-model="draft.roleId" class="input">
                  <option
                    v-for="r in store.roles"
                    :key="r.id"
                    :value="r.id"
                  >
                    {{ r.name }}
                  </option>
                </select>
              </td>
              <td class="px-3 py-1 text-center">
                <input type="checkbox" v-model="draft.active" />
              </td>
              <td class="px-3 py-1 text-right space-x-2">
                <button class="btn !text-xs" @click="saveEdit">保存</button>
                <button class="btn !text-xs" @click="cancelEdit">取消</button>
              </td>
            </template>

            <!-- 檢視模式 -->
            <template v-else>
              <td class="px-4 py-2 font-mono text-gray-900">{{ u.email }}</td>
              <td class="px-4 py-2 text-gray-900">{{ u.fullName }}</td>
              <td class="px-4 py-2 text-gray-900">{{ formatPhoneForDisplay(u.phone) || '-' }}</td>
              <td class="px-4 py-2 text-gray-900">{{ u.nationalId ? maskNationalId(u.nationalId) : '-' }}</td>
              <td class="px-4 py-2 text-gray-900">{{ u.roleName }}</td>
              <td class="px-4 py-2 text-center">
                <span :class="u.active ? 'text-emerald-400' : 'text-rose-400'">
                  {{ u.active ? '啟用' : '停用' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <!-- 編輯按鈕 -->
                  <button
                    class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition-colors"
                    @click="beginEdit(u)"
                  >
                    <i class="i-ph-pencil-simple w-3.5 h-3.5 mr-1"></i>
                    編輯
                  </button>

                  <!-- 停用/啟用按鈕 -->
                  <button
                    class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
                    :class="u.active
                      ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100 focus:ring-amber-500'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 focus:ring-emerald-500'"
                    @click="store.toggleActive(u.id)"
                  >
                    <i :class="u.active ? 'i-ph-pause-circle w-3.5 h-3.5 mr-1' : 'i-ph-play-circle w-3.5 h-3.5 mr-1'"></i>
                    {{ u.active ? '停用' : '啟用' }}
                  </button>

                  <!-- 刪除按鈕 -->
                  <button
                    class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    @click="confirmDelete(u)"
                    :disabled="store.loading"
                  >
                    <i class="i-ph-trash w-3.5 h-3.5 mr-1"></i>
                    刪除
                  </button>
                </div>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 狀態訊息 -->
    <p v-if="store.isLoading" class="text-gray-600">Loading…</p>
    <p v-if="store.errMsg"   class="text-rose-400">{{ store.errMsg }}</p>

    <!-- ── 新增對話框 ─────────────────────────────────────────── -->
    <Dialog
      v-model:open="showDlg"
      class="fixed inset-0 grid place-items-center bg-black/40 z-50"
      :initial-focus="emailInput"
    >
      <DialogPanel
        class="w-[26rem] space-y-6 rounded-xl bg-white p-6 text-gray-900 shadow-xl transform transition-all"
      >
        <h3 class="text-xl font-bold">新增使用者</h3>

        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <label class="w-24">Email</label>
            <input
              ref="emailInput"
              v-model="temp.email"
              class="input flex-1"
              type="email"
              placeholder="user@example.com"
              @blur="runEmailAvailabilityCheck(true)"
            />
          </div>
          <p
            class="text-xs min-h-[1.25rem] pl-24"
            :class="emailStatus.available === false ? 'text-rose-500' : emailStatus.available ? 'text-emerald-600' : 'text-gray-500'"
          >
            <span v-if="emailStatus.checking">檢查中…</span>
            <span v-else-if="emailStatus.available === true">此電子郵件可使用</span>
            <span v-else-if="emailStatus.available === false">{{ emailStatus.message || '此電子郵件已被使用' }}</span>
            <span v-else-if="emailStatus.message">{{ emailStatus.message }}</span>
          </p>
          <div class="flex items-center gap-3">
            <label class="w-24">姓名</label>
            <input
              v-model="temp.fullName"
              class="input flex-1"
              type="text"
              placeholder="全名"
            />
          </div>
          <!-- 角色決定後續欄位顯示 -->
          <div class="flex items-center gap-3">
            <label class="w-24">角色</label>
            <select v-model="temp.roleId" class="input flex-1">
              <option value="">— 請選擇 —</option>
              <option
                v-for="r in store.roles"
                :key="r.id"
                :value="r.id"
              >
                {{ r.name }}
              </option>
            </select>
          </div>
          <!-- 共同欄位：電話、身份證號 -->
          <div class="flex items-center gap-3">
            <label class="w-24">電話</label>
            <input
              v-model="temp.phone"
              class="input flex-1"
              type="tel"
              placeholder="0912345678 或 +886912345678"
            />
          </div>
          <div class="flex items-center gap-3">
            <label class="w-24">身份證號</label>
            <input
              v-model="temp.nationalId"
              class="input flex-1"
              type="text"
              placeholder="A123456789 (可選填，但一般會員必填)"
            />
          </div>

          <!-- 沒有附加類型選擇，直接使用 roleId 來決定類型 -->
          <!-- 身份證號只有 real member 的時候需要 -->
          <div v-if="temp.roleId === 'member'" class="text-sm text-gray-600">
            注意：會員類型將根據是否提供身份證號自動決定（有身份證號=一般會員，無=遊客）
          </div>
          <div v-else-if="temp.roleId === 'visitor'" class="text-sm text-gray-600">
            注意：遊客帳號不需要身份證號
          </div>
          <div v-else-if="temp.roleId === 'staff' || temp.roleId === 'admin'" class="text-sm text-gray-600">
            注意：Staff 帳號通常不需要身份證號
          </div>
          <div class="flex items-center gap-3">
            <label class="w-24">狀態</label>
            <input
              type="checkbox"
              v-model="temp.active"
            />
            <span class="text-sm">{{ temp.active ? '啟用' : '停用' }}</span>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button
            class="btn bg-gray-500 hover:bg-gray-400"
            @click="showDlg = false"
          >
            取消
          </button>
          <button class="btn" @click="addUser">新增</button>
        </div>
      </DialogPanel>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, watch, computed } from 'vue'
import { Dialog, DialogPanel }      from '@headlessui/vue'
import { Plus, RefreshCw }          from 'lucide-vue-next'
import { useUsers }                 from '@/stores/users'
import { maskNationalId } from '@/lib/encryption'
import { formatPhoneForDisplay } from '@/lib/phone'
import type { User, Role } from '@/types'

// store
const store = useUsers()
onMounted(() => store.fetchAll())

// Sorting configuration
const sortConfig = ref({
  field: '' as string,
  order: 'asc' as 'asc' | 'desc'
})

// Sorted users
const sortedUsers = computed(() => {
  let list = [...store.usersWithRole]

  // Apply sorting
  if (sortConfig.value.field) {
    list.sort((a, b) => {
      let aVal: any = ''
      let bVal: any = ''

      switch (sortConfig.value.field) {
        case 'email':
          aVal = a.email
          bVal = b.email
          break
        case 'fullName':
          aVal = a.fullName
          bVal = b.fullName
          break
        case 'phone':
          aVal = a.phone || ''
          bVal = b.phone || ''
          break
        case 'nationalId':
          aVal = a.nationalId || ''
          bVal = b.nationalId || ''
          break
        case 'role':
          aVal = a.roleName
          bVal = b.roleName
          break
        case 'status':
          aVal = a.active ? 1 : 0
          bVal = b.active ? 1 : 0
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

// 編輯
const editingId = ref<string>('')
type UserRow = (typeof store.usersWithRole)[number]
const draft = reactive<Pick<UserRow, 'id'|'email'|'fullName'|'roleId'|'active'> & {
  phone?: string
  nationalId?: string
  password?: string
}>({
  id: '', email: '', fullName: '', roleId: '', active: true,
  phone: '', nationalId: '', password: ''
})
function beginEdit(u: UserRow) {
  editingId.value = u.id
  Object.assign(draft, u)
}
function cancelEdit() {
  editingId.value = ''
}
function saveEdit() {
  store.updateUser({ ...draft } as User)
  editingId.value = ''
}

// 新增
const showDlg = ref(false)
const temp = reactive<{ email:string; fullName:string; roleId:string; active:boolean; phone:string; nationalId:string; }>({
  email: '', fullName: '', roleId: '', active: true,
  phone: '', nationalId: ''
})
const emailInput = ref<HTMLInputElement|null>(null)
function openCreate() {
  Object.assign(temp, { email: '', fullName: '', roleId: '', active: true, phone: '', nationalId: '' })
  resetEmailStatus()
  showDlg.value = true
}

const emailStatus = reactive<{ checking: boolean; available: boolean | null; message: string }>({
  checking: false,
  available: null,
  message: ''
})
let emailTimer: ReturnType<typeof setTimeout> | undefined

function resetEmailStatus() {
  emailStatus.checking = false
  emailStatus.available = null
  emailStatus.message = ''
}

async function runEmailAvailabilityCheck(force = false) {
  const email = temp.email?.trim()
  if (!email) {
    resetEmailStatus()
    return
  }
  if (!force && emailStatus.available !== null) {
    return
  }
  try {
    emailStatus.checking = true
    const { available, message } = await store.checkAvailability({ email })
    emailStatus.available = available
    emailStatus.message = message || (available ? '此電子郵件可使用' : '此電子郵件已被使用')
  } catch (err: any) {
    emailStatus.available = null
    emailStatus.message = err?.message || '檢查失敗'
  } finally {
    emailStatus.checking = false
  }
}

watch(() => temp.email, (value) => {
  if (emailTimer) clearTimeout(emailTimer)
  if (!value) {
    resetEmailStatus()
    return
  }
  emailStatus.checking = true
  emailTimer = setTimeout(() => {
    runEmailAvailabilityCheck(true)
  }, 450)
})

async function addUser() {
  if (!temp.email || !temp.fullName || !temp.roleId) {
    alert('請完整填寫 Email、姓名與角色')
    return
  }
  if (!temp.phone) {
    alert('請填寫電話')
    return
  }
  // 只有 real member 需要身份證號
  if (temp.roleId === 'member' && temp.nationalId && !temp.nationalId.trim()) {
    alert('一般會員需要身份證號')
    return
  }

  if (emailStatus.available === false) {
    alert(emailStatus.message || '此電子郵件已被使用')
    return
  }

  if (emailStatus.available === null && !emailStatus.checking && temp.email) {
    await runEmailAvailabilityCheck(true)
    if (emailStatus.available === false) {
      alert(emailStatus.message || '此電子郵件已被使用')
      return
    }
  }
  // 使用統一註冊方法支援所有用戶類型
  const userTypeMap: { [key: string]: 'tourist' | 'real' | 'staff' | 'admin' } = {
    'visitor': 'tourist',
    'member': temp.nationalId ? 'real' : 'tourist', // 有身份證號的為一般會員，無的為遊客
    'staff': 'staff',
    'admin': 'admin'
  }

  const userType = userTypeMap[temp.roleId] || 'tourist'

  try {
    await store.registerUser({
      email: temp.email,
      fullName: temp.fullName,
      phone: temp.phone,
      nationalId: temp.nationalId || '', // 可選
      userType: userType,
      active: temp.active
    })
    showDlg.value = false
  } catch (err: any) {
    alert(err?.message || '用戶註冊失敗')
  }
}

async function confirmDelete(user: UserRow) {
  const label = user.fullName || user.email
  if (!window.confirm(`確定要刪除「${label}」嗎？`)) {
    return
  }
  try {
    await store.removeUser(user.id)
  } catch (err: any) {
    alert(err?.message || '刪除失敗')
  }
}
</script>

<style scoped>
.card   { @apply rounded-2xl bg-white/5 backdrop-blur-xl p-4; }
.btn    { @apply rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-500 disabled:opacity-60 transition; }
.btn-add{ @apply rounded bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-500 transition; }
.input  { @apply w-full rounded border border-black/15 bg-white px-2 py-1 text-sm focus:outline-none; }
/* Dialog 過場動畫 */
[v-cloak] { display: none; }
</style>
