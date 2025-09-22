<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Backdrop with blur effect -->
      <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" @click="handleClose"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <!-- User Avatar -->
            <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span class="text-lg font-semibold text-gray-600">{{ userInitials }}</span>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900">
                個人資料
              </h3>
              <p class="text-sm text-gray-500">管理您的個人資訊</p>
            </div>
          </div>
          <button
            type="button"
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            @click="handleClose"
          >
            <i class="i-ph-x w-5 h-5"></i>
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Basic Information Section -->
          <div class="space-y-4">
            <div class="mb-4">
              <h4 class="text-sm font-medium text-gray-900 mb-4">基本資訊</h4>
            </div>

            <!-- 表單欄位 -->
            <div class="space-y-4">
              <!-- Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  姓名 <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="請輸入姓名"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  :class="{ 'border-red-300': errors.name }"
                >
                <p v-if="errors.name" class="mt-1 text-xs text-red-600">{{ errors.name }}</p>
              </div>

              <!-- Phone -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  電話號碼
                </label>
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="0912-345-678"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  :class="{ 'border-red-300': errors.phone }"
                >
                <p v-if="errors.phone" class="mt-1 text-xs text-red-600">{{ errors.phone }}</p>
              </div>

              <!-- Email -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  電子信箱 <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="example@mail.com"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  :class="{ 'border-red-300': errors.email }"
                >
                <p v-if="errors.email" class="mt-1 text-xs text-red-600">{{ errors.email }}</p>
              </div>

              <!-- ID Number -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  身分證號碼
                </label>
                <input
                  v-model="form.idNumber"
                  type="text"
                  placeholder="A123456789"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  :class="{ 'border-red-300': errors.idNumber }"
                  maxlength="10"
                >
                <p v-if="errors.idNumber" class="mt-1 text-xs text-red-600">{{ errors.idNumber }}</p>
              </div>
            </div>
          </div>

          <!-- Password Section -->
          <div class="pt-4 border-t border-gray-200">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium text-gray-900">更改密碼</h4>
              <button
                type="button"
                class="text-sm text-indigo-600 hover:text-indigo-500"
                @click="showPasswordFields = !showPasswordFields"
              >
                {{ showPasswordFields ? '取消更改' : '更改密碼' }}
              </button>
            </div>

            <div v-show="showPasswordFields" class="space-y-3">
              <!-- Current Password -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  目前密碼 <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.currentPassword"
                  type="password"
                  placeholder="請輸入目前密碼"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  :class="{ 'border-red-300': errors.currentPassword }"
                >
                <p v-if="errors.currentPassword" class="mt-1 text-xs text-red-600">{{ errors.currentPassword }}</p>
              </div>

              <!-- New Password and Confirm in two columns -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- New Password -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    新密碼 <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.password"
                    type="password"
                    placeholder="至少6個字元"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    :class="{ 'border-red-300': errors.password }"
                  >
                  <p v-if="errors.password" class="mt-1 text-xs text-red-600">{{ errors.password }}</p>
                </div>

                <!-- Confirm Password -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    確認新密碼 <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.confirmPassword"
                    type="password"
                    placeholder="再次輸入密碼"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    :class="{ 'border-red-300': errors.confirmPassword }"
                  >
                  <p v-if="errors.confirmPassword" class="mt-1 text-xs text-red-600">{{ errors.confirmPassword }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" type="button" @click="handleClose">
              取消
            </Button>
            <Button variant="primary" type="submit" :disabled="isSubmitting">
              <i v-if="isSubmitting" class="i-ph-spinner w-4 h-4 mr-2 animate-spin"></i>
              <i v-else class="i-ph-check w-4 h-4 mr-2"></i>
              {{ isSubmitting ? '更新中...' : '儲存更改' }}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { z } from 'zod'
import { Button } from '@/design/components'
import { useAuth } from '@/stores/auth'

const emit = defineEmits<{
  close: []
  success: []
}>()

// Store
const auth = useAuth()

// Form data
const form = reactive({
  name: '',
  email: '',
  phone: '',
  idNumber: '',
  currentPassword: '',
  password: '',
  confirmPassword: ''
})

const isSubmitting = ref(false)
const showPasswordFields = ref(false)
const errors = ref<Record<string, string>>({})

// Computed
const userInitials = computed(() => {
  return form.name.slice(0, 1).toUpperCase() || 'U'
})

// Validation schema
const ProfileSchema = z.object({
  name: z.string().min(1, '請輸入姓名'),
  email: z.string().email('請輸入有效的電子信箱'),
  phone: z.string().optional(),
  idNumber: z.string().optional().refine((val) => {
    if (!val) return true // 可選欄位
    return /^[A-Z][12]\d{8}$/.test(val)
  }, '請輸入正確的身分證格式 (例：A123456789)'),
})

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, '請輸入目前密碼'),
  password: z.string().min(6, '新密碼至少需要 6 個字元'),
  confirmPassword: z.string().min(1, '請確認新密碼'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "密碼確認不一致",
  path: ["confirmPassword"],
})

// Methods
const validateForm = () => {
  errors.value = {}

  try {
    // Validate profile fields
    ProfileSchema.parse({
      name: form.name,
      email: form.email,
      phone: form.phone,
      idNumber: form.idNumber
    })

    // Validate password fields if changing password
    if (showPasswordFields.value) {
      PasswordSchema.parse({
        currentPassword: form.currentPassword,
        password: form.password,
        confirmPassword: form.confirmPassword
      })
    }

    return true
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        if (err.path[0]) {
          errors.value[err.path[0] as string] = err.message
        }
      })
    }
    return false
  }
}


const handleSubmit = async () => {
  if (!validateForm()) return

  isSubmitting.value = true

  try {
    const payload: any = {
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      idNumber: form.idNumber || undefined
    }

    // Add password if changing
    if (showPasswordFields.value) {
      payload.currentPassword = form.currentPassword
      payload.password = form.password
    }

    await auth.updateMe(payload)
    
    emit('success')
    emit('close')
  } catch (error: any) {
    console.error('Profile update error:', error)
    // TODO: Show error toast
    alert('更新失敗：' + (error.message || '未知錯誤'))
  } finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  if (!isSubmitting.value) {
    emit('close')
  }
}

// Load current user data
const loadUserData = async () => {
  if (auth.user) {
    form.name = auth.user.name || ''
    form.email = auth.user.email || ''
    form.phone = auth.user.phone || ''

    // 處理身分證號 - 確保顯示解密後的資料供用戶編輯
    let idNumber = auth.user.idNumber || ''
    if (idNumber && idNumber.startsWith('gAAAAA')) {
      try {
        const { decryptNationalId } = await import('@/lib/encryption')
        idNumber = await decryptNationalId(idNumber)
        console.log('Decrypted national ID for editing:', idNumber)
      } catch (err) {
        console.warn('Failed to decrypt national ID for editing:', err)
        idNumber = '' // 解密失敗時清空，讓用戶重新輸入
      }
    }
    form.idNumber = idNumber
  }
}

// Lifecycle
onMounted(() => {
  console.log('EditProfileModal 組件已掛載')
  loadUserData()
})
</script>