<template>
  <div class="space-y-6 p-6 max-w-md mx-auto">
    <h2 class="text-xl font-bold text-gray-900">測試註冊功能</h2>
    
    <form @submit.prevent="testRegister" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Email</label>
        <input v-model="form.email" type="email" class="input w-full" required />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">姓名</label>
        <input v-model="form.fullName" type="text" class="input w-full" required />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">手機號碼</label>
        <input v-model="form.phone" type="tel" class="input w-full" placeholder="0912345678" required />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">身份證號</label>
        <input v-model="form.nationalId" type="text" class="input w-full" placeholder="A123456789 (可選)" />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">會員類型</label>
        <select v-model="form.memberType" class="input w-full">
          <option value="tourist">遊客</option>
          <option value="real">一般會員</option>
        </select>
      </div>
      
      <button type="submit" :disabled="loading" class="btn w-full">
        {{ loading ? '註冊中...' : '測試註冊' }}
      </button>
    </form>
    
    <div v-if="error" class="p-3 bg-red-50 text-red-700 rounded">
      錯誤：{{ error }}
    </div>
    
    <div v-if="success" class="p-3 bg-green-50 text-green-700 rounded">
      成功：{{ success }}
    </div>
    
    <div v-if="result" class="p-3 bg-blue-50 text-blue-700 rounded text-xs">
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useUsers } from '@/stores/users'

const store = useUsers()

const form = reactive({
  email: 'testuser@example.com',
  fullName: '測試用戶',
  phone: '0912345678',
  nationalId: 'A123456789',
  memberType: 'tourist' as 'tourist' | 'real'
})

const loading = ref(false)
const error = ref('')
const success = ref('')
const result = ref<any>(null)

async function testRegister() {
  loading.value = true
  error.value = ''
  success.value = ''
  result.value = null
  
  try {
    const res = await store.registerMember({
      email: form.email,
      fullName: form.fullName,
      phone: form.phone,
      nationalId: form.nationalId,
      memberType: form.memberType
    })
    
    success.value = '註冊成功！'
    result.value = res
  } catch (e: any) {
    error.value = e.message || '註冊失敗'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.input { @apply w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500; }
.btn { @apply rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-50; }
</style>