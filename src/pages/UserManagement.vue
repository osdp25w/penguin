<!-- src/pages/UserManagement.vue -->
<template>
  <div class="space-y-6">
    <!-- ── Toolbar ─────────────────────────────────────────────── -->
    <header class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">使用者與角色管理</h2>
      <button
        class="btn i-ph:arrow-clockwise-duotone"
        :disabled="store.loading"
        @click="store.fetchAll"
      >
        重新整理
      </button>
    </header>

    <!-- ── User / Role 表格 ─────────────────────────────────────── -->
    <div class="card overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead class="bg-white/5 text-brand-300">
          <tr>
            <th class="px-4 py-2 w-[200px]">Email</th>
            <th class="px-4 py-2 w-[140px]">姓名</th>
            <th class="px-4 py-2 w-[110px]">角色</th>
            <th class="px-4 py-2 text-center w-[70px]">狀態</th>
            <th class="px-4 py-2 w-[140px]"></th>
          </tr>
        </thead>

        <tbody>
          <!-- ▶ 列出所有使用者 ─────────────────────────────────── -->
          <tr
            v-for="u in store.usersWithRole"
            :key="u.id"
            class="border-t border-white/5 hover:bg-brand-400/5 transition"
          >
            <!-- ====== 編輯模式 ====== -->
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

            <!-- ====== 檢視模式 ====== -->
            <template v-else>
              <td class="px-4 py-2 font-mono">{{ u.email }}</td>
              <td class="px-4 py-2">{{ u.fullName }}</td>
              <td class="px-4 py-2">{{ u.roleName }}</td>
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

    <!-- ── 狀態訊息 ───────────────────────────────────────────── -->
    <p v-if="store.loading" class="text-gray-400">Loading…</p>
    <p v-if="store.errMsg" class="text-rose-400">{{ store.errMsg }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { useUsers } from '@/stores'

/* ───────────── Pinia store ───────────── */
const store = useUsers()
onMounted(() => store.fetchAll())

/* ───────────── 編輯區域 ───────────── */
const editingId = ref<string>('')                // 正在編輯的使用者 id

type UserRow = (typeof store.usersWithRole)[number]

const draft = reactive<Pick<UserRow, 'id' | 'email' | 'fullName' | 'roleId' | 'active'>>({
  id: '',
  email: '',
  fullName: '',
  roleId: '',
  active: true
})

function beginEdit(u: UserRow) {
  editingId.value = u.id
  Object.assign(draft, u)                        // 複製到暫存
}

function cancelEdit() {
  editingId.value = ''
}

function saveEdit() {
  store.updateUser({ ...draft })                 // 呼叫 Pinia action
  editingId.value = ''
}
</script>

<style scoped>
.card  { @apply rounded-2xl bg-white/5 backdrop-blur-xl p-4; }
.btn   { @apply rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-500 disabled:opacity-60 transition; }
.input { @apply w-full rounded border border-black/15 bg-white px-2 py-1 text-sm; }
</style>
