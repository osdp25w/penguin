<template>
  <div class="flex h-screen bg-gray-100 text-gray-900">
    <!-- Sidebar ----------------------------------------------------- -->
    <aside class="w-64 bg-white shadow-md">
      <h1 class="text-2xl font-bold p-4">運動資料管理平台 🚲</h1>

      <!-- text-base → 字體較大；text-gray-700 為預設色 ------------------>
      <nav class="space-y-1 px-2 text-base text-gray-700">
        <RouterLink
          v-for="item in menu"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 rounded-md px-3 py-2
                 hover:bg-indigo-50 hover:text-indigo-700
                 visited:text-gray-700"
          :class="{
            'bg-indigo-100 text-indigo-700 font-medium': $route.path === item.to
          }"
        >
          <component :is="item.icon" class="w-4 h-4" />
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <!-- Main -------------------------------------------------------- -->
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
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { BarChart, Map, AlertTriangle, Table, Home } from 'lucide-vue-next'

const menu = [
  { to: '/',         label: '總覽',     icon: Home },
  { to: '/map',      label: '即時地圖', icon: Map },
  { to: '/vehicles', label: '車輛清單', icon: Table },
  { to: '/battery',  label: '電池健康', icon: BarChart },
  { to: '/alerts',   label: '警報中心', icon: AlertTriangle }
]

const route = useRoute()
const currentTitle = computed(() => menu.find(m => m.to === route.path)?.label ?? '')
</script>

<style scoped>
/* 其他細節可在此微調 */
</style>
