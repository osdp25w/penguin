<!-- src/pages/VehicleManagement.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useVehicles }            from '@/stores/vehicles'
import { Dialog, DialogPanel }    from '@headlessui/vue'
import { Check, X, Plus, Pencil } from 'lucide-vue-next'
import type { Vehicle }           from '@/types'

const store    = useVehicles()

/* SoC badge 顏色（>50 綠、20–50 橘、其餘紅） */
const socColor = (n: number) =>
  n > 50 ? 'bg-emerald-500'
  : n > 20 ? 'bg-amber-500'
           : 'bg-rose-500'

/* 分頁邏輯 */
const disabledNext = computed(
  () => store.page * store.pageSize >= store.total || store.loading
)

onMounted(() => store.fetch())

/* Dialog 狀態 */
const showDlg  = ref(false)
const editing  = ref<Vehicle | null>(null)  // null = create
const tempV    = ref<Partial<Vehicle>>({
  name:'', motorId:'', batteryId:'', controllerId:'', mqttPort:1883
})

function openCreate() {
  editing.value = null
  Object.assign(tempV.value, {
    name: '', motorId:'', batteryId:'', controllerId:'', mqttPort:1883
  })
  showDlg.value = true
}

function openEdit(v: Vehicle) {
  editing.value = JSON.parse(JSON.stringify(v))
  showDlg.value = true
}

async function save() {
  try {
    if (editing.value) {
      await store.updateDevice(editing.value)
    } else {
      const newV: Vehicle = {
        id         : 'v_' + Date.now().toString(36),
        soc        : 100,
        lastSeen   : new Date().toISOString(),
        mqttOnline : false,
        ...tempV.value
      } as Vehicle
      await store.createVehicle(newV)
    }
    showDlg.value = false
  } catch (e: any) {
    alert(e.message || '操作失敗')
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h2 class="text-2xl font-bold">車輛管理</h2>
        <button class="btn-add flex items-center gap-1" @click="openCreate">
          <Plus class="w-4 h-4"/> 新增車輛
        </button>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn i-ph:arrow-clockwise-duotone"
                :disabled="store.loading"
                @click="store.fetch(store.page)">
          重新整理
        </button>
        <span v-if="store.loading" class="text-sm text-gray-400">Loading…</span>
      </div>
    </header>

    <!-- Table -->
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
          <tr v-for="v in store.items" :key="v.id"
              class="border-t border-white/5 hover:bg-brand-400/5 transition">
            <td class="px-4 py-3 font-mono">{{ v.id }}</td>
            <td class="px-4 py-3">{{ v.name }}</td>
            <td class="px-4 py-3 text-center">
              <span :class="['px-2 py-0.5 rounded text-white', socColor(v.soc)]">
                {{ v.soc }} %
              </span>
            </td>
            <td class="px-4 py-3 text-center font-mono">{{ v.motorId ?? '—' }}</td>
            <td class="px-4 py-3 text-center font-mono">{{ v.batteryId ?? '—' }}</td>
            <td class="px-4 py-3 text-center font-mono">{{ v.controllerId ?? '—' }}</td>
            <td class="px-4 py-3 text-center">
              <Check v-if="v.mqttOnline" class="w-4 h-4 text-emerald-400 inline"/>
              <X     v-else             class="w-4 h-4 text-rose-400 inline"/>
            </td>
            <td class="px-4 py-3 text-center font-mono">{{ v.mqttPort }}</td>
            <td class="px-4 py-3 text-right">
              <button class="btn text-xs flex items-center gap-1"
                      @click="openEdit(v)">
                <Pencil class="w-3 h-3"/> 編輯
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <footer class="flex items-center justify-end gap-4">
      <button class="btn i-ph:caret-left-duotone"
              :disabled="store.page===1 || store.loading"
              @click="store.fetch(store.page-1)"/>
      <span class="text-sm">Page <b>{{ store.page }}</b></span>
      <button class="btn i-ph:caret-right-duotone"
              :disabled="disabledNext"
              @click="store.fetch(store.page+1)"/>
    </footer>
    <p v-if="store.errMsg" class="text-rose-400">{{ store.errMsg }}</p>

    <!-- Dialog -->
    <Dialog :open="showDlg" @close="showDlg = false"
            class="fixed inset-0 grid place-items-center bg-black/40 z-50">
      <DialogPanel class="w-[28rem] space-y-6 rounded-xl bg-white p-6 text-gray-900">
        <h3 class="text-xl font-bold">
          {{ editing ? '編輯車輛資料' : '新增車輛' }}
        </h3>
        <div class="space-y-4">
          <!-- 名稱 -->
          <div class="flex items-center gap-3">
            <label class="w-28">名稱</label>
            <input v-if="editing" v-model="editing.name" class="input flex-1"/>
            <input v-else        v-model="tempV.name"    class="input flex-1" placeholder="輸入車輛名稱"/>
          </div>
          <!-- Motor ID -->
          <div class="flex items-center gap-3">
            <label class="w-28">Motor ID</label>
            <input v-if="editing" v-model="editing.motorId" class="input flex-1"/>
            <input v-else        v-model="tempV.motorId"    class="input flex-1"/>
          </div>
          <!-- Battery ID -->
          <div class="flex items-center gap-3">
            <label class="w-28">Battery ID</label>
            <input v-if="editing" v-model="editing.batteryId" class="input flex-1"/>
            <input v-else        v-model="tempV.batteryId"    class="input flex-1"/>
          </div>
          <!-- Controller ID -->
          <div class="flex items-center gap-3">
            <label class="w-28">Controller ID</label>
            <input v-if="editing" v-model="editing.controllerId" class="input flex-1"/>
            <input v-else        v-model="tempV.controllerId"    class="input flex-1"/>
          </div>
          <!-- MQTT Port -->
          <div class="flex items-center gap-3">
            <label class="w-28">MQTT Port</label>
            <input v-if="editing" type="number" min="1" max="65535"
                   v-model.number="editing.mqttPort"
                   class="input flex-1 text-right"/>
            <input v-else type="number" min="1" max="65535"
                   v-model.number="tempV.mqttPort"
                   class="input flex-1 text-right"/>
          </div>
        </div>
        <div class="flex justify-end gap-3">
          <button class="btn bg-gray-500 hover:bg-gray-400" @click="showDlg = false">
            取消
          </button>
          <button class="btn" @click="save">儲存</button>
        </div>
      </DialogPanel>
    </Dialog>
  </div>
</template>

<style scoped>
.card    { @apply bg-white/5 backdrop-blur-xl p-4; }
.btn     { @apply rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-500 disabled:opacity-60 transition; }
.btn-add { @apply rounded bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-500 transition; }
.input   { @apply bg-white/10 px-3 py-1.5 rounded border border-white/10 focus:outline-none; }
</style>
