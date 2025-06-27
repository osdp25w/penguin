<template>
  <div class="flex h-screen bg-gray-100 text-gray-900">
    <!-- ============  Sidebar ============ -->
    <aside class="w-64 bg-white shadow-md flex flex-col">
      <h1 class="text-2xl font-bold p-4 border-b border-black/5">
        運動資料管理平台&nbsp;🚲
      </h1>

      <!-- Navigation -->
      <nav class="flex-1 space-y-1 px-2 py-4 text-base text-gray-700">
        <RouterLink
          v-for="item in sideMenu"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 rounded-md px-3 py-2
                 hover:bg-indigo-50 hover:text-indigo-700"
          :class="{
            'bg-indigo-100 text-indigo-700 font-medium':
              $route.path.startsWith(item.to)
          }"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- Logout (stick bottom) -->
      <button
        @click="logout"
        class="m-2 flex items-center gap-2 rounded-md px-3 py-2
               text-sm text-red-600 hover:bg-red-50 hover:text-red-700
               transition-colors"
      >
        <i class="i-ph:sign-out-bold h-4 w-4" /> 登出
      </button>
    </aside>

    <!-- ============  Main ============ -->
    <section class="flex-1 overflow-y-auto">
      <header class="h-14 flex items-center bg-white px-6 shadow">
        <h2 class="text-lg font-semibold">{{ currentTitle }}</h2>
      </header>

      <main class="p-6">
        <RouterView />
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import {
  Home, Map, Table, BarChart, AlertTriangle, UserCog, Lightbulb
} from 'lucide-vue-next'
import { useAuth } from '@/stores/auth'

/* ----- 基本選單 (需登入) ------------------------------------ */
const baseMenu = [
  { to: '/',          label: '總覽',     icon: Home },
  { to: '/map',       label: '即時地圖', icon: Map },
  { to: '/vehicles',  label: '車輛清單', icon: Table },
  { to: '/battery',   label: '電池健康', icon: BarChart },
  { to: '/alerts',    label: '警報中心', icon: AlertTriangle }
]

/* ----- ML 綜合單頁 ----------------------------------------- */
const mlMenu = [
  { to: '/ml', label: 'ML 預測', icon: Lightbulb }
]

/* ----- Admin 專屬 ----------------------------------------- */
const adminMenu = [
  { to: '/admin/users', label: '帳號管理', icon: UserCog }
]

/* ----- 動態組合側邊欄 ------------------------------------- */
const auth = useAuth()
const sideMenu = computed(() => {
  const items = [...baseMenu, ...mlMenu]
  const role  = auth.user?.roleId ?? sessionStorage.getItem('role')
  if (role === 'admin') items.push(...adminMenu)
  return items
})

/* ----- 目前頁面標題 --------------------------------------- */
const route        = useRoute()
const currentTitle = computed(
  () => sideMenu.value.find(m => route.path.startsWith(m.to))?.label ?? ''
)

/* ----- 登出 ---------------------------------------------- */
const router = useRouter()
function logout () {
  auth.logout()
  router.replace('/login')
}
</script>
