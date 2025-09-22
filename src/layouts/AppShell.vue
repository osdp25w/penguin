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
                aria-label="開啟側邊選單"
                @click="sidebarOpen = !sidebarOpen"
              >
                <i class="i-ph-list w-5 h-5" />
              </Button>
              
              <!-- Logo -->
              <router-link 
                to="/"
                class="flex items-center gap-2 text-xl font-bold text-brand-primary"
              >
                <i class="i-ph-bicycle w-8 h-8" />
                嘉大數據平台
              </router-link>
            </div>
            
            <!-- Breadcrumb -->
            <nav class="hidden lg:flex items-center gap-2 text-sm">
              <i class="i-ph-house w-4 h-4 text-gray-600"></i>
              <span class="text-gray-600">/</span>
              <span class="font-medium text-gray-900">{{ currentPageTitle }}</span>
            </nav>
          </div>
          
          <!-- Right side - Connection Status & User Menu -->
          <div class="flex items-center gap-3">
            <!-- WebSocket Connection Status -->
            <div v-if="wsConnected !== null" class="flex items-center gap-2 px-3 py-1.5 rounded-md border" :class="wsStatusClass">
              <div class="w-2 h-2 rounded-full animate-pulse" :class="wsIndicatorClass"></div>
              <span class="text-xs font-medium">{{ wsStatusText }}</span>
            </div>

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
                <i class="i-ph-caret-down w-4 h-4 text-gray-600" />
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
                  <button 
                    v-for="item in userMenuItems"
                    :key="item.name"
                    class="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                    @click="handleUserMenuAction(item)"
                  >
                    <component :is="item.icon" class="w-4 h-4" />
                    {{ item.name }}
                  </button>
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
                  <i class="i-ph-x w-4 h-4" />
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
            <div class="text-xs text-gray-700 text-center">
              © 2025 嘉大數據平台
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
    
    <!-- Modals -->
    <EditProfileModal 
      v-if="showProfileModal" 
      @close="showProfileModal = false"
      @success="handleProfileSuccess" 
    />
    <!-- Toasts -->
    <ToastHost />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/design/components'
import { useAuth } from '@/stores/auth'
import EditProfileModal from '@/components/profile/EditProfileModal.vue'
import ToastHost from '@/components/ToastHost.vue'
import { ensureKoalaWsConnected, setConnectionStatusCallback } from '@/services/koala_ws'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const sidebarOpen = ref(false)
const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement>()
const showProfileModal = ref(false)

// WebSocket 連線狀態
const wsConnected = ref<boolean | null>(null)
const wsStatusText = computed(() => {
  if (wsConnected.value === null) return '未連線'
  return wsConnected.value ? '已連線' : '斷線'
})

const wsStatusClass = computed(() => {
  if (wsConnected.value === null) return 'border-gray-200 bg-gray-50 text-gray-600'
  return wsConnected.value
    ? 'border-green-200 bg-green-50 text-green-700'
    : 'border-amber-200 bg-amber-50 text-amber-700'
})

const wsIndicatorClass = computed(() => {
  if (wsConnected.value === null) return 'bg-gray-400'
  return wsConnected.value ? 'bg-green-500' : 'bg-amber-500'
})

// 當前使用者資訊
const currentUser = computed(() => auth.user || {
  name: '管理員',
  email: 'admin@example.com',
  role: 'admin'
})

const userInitials = computed(() => {
  return currentUser.value.name?.slice(0, 1).toUpperCase() || 'U'
})

const currentPageTitle = computed(() => {
  return route.meta.title as string || '總覽'
})

const baseNavigation = [
  { name: '總覽', href: '/', icon: 'i-ph-house' },
  { name: '場域地圖', href: '/sites', icon: 'i-ph-map-pin' },
  { name: '警報中心', href: '/alerts', icon: 'i-ph-warning-circle' }
]

const memberNavigation = [
  { name: '場域地圖', href: '/sites', icon: 'i-ph-map-pin' },
  { name: '我的租借', href: '/my-rentals', icon: 'i-ph-clock-counter-clockwise' }
]

const privilegedNavigation = [
  { name: '總覽', href: '/', icon: 'i-ph-house' },
  { name: '場域地圖', href: '/sites', icon: 'i-ph-map-pin' },
  { name: '租借管理', href: '/admin/rentals', icon: 'i-ph-clipboard-text' },
  { name: '車輛清單', href: '/vehicles', icon: 'i-ph-bicycle' },
  { name: '遙測設備', href: '/admin/telemetry', icon: 'i-ph-wifi-high' },
  // { name: '場域管理', href: '/admin/sites', icon: 'i-ph-map-pin-line' }, // 暫時隱藏
  { name: '帳號管理', href: '/admin/users', icon: 'i-ph-users' },
  { name: '警報中心', href: '/alerts', icon: 'i-ph-warning-circle' },
  { name: 'ML 預測', href: '/ml', icon: 'i-ph-chart-line-up' }
]

// 依角色過濾：member 僅限部分選單，admin/staff 顯示完整管理功能
const navigation = computed(() => {
  const role = auth.user?.roleId || sessionStorage.getItem('penguin.role') || localStorage.getItem('penguin.role')

  console.log('[AppShell] Navigation filtering - DETAILED DEBUG:', {
    role,
    userRole: auth.user?.roleId,
    sessionRole: sessionStorage.getItem('penguin.role'),
    localRole: localStorage.getItem('penguin.role'),
    authUser: auth.user,
    isLogin: auth.isLogin
  })

  // member, visitor, tourist 都只能看到場域地圖和我的租借
  if (role === 'member' || role === 'visitor' || role === 'tourist') {
    console.log('[AppShell] Using member navigation for role:', role)
    return memberNavigation
  }

  const isPrivileged = role === 'admin' || role === 'staff'
  const nav = isPrivileged ? privilegedNavigation : baseNavigation
  console.log('[AppShell] Navigation filtered result:', {
    role,
    isPrivileged,
    selectedNav: isPrivileged ? 'privileged' : 'base',
    items: nav.map(i => ({ name: i.name, href: i.href }))
  })
  return nav
})

const userMenuItems = [
  { name: '個人資料', action: 'profile', icon: 'i-ph-user' },
  { name: '登出', action: 'logout', icon: 'i-ph-sign-out' },
]

const isActiveRoute = (href: string) => {
  if (href === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(href)
}

// 當 member/tourist 訪問禁止頁面時重導向到場域地圖
const checkAccessAndRedirect = () => {
  const role = auth.user?.roleId
  if (role === 'member' || role === 'visitor' || role === 'tourist') {
    const currentPath = route.path
    const allowedPaths = ['/sites', '/my-rentals', '/login', '/register']
    const isAllowed = allowedPaths.some(path => currentPath.startsWith(path))

    if (!isAllowed) {
      console.log('[AppShell] Redirecting unauthorized member/tourist from:', currentPath)
      router.push('/sites')
    }
  }
}


const handleUserMenuAction = (item: any) => {
  console.log('點擊用戶選單項目:', item)
  userMenuOpen.value = false
  
  if (item.action === 'profile') {
    console.log('打開個人資料模態框')
    showProfileModal.value = true
    console.log('showProfileModal 狀態:', showProfileModal.value)
  } else if (item.action === 'logout') {
    auth.logout()
    router.push('/login')
  } else if (item.href) {
    router.push(item.href)
  }
}

const handleProfileSuccess = () => {
  // TODO: Show success toast
  console.log('個人資料更新成功')
}

// Close user menu when clicking outside
const handleClickOutside = (event: Event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    userMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)

  // 檢查權限並重導向
  checkAccessAndRedirect()

  // Set up WebSocket connection status callback
  setConnectionStatusCallback((connected: boolean) => {
    wsConnected.value = connected
  })
})

watch(() => auth.user?.roleId || sessionStorage.getItem('penguin.role') || localStorage.getItem('penguin.role'), (role, prev) => {
  if (role && role !== prev) {
    console.log('[AppShell] Role changed, evaluating WS connection:', { role, prev })
    if (role === 'admin' || role === 'staff' || role === 'member') {
      ensureKoalaWsConnected().catch((error) => {
        console.error('[AppShell] WebSocket connection failed for role:', role, error)
      })
    } else {
      wsConnected.value = null
    }
  }
}, { immediate: true })

watch(() => auth.isLogin, (loggedIn) => {
  if (loggedIn) {
    const role = auth.user?.roleId || sessionStorage.getItem('penguin.role') || localStorage.getItem('penguin.role')
    if (role === 'admin' || role === 'staff' || role === 'member') {
      ensureKoalaWsConnected().catch((error) => {
        console.error('[AppShell] WebSocket connection failed (login watch):', error)
      })
    }
  } else {
    wsConnected.value = null
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Close sidebar when route changes on mobile
// watch(route, () => {
//   sidebarOpen.value = false
// })
</script>

<style scoped>
</style>
