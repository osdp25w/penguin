<!-- src/pages/VehicleManagement.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useVehicles }              from '@/stores'
import { Dialog, DialogPanel }      from '@headlessui/vue'
import { Check, X }                 from 'lucide-vue-next'
import type { Vehicle }             from '@/types'

/* ───────────── Pinia store ───────────── */
const store = useVehicles()

/* SoC badge 色碼 */
const socColor = (n: number) =>
  n > 50 ? 'bg-emerald-500' : n > 20 ? 'bg-amber-500' : 'bg-rose-500'

/* 下一頁是否可點 */
const disabledNext = computed(
  () => store.page * store.pageSize >= store.total || store.loading
)

/* 首次進頁撈第一頁 */
onMounted(() => store.fetch())

/* ───────────── 編輯 Dialog ───────────── */
const showDlg  = ref(false)
const editing  = ref<Vehicle | null>(null)

function openEdit(v: Vehicle) {
  editing.value = JSON.parse(JSON.stringify(v))  // 深拷貝
  showDlg.value = true
}

async function saveEdit() {
  if (!editing.value) return
  try {
    await store.updateDevice(editing.value)      // 請在 Pinia 實作
    showDlg.value = false
  } catch (e: any) {
    alert(e.message ?? '更新失敗')
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -------------------------------------------------------- -->
    <header class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">車輛管理</h2>

      <div class="flex items-center gap-2">
        <button
          class="btn i-ph:arrow-clockwise-duotone"
          :disabled="store.loading"
          @click="store.fetch(store.page)"
        >
          重新整理
        </button>
        <span v-if="store.loading" class="text-sm text-gray-400">Loading…</span>
      </div>
    </header>

    <!-- Table ---------------------------------------------------------- -->
    <div class="card overflow-auto rounded-xl border border-white/10 shadow">
      <table class="min-w-full text-sm leading-loose">
        <thead class="bg-white/5 text-brand-300">
          <tr>
            <th class="px-4 py-3 w-[120px]">ID</th>
            <th class="px-4 py-3">名稱</th>
            <th class="px-4 py-3 w-[90px] text-center">SoC</th>

            <th class="px-4 py-3 w-[120px] text-center">Motor</th>
            <th class="px-4 py-3 w-[120px] text-center">Battery</th>
            <th class="px-4 py-3 w-[120px] text-center">Controller</th>

            <th class="px-4 py-3 w-[100px] text-center">MQTT</th>
            <th class="px-4 py-3 w-[100px] text-center">Port</th>
            <th class="px-4 py-3 w-[80px]"></th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="v in store.items"
            :key="v.id"
            class="border-t border-white/5 hover:bg-brand-400/5 transition"
          >
            <!-- 基本資訊 -->
            <td class="px-4 py-3 font-mono">{{ v.id }}</td>
            <td class="px-4 py-3">{{ v.name }}</td>
            <td class="px-4 py-3 text-center">
              <span
                :class="['px-2 py-0.5 rounded text-white', socColor(v.soc)]"
              >
                {{ v.soc }} %
              </span>
            </td>

            <!-- 裝置配對 -->
            <td class="px-4 py-3 text-center font-mono">{{ v.motorId ?? '—' }}</td>
            <td class="px-4 py-3 text-center font-mono">{{ v.batteryId ?? '—' }}</td>
            <td class="px-4 py-3 text-center font-mono">{{ v.controllerId ?? '—' }}</td>

            <!-- MQTT -->
            <td class="px-4 py-3 text-center">
              <Check v-if="v.mqttOnline" class="w-4 h-4 text-emerald-400 inline" />
              <X v-else class="w-4 h-4 text-rose-400 inline" />
            </td>
            <td class="px-4 py-3 text-center font-mono">{{ v.mqttPort }}</td>

            <!-- Action -->
            <td class="px-4 py-3 text-right">
              <button class="btn text-xs" @click="openEdit(v)">編輯</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination ----------------------------------------------------- -->
    <footer class="flex items-center justify-end gap-4">
      <button
        class="btn i-ph:caret-left-duotone"
        :disabled="store.page === 1 || store.loading"
        @click="store.fetch(store.page - 1)"
      />
      <span class="text-sm">Page <b>{{ store.page }}</b></span>
      <button
        class="btn i-ph:caret-right-duotone"
        :disabled="disabledNext"
        @click="store.fetch(store.page + 1)"
      />
    </footer>

    <p v-if="store.errMsg" class="text-rose-400">{{ store.errMsg }}</p>

    <!-- Dialog --------------------------------------------------------- -->
    <Dialog
      :open="showDlg"
      @close="showDlg = false"
      class="fixed inset-0 grid place-items-center bg-black/40 z-50"
    >
      <!-- 只有 editing 準備好才渲染內容 -->
      <DialogPanel
        v-if="editing"
        class="w-[28rem] space-y-6 rounded-xl bg-white p-6 text-gray-900"
      >
        <h3 class="text-xl font-bold">編輯裝置配對 & MQTT</h3>

        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <label class="w-28">Motor ID</label>
            <input v-model="editing.motorId" class="input flex-1" />
          </div>
          <div class="flex items-center gap-3">
            <label class="w-28">Battery ID</label>
            <input v-model="editing.batteryId" class="input flex-1" />
          </div>
          <div class="flex items-center gap-3">
            <label class="w-28">Controller ID</label>
            <input v-model="editing.controllerId" class="input flex-1" />
          </div>
          <div class="flex items-center gap-3">
            <label class="w-28">MQTT Port</label>
            <input
              v-model.number="editing.mqttPort"
              type="number"
              min="1"
              max="65535"
              class="input flex-1 text-right"
            />
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button
            class="btn bg-gray-500 hover:bg-gray-400"
            @click="showDlg = false"
          >
            取消
          </button>
          <button class="btn" @click="saveEdit">儲存</button>
        </div>
      </DialogPanel>
    </Dialog>
  </div>
</template>

<style scoped>
.card  { @apply bg-white/5 backdrop-blur-xl p-4; }
.btn   { @apply rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-500 disabled:opacity-60 transition; }
.input { @apply bg-white/10 px-3 py-1.5 rounded border border-white/10 focus:outline-none; }
</style>
