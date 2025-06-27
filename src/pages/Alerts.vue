<template>
  <div class="space-y-6">
    <!-- Header ---------------------------------------------------- -->
    <header class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">警報中心</h2>

      <div class="flex items-center gap-3">
        <!-- 手動抓取未關閉警報 -->
        <button class="btn" @click="store.fetchOpen">
          <i-uil:sync class="mr-1" /> 重新抓取
        </button>

        <!-- 即時串流開 / 關 -->
        <button
          class="btn"
          :class="store.isLive
            ? 'bg-rose-600 hover:bg-rose-500'
            : 'bg-emerald-600 hover:bg-emerald-500'"
          @click="toggleStream"
        >
          <i-uil:bolt class="mr-1" />
          {{ store.isLive ? '停止即時' : '啟動即時' }}
        </button>
      </div>
    </header>

    <!-- List ------------------------------------------------------- -->
    <div class="grid gap-4">
      <div
        v-for="a in store.list"
        :key="a.id"
        class="card flex items-center justify-between"
        :class="{
          'border-emerald-500/60': a.severity === 'info',
          'border-amber-500/60'  : a.severity === 'warning',
          'border-rose-500/60'   : a.severity === 'critical'
        }"
      >
        <div>
          <div class="font-medium">
            <span
              class="px-2 py-0.5 rounded text-xs text-white mr-2"
              :class="sevColor(a.severity)"
            >
              {{ sevLabel(a.severity) }}
            </span>
            <b>{{ a.message }}</b>
          </div>
          <div class="text-sm text-gray-500">
            車號：{{ a.vehicleId }} ｜ {{ a.ts }}
          </div>
        </div>

        <!-- 確認（關閉）警報 -->
        <button
          class="btn bg-gray-700 hover:bg-gray-600"
          @click="store.acknowledge(a.id)"
        >
          確認
        </button>
      </div>
    </div>

    <p v-if="store.errMsg" class="text-rose-500">{{ store.errMsg }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAlerts } from '@/stores'

const store = useAlerts()

/* 首次進頁面就抓取未關閉警報 */
onMounted(() => store.fetchOpen())

/* 即時串流開 / 關（demo 無真正 stop，這裡用 reload） */
const toggleStream = () => {
  if (store.isLive) location.reload()
  else store.startStream()
}

/* 中文標籤 -------------------------------------------------------- */
const sevLabel = (s: string) =>
  s === 'info'       ? '資訊'
  : s === 'warning'  ? '警告'
  : s === 'critical' ? '危急'
  : s

/* 顏色 ------------------------------------------------------------ */
const sevColor = (s: string) =>
  s === 'info'      ? 'bg-emerald-500'
  : s === 'warning' ? 'bg-amber-500'
  : 'bg-rose-500'
</script>
