<!-- src/pages/BatteryHealth.vue -->
<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useBatteries, useML } from '@/stores'

/* ───────────── 取資料 ───────────── */
const batStore = useBatteries()
const mlStore  = useML()

onMounted(async () => {
  await batStore.fetchAll()
  await mlStore.fetchBatteryRisk([], batStore.items)
})

/**
 * 將故障機率 (faultP) 併入電池清單
 * ▲ 依「同索引」對應，只是 demo 需求，正式專案應以 id 對映
 */
const rows = computed(() =>
  batStore.items.map((b, i) => ({
    ...b,
    faultP: mlStore.batteries[i]?.faultP ?? 0
  }))
)

/* ───────────── 長條圖 ───────────── */
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
use([BarChart, GridComponent, TooltipComponent, TitleComponent, CanvasRenderer])

const chartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: rows.value.map(r => `車 ${r.vehicleId}`),
    axisLabel: { rotate: 35 }
  },
  yAxis: { min: 0, max: 100, name: '%', splitLine: { show: false } },
  series: [
    {
      type: 'bar',
      data: rows.value.map(r => r.health ?? 0),
      barWidth: '60%',
      itemStyle: { borderRadius: [4, 4, 0, 0], color: '#4ade80' }
    }
  ],
  textStyle: { color: '#d1d5db', fontFamily: 'Inter' },
  backgroundColor: 'transparent'
}))
</script>

<template>
  <div class="space-y-6">
    <!-- ─── 標題列 ─────────────────────────────────────────── -->
    <header class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">電池健康 / 故障機率</h2>
      <button
        class="btn i-ph-arrow-clockwise text-sm"
        :disabled="batStore.isLoading || mlStore.loading"
        @click="async () => { await batStore.fetchAll(); await mlStore.fetchBatteryRisk([], batStore.items) }"
      >
        重新整理
      </button>
    </header>

    <!-- ─── 表格 ─────────────────────────────────────────── -->
    <div v-if="rows.length" class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-700 text-gray-200">
          <tr>
            <th class="px-3 py-2 text-left">車輛 ID</th>
            <th class="px-3 py-2 text-right">健康度 (%)</th>
            <th class="px-3 py-2 text-right">故障機率 (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in rows"
            :key="r.id"
            class="border-b border-gray-700"
          >
            <!-- 車輛 ID -->
            <td class="px-3 py-2">車 {{ r.vehicleId }}</td>

            <!-- 健康度 -->
            <td class="px-3 py-2 text-right">
              <span
                :class="[
                  (r.health ?? 0) >= 80
                    ? 'text-green-400'
                    : (r.health ?? 0) >= 60
                      ? 'text-yellow-400'
                      : 'text-rose-400'
                ]"
              >
                {{ r.health ?? 0 }}
              </span>
            </td>

            <!-- 故障機率 -->
            <td class="px-3 py-2 text-right">
              <span
                :class="[
                  r.faultP > 0.3
                    ? 'text-rose-400'
                    : r.faultP > 0.15
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                ]"
              >
                {{ (r.faultP * 100).toFixed(0) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ─── 健康度長條圖 ─────────────────────────────────── -->
    <VChart
      v-if="rows.length"
      :option="chartOption"
      autoresize
      class="h-72 w-full"
    />

    <!-- ─── 狀態訊息 ─────────────────────────────────────── -->
    <p v-if="batStore.isLoading || mlStore.loading" class="text-gray-600">
      Loading…
    </p>
    <p v-if="batStore.errMsg || mlStore.errMsg" class="text-rose-400">
      {{ batStore.errMsg || mlStore.errMsg }}
    </p>
  </div>
</template>

<style scoped>
.btn {
  @apply rounded bg-brand-600 px-4 py-1.5 text-white
         hover:bg-brand-500 disabled:opacity-60 transition;
}
</style>
