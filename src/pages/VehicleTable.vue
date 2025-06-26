<template>
  <div class="space-y-4">
    <!-- Toolbar -------------------------------------------------------- -->
    <header class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">車輛清單</h2>

      <div class="flex items-center gap-2">
        <button
          class="btn i-ph:arrow-clockwise-duotone text-sm"
          @click="store.fetch(store.page)"
          :disabled="store.isLoading"
        >
          重新整理
        </button>
        <span v-if="store.isLoading" class="text-sm text-gray-400">Loading…</span>
      </div>
    </header>

    <!-- 表格 ----------------------------------------------------------- -->
    <div class="overflow-auto rounded-xl border border-white/10 shadow card">
      <table class="min-w-full text-left text-sm leading-loose">
        <thead class="bg-white/5 text-brand-300">
          <tr>
            <th class="px-4 py-3 w-[140px]">ID</th>
            <th class="px-4 py-3">名稱</th>
            <th class="px-4 py-3 w-[120px] text-center">SoC</th>
            <th class="px-4 py-3 w-[180px]">最後上線</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="v in store.list"
            :key="v.id"
            class="border-t border-white/5 hover:bg-brand-400/5 transition"
          >
            <td class="px-4 py-3 font-mono">{{ v.id }}</td>
            <td class="px-4 py-3">{{ v.name }}</td>
            <td class="px-4 py-3 text-center">
              <span
                class="px-2 py-0.5 rounded text-white font-medium"
                :class="socColor(v.soc)"
              >
                {{ v.soc }} %
              </span>
            </td>
            <td class="px-4 py-3">{{ v.lastSeen }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination ----------------------------------------------------- -->
    <footer class="flex items-center justify-end gap-4">
      <button
        class="btn i-ph:caret-left-duotone"
        :disabled="store.page === 1 || store.isLoading"
        @click="store.fetch(store.page - 1)"
      />
      <span class="text-sm">
        Page <b>{{ store.page }}</b>
      </span>
      <button
        class="btn i-ph:caret-right-duotone"
        :disabled="disabledNext"
        @click="store.fetch(store.page + 1)"
      />
    </footer>

    <p v-if="store.errMsg" class="text-rose-400">{{ store.errMsg }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useVehicles } from '@/stores'

const store = useVehicles()

/* SoC > 50% 綠、20–50 橘、<20 紅 */
const socColor = (soc: number) => {
  return soc > 50
    ? 'bg-emerald-500'
    : soc > 20
      ? 'bg-amber-500'
      : 'bg-rose-500'
}

const disabledNext = computed(() =>
  store.page * store.pageSize >= store.total || store.isLoading)

/* 進頁自動撈第一頁 */
onMounted(() => store.fetch())
</script>
