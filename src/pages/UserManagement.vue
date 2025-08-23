<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <i class="i-ph:users w-6 h-6 text-brand-primary" />
          <h1 class="text-xl font-semibold text-gray-900">帳號管理</h1>
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="store.fetchAll"
            :disabled="store.loading"
            class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <i :class="['i-ph:arrow-clockwise w-4 h-4', { 'animate-spin': store.loading }]" />
            <span>重新整理</span>
          </button>
          <button
            @click="openCreate"
            class="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary/90"
          >
            <i class="i-ph:plus w-4 h-4" />
            <span>新增使用者</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 rounded-lg">
              <i class="i-ph:users w-6 h-6 text-blue-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">總使用者</p>
              <p class="text-2xl font-bold text-gray-900">{{ store.users.length }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div class="flex items-center">
            <div class="p-2 bg-green-100 rounded-lg">
              <i class="i-ph:check-circle w-6 h-6 text-green-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">啟用中</p>
              <p class="text-2xl font-bold text-gray-900">{{ activeUsers }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div class="flex items-center">
            <div class="p-2 bg-red-100 rounded-lg">
              <i class="i-ph:x-circle w-6 h-6 text-red-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">停用中</p>
              <p class="text-2xl font-bold text-gray-900">{{ inactiveUsers }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div class="flex items-center">
            <div class="p-2 bg-purple-100 rounded-lg">
              <i class="i-ph:crown w-6 h-6 text-purple-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">角色類型</p>
              <p class="text-2xl font-bold text-gray-900">{{ store.roles.length }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用者</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">建立時間</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="u in store.usersWithRole" :key="u.id" class="hover:bg-gray-50">
                <!-- 編輯模式 -->
                <template v-if="editingId === u.id">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="space-y-2">
                      <input
                        v-model="draft.email"
                        type="email"
                        placeholder="Email"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm"
                      />
                      <input
                        v-model="draft.fullName"
                        type="text"
                        placeholder="姓名"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm"
                      />
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <select
                      v-model="draft.roleId"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm"
                    >
                      <option v-for="r in store.roles" :key="r.id" :value="r.id">
                        {{ r.name }}
                      </option>
                    </select>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <input
                        v-model="draft.active"
                        type="checkbox"
                        class="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                      />
                      <span class="ml-2 text-sm text-gray-700">
                        {{ draft.active ? '啟用' : '停用' }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(u.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                      <button
                        @click="saveEdit"
                        class="text-green-600 hover:text-green-900 px-2 py-1 text-xs font-medium bg-green-100 rounded"
                      >
                        保存
                      </button>
                      <button
                        @click="cancelEdit"
                        class="text-gray-600 hover:text-gray-900 px-2 py-1 text-xs font-medium bg-gray-100 rounded"
                      >
                        取消
                      </button>
                    </div>
                  </td>
                </template>

                <!-- 檢視模式 -->
                <template v-else>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center">
                        <span class="text-white font-medium text-sm">
                          {{ u.fullName.charAt(0).toUpperCase() }}
                        </span>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{{ u.fullName }}</div>
                        <div class="text-sm text-gray-500">{{ u.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {{ u.roleName }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        u.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      ]"
                    >
                      {{ u.active ? '啟用' : '停用' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(u.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                      <button
                        @click="beginEdit(u)"
                        class="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      >
                        <i class="i-ph:pencil w-4 h-4" />
                      </button>
                      <button
                        @click="store.toggleActive(u.id)"
                        :class="[
                          'p-1 rounded',
                          u.active
                            ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                        ]"
                      >
                        <i :class="u.active ? 'i-ph:x-circle w-4 h-4' : 'i-ph:check-circle w-4 h-4'" />
                      </button>
                    </div>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <div v-if="store.usersWithRole.length === 0" class="py-12 text-center">
            <i class="i-ph:users w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">尚無使用者</h3>
            <p class="text-gray-500">點擊新增使用者開始建立帳號</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add User Modal -->
    <div
      v-if="showDlg"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click.self="closeDlg"
    >
      <div class="bg-white rounded-lg max-w-md w-full p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">新增使用者</h3>
          <button @click="closeDlg" class="text-gray-400 hover:text-gray-600">
            <i class="i-ph:x w-6 h-6" />
          </button>
        </div>

        <form @submit.prevent="addUser" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              ref="emailInput"
              v-model="temp.email"
              type="email"
              required
              placeholder="user@example.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
            <input
              v-model="temp.fullName"
              type="text"
              required
              placeholder="請輸入全名"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">角色 *</label>
            <select
              v-model="temp.roleId"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value="">請選擇角色</option>
              <option v-for="r in store.roles" :key="r.id" :value="r.id">
                {{ r.name }}
              </option>
            </select>
          </div>

          <div class="flex items-center">
            <input
              v-model="temp.active"
              type="checkbox"
              id="newUserActive"
              class="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
            />
            <label for="newUserActive" class="ml-2 text-sm font-medium text-gray-700">
              啟用狀態
            </label>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="closeDlg"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary/90"
            >
              新增
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="store.errMsg"
      class="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-sm"
    >
      <div class="flex items-center space-x-2">
        <i class="i-ph:warning-circle w-5 h-5" />
        <span class="text-sm font-medium">{{ store.errMsg }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue'
import { useUsers } from '@/stores/users'
import type { User } from '@/types'

// Store
const store = useUsers()

// State
const editingId = ref<string>('')
const showDlg = ref(false)
const emailInput = ref<HTMLInputElement|null>(null)

type UserRow = (typeof store.usersWithRole)[number]

// Form data
const draft = reactive<Pick<UserRow, 'id'|'email'|'fullName'|'roleId'|'active'>>({
  id: '', email: '', fullName: '', roleId: '', active: true
})

const temp = reactive<Pick<UserRow, 'email'|'fullName'|'roleId'|'active'>>({
  email: '', fullName: '', roleId: '', active: true
})

// Computed
const activeUsers = computed(() => store.users.filter(u => u.active).length)
const inactiveUsers = computed(() => store.users.filter(u => !u.active).length)

// Methods
const beginEdit = (u: UserRow) => {
  editingId.value = u.id
  Object.assign(draft, u)
}

const cancelEdit = () => {
  editingId.value = ''
  store.errMsg = ''
}

const saveEdit = () => {
  store.updateUser({ ...draft } as User)
  if (!store.errMsg) {
    editingId.value = ''
  }
}

const openCreate = () => {
  Object.assign(temp, { email: '', fullName: '', roleId: '', active: true })
  showDlg.value = true
}

const closeDlg = () => {
  showDlg.value = false
  store.errMsg = ''
}

const addUser = () => {
  if (!temp.email || !temp.fullName || !temp.roleId) {
    store.errMsg = '請完整填寫 Email、姓名與角色'
    return
  }
  
  const newUser: User = {
    id       : 'u_' + Date.now().toString(36),
    email    : temp.email,
    fullName : temp.fullName,
    roleId   : temp.roleId,
    active   : temp.active,
    createdAt: new Date().toISOString(),
    lastLogin: ''
  }
  
  store.addUser(newUser)
  
  if (!store.errMsg) {
    showDlg.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
  store.fetchAll()
})
</script>

<style scoped>
/* No custom styles needed - using Tailwind classes */
</style>
