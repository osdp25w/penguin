<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="handleClose"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900">
            個人資料
          </h3>
          <Button variant="ghost" size="sm" @click="handleClose">
            <i class="i-ph-x w-4 h-4"></i>
          </Button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">

          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              姓名 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="請輸入姓名"
              class="input-base"
              :class="{ 'border-red-300': errors.name }"
            >
            <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              電子信箱 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.email"
              type="email"
              placeholder="請輸入電子信箱"
              class="input-base"
              :class="{ 'border-red-300': errors.email }"
            >
            <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              電話號碼
            </label>
            <input
              v-model="form.phone"
              type="tel"
              placeholder="請輸入電話號碼"
              class="input-base"
              :class="{ 'border-red-300': errors.phone }"
            >
            <p v-if="errors.phone" class="mt-1 text-sm text-red-600">{{ errors.phone }}</p>
          </div>

          <!-- ID Number -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              身分證號碼
            </label>
            <input
              v-model="form.idNumber"
              type="text"
              placeholder="請輸入身分證號碼"
              class="input-base"
              :class="{ 'border-red-300': errors.idNumber }"
              maxlength="10"
            >
            <p v-if="errors.idNumber" class="mt-1 text-sm text-red-600">{{ errors.idNumber }}</p>
          </div>

          <!-- Password Section -->
          <div class="pt-4 border-t border-gray-200">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium text-gray-900">更改密碼</h4>
              <button
                type="button"
                class="text-sm text-brand-primary hover:text-brand-secondary"
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
                  class="input-base"
                  :class="{ 'border-red-300': errors.currentPassword }"
                >
                <p v-if="errors.currentPassword" class="mt-1 text-sm text-red-600">{{ errors.currentPassword }}</p>
              </div>

              <!-- New Password -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  新密碼 <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.password"
                  type="password"
                  placeholder="請輸入新密碼"
                  class="input-base"
                  :class="{ 'border-red-300': errors.password }"
                >
                <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
              </div>

              <!-- Confirm Password -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  確認新密碼 <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="請再次輸入新密碼"
                  class="input-base"
                  :class="{ 'border-red-300': errors.confirmPassword }"
                >
                <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600">{{ errors.confirmPassword }}</p>
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
const loadUserData = () => {
  if (auth.user) {
    form.name = auth.user.name || ''
    form.email = auth.user.email || ''
    form.phone = auth.user.phone || ''
    form.idNumber = auth.user.idNumber || ''
  }
}

// Lifecycle
onMounted(() => {
  console.log('EditProfileModal 組件已掛載')
  loadUserData()
})
</script>