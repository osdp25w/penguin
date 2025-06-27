<!-- src/layouts/AppLayout.vue -->
<template>
  <div class="flex h-screen bg-gray-100 text-gray-900">
    <!-- ============== Sidebar ==================================== -->
    <aside class="w-64 bg-white shadow-md flex flex-col">
      <!-- Brand / title -->
      <h1 class="text-2xl font-bold p-4 border-b border-black/5">
        運動資料管理平台 🚲
      </h1>

      <!-- 主選單 -->
      <nav class="flex-1 space-y-1 px-2 py-4 text-base text-gray-700">
        <RouterLink
          v-for="item in menu"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 rounded-md px-3 py-2
                 hover:bg-indigo-50 hover:text-indigo-700"
          :class="{
            'bg-indigo-100 text-indigo-700 font-medium':
              $route.path === item.to
          }"
        >
          <component :is="item.icon" class="w-4 h-4" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- 登出：always stick bottom -->
      <button
        @click="logout"
        class="m-2 flex items-center gap-2 rounded-md px-3 py-2
               text-sm text-red-600 hover:bg-red-50 hover:text-red-700
               transition-colors"
      >
        <i class="i-ph:sign-out-bold w-4 h-4" /> 登出
      </button>
    </aside>

    <!-- ============== Main ======================================= -->
    <section class="flex-1 overflow-y-auto">
      <header class="h-14 flex items-center justify-between px-6 bg-white shadow">
        <h2 class="text-lg font-semibold capitalize">{{ currentTitle }}</h2>
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
import { BarChart, Map, AlertTriangle, Table, Home } from 'lucide-vue-next'
import { useAuth } from '@/stores/auth'

/* --------- Menu items ------------------------------------------- */
const menu = [
  { to: '/',         label: '總覽',     icon: Home },
  { to: '/map',      label: '即時地圖', icon: Map },
  { to: '/vehicles', label: '車輛清單', icon: Table },
  { to: '/battery',  label: '電池健康', icon: BarChart },
  { to: '/alerts',   label: '警報中心', icon: AlertTriangle }
]

/* --------- Current page title ----------------------------------- */
const route        = useRoute()
const currentTitle = computed(
  () => menu.find(m => m.to === route.path)?.label ?? ''
)

/* --------- Logout handler --------------------------------------- */
const auth   = useAuth()
const router = useRouter()
function logout () {
  auth.logout()
  router.replace('/login')
}
</script>

<style scoped>
/* 可在此加細部微調，如自定 hover 色、字重等 */
</style>
