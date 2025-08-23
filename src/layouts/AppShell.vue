<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Left side - Logo & Nav -->
          <div class="flex items-center gap-8">
            <div class="flex items-center gap-3">
              <!-- Mobile menu button -->
              <Button
                variant="ghost"
                size="sm"
                class="lg:hidden"
                @click="sidebarOpen = !sidebarOpen"
              >
                <i class="i-ph:list w-5 h-5"></i>
              </Button>
              
              <!-- Logo -->
              <router-link 
                to="/"
                class="flex items-center gap-2 text-xl font-bold text-brand-primary"
              >
                <i class="i-ph:bicycle w-8 h-8"></i>
                嘉大數據平台
              </router-link>
            </div>
            
            <!-- Desktop Navigation -->
            <nav class="hidden lg:flex items-center gap-1">
              <router-link
                v-for="item in navigation"
                :key="item.name"
                :to="item.href"
                class="px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                :class="isActiveRoute(item.href) 
                  ? 'bg-brand-primary text-white' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'"
              >
                <component :is="item.icon" class="w-4 h-4 mr-2 inline-block" />
                {{ item.name }}
              </router-link>
            </nav>
          </div>
          
          <!-- Right side - Search & User -->
          <div class="flex items-center gap-4">
            <!-- Search -->
            <div class="hidden md:block">
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="搜尋..."
                  class="w-64 px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                  @keyup.enter="handleSearch"
                >
                <i class="i-ph:magnifying-glass absolute left-3 top-2.5 w-4 h-4 text-gray-400"></i>
              </div>
            </div>
            
            <!-- Notifications -->
            <Button variant="ghost" size="sm" class="relative">
              <i class="i-ph:bell w-5 h-5"></i>
              <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            
            <!-- User Menu -->
            <div class="relative" ref="userMenuRef">
              <Button
                variant="ghost"
                size="sm"
                class="flex items-center gap-2"
                @click="userMenuOpen = !userMenuOpen"
              >
                <div class="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {{ userInitials }}
                </div>
                <span class="hidden sm:block text-sm font-medium text-gray-700">
                  {{ currentUser.name }}
                </span>
                <i class="i-ph:caret-down w-4 h-4 text-gray-400"></i>
              </Button>
              
              <!-- User Dropdown -->
              <Transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <div
                  v-if="userMenuOpen"
                  class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                >
                  <a 
                    v-for="item in userMenuItems"
                    :key="item.name"
                    :href="item.href"
                    class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                    @click="userMenuOpen = false"
                  >
                    <component :is="item.icon" class="w-4 h-4" />
                    {{ item.name }}
                  </a>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <div class="flex">
      <!-- Sidebar -->
      <aside
        :class="[
          'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        ]"
      >
        <div class="flex flex-col h-full pt-16 lg:pt-0">
          <!-- Sidebar Navigation -->
          <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <div class="lg:hidden mb-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-900">選單</span>
                <Button
                  variant="ghost"
                  size="sm"
                  @click="sidebarOpen = false"
                >
                  <i class="i-ph:x w-4 h-4"></i>
                </Button>
              </div>
            </div>
            
            <router-link
              v-for="item in navigation"
              :key="item.name"
              :to="item.href"
              class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
              :class="isActiveRoute(item.href) 
                ? 'bg-brand-primary text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'"
              @click="sidebarOpen = false"
            >
              <component :is="item.icon" class="w-5 h-5" />
              {{ item.name }}
            </router-link>
          </nav>
          
          <!-- Sidebar Footer -->
          <div class="p-4 border-t border-gray-200">
            <div class="text-xs text-gray-500 text-center">
              © 2024 嘉大數據平台
            </div>
          </div>
        </div>
      </aside>
      
      <!-- Sidebar Overlay -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
        @click="sidebarOpen = false"
      ></div>
      
      <!-- Main Content -->
      <main class="flex-1 min-w-0">
        <div class="p-4 lg:p-8">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Button } from '@/design/components'

const route = useRoute()
const sidebarOpen = ref(false)
const userMenuOpen = ref(false)
const searchQuery = ref('')
const userMenuRef = ref<HTMLElement>()

// Mock user data - 實際專案中應從 store 獲取
const currentUser = {
  name: '管理員',
  email: 'admin@example.com',
  role: 'admin'
}

const userInitials = computed(() => {
  return currentUser.name.slice(0, 1).toUpperCase()
})

const navigation = [
  { name: '系統總覽', href: '/', icon: 'i-ph:house' },
  { name: '場域地圖', href: '/sites', icon: 'i-ph:map-pin' },
  { name: '車輛清單', href: '/vehicles', icon: 'i-ph:bicycle' },
  { name: '警報中心', href: '/alerts', icon: 'i-ph:warning-circle' },
  { name: 'ML 預測', href: '/ml', icon: 'i-ph:chart-line-up' },
  { name: '帳號管理', href: '/admin/users', icon: 'i-ph:users' },
]

const userMenuItems = [
  { name: '個人設定', href: '/profile', icon: 'i-ph:user' },
  { name: '系統設定', href: '/settings', icon: 'i-ph:gear' },
  { name: '說明文件', href: '/help', icon: 'i-ph:question' },
  { name: '登出', href: '/logout', icon: 'i-ph:sign-out' },
]

const isActiveRoute = (href: string) => {
  if (href === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(href)
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    console.log('搜尋:', searchQuery.value)
    // 實際搜尋邏輯
  }
}

// Close user menu when clicking outside
const handleClickOutside = (event: Event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    userMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Close sidebar when route changes on mobile
// watch(route, () => {
//   sidebarOpen.value = false
// })
</script>