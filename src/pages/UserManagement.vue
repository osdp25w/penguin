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
        <thead class="bg-white/5 text-gray-900 sticky top-0">
          <tr>
            <th class="px-4 py-2 w-[180px] font-medium">Email</th>
            <th class="px-4 py-2 w-[120px] font-medium">姓名</th>
            <th class="px-4 py-2 w-[100px] font-medium">手機</th>
            <th class="px-4 py-2 w-[100px] font-medium">身份證號</th>
            <th class="px-4 py-2 w-[80px] font-medium">角色</th>
            <th class="px-4 py-2 text-center w-[70px] font-medium">狀態</th>
            <th class="px-4 py-2 w-[160px]"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="u in store.usersWithRole"
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
              <td class="px-4 py-2 text-right space-x-2">
                <button class="btn !text-xs" @click="beginEdit(u)">編輯</button>
                <button
                  class="btn !text-xs"
                  @click="store.toggleActive(u.id)"
                >
                  {{ u.active ? '停用' : '啟用' }}
                </button>
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
            />
          </div>
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
import { onMounted, ref, reactive } from 'vue'
import { Dialog, DialogPanel }      from '@headlessui/vue'
import { Plus, RefreshCw }          from 'lucide-vue-next'
import { useUsers }                 from '@/stores/users'
import { maskNationalId } from '@/lib/encryption'
import { formatPhoneForDisplay } from '@/lib/phone'
import type { User, Role } from '@/types'

// store
const store = useUsers()
onMounted(() => store.fetchAll())

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
  showDlg.value = true
}
function addUser() {
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
  // 使用統一註冊方法支援所有用戶類型
  const userTypeMap: { [key: string]: 'tourist' | 'real' | 'staff' | 'admin' } = {
    'visitor': 'tourist',
    'member': temp.nationalId ? 'real' : 'tourist', // 有身份證號的為一般會員，無的為遊客
    'staff': 'staff',
    'admin': 'admin'
  }

  const userType = userTypeMap[temp.roleId] || 'tourist'

  store.registerUser({
    email: temp.email,
    fullName: temp.fullName,
    phone: temp.phone,
    nationalId: temp.nationalId || '', // 可選
    userType: userType,
    active: temp.active
  })
  .then(() => { showDlg.value = false })
  .catch(err => { alert(err?.message || '用戶註冊失敗') })
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
