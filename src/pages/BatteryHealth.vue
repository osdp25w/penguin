<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useBatteries }        from '@/stores'

/* ── ECharts 載入 ─────────────────────────────────────────── */
import { use }                 from 'echarts/core'
import { BarChart }            from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent
} from 'echarts/components'
import { CanvasRenderer }      from 'echarts/renderers'
import VChart                  from 'vue-echarts'

/* 一次註冊需要的組件 */
use([BarChart, GridComponent, TooltipComponent, TitleComponent, CanvasRenderer])

/* ── Pinia store ─────────────────────────────────────────── */
const store = useBatteries()
onMounted(() => store.fetchAll())

/* ── ECharts option ──────────────────────────────────────── */
const chartOption = computed(() => {
  const labels = store.items.map(b => `車 ${b.vehicleId}`)
  const health = store.items.map(b => b.health ?? 0)   // ⬅︎ fallback 0

  return {
    tooltip : { trigger: 'axis' },
    xAxis   : {
      type     : 'category',
      data     : labels,
      axisLabel: { rotate: 35 }
    },
    yAxis   : {
      max       : 100,
      min       : 0,
      name      : '%',
      splitLine : { show: false }
    },
    series  : [{
      type      : 'bar',
      data      : health,
      barWidth  : '60%',
      itemStyle : {
        borderRadius: [4, 4, 0, 0],
        color       : '#4ade80'
      }
    }],
    textStyle      : { color: '#d1d5db', fontFamily: 'Inter' },
    backgroundColor: 'transparent'
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- ── 標題列 ───────────────────────────────────────────── -->
    <header class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">電池健康狀態</h2>

      <button
        class="btn i-ph:arrow-clockwise-duotone text-sm"
        @click="store.fetchAll"
        :disabled="store.isLoading"
      >
        重新整理
      </button>
    </header>

    <!-- ── 表格（簡易版）──────────────────────────────────────── -->
    <div v-if="store.items.length" class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-700 text-gray-200">
          <tr>
            <th class="px-3 py-2 text-left">車輛 ID</th>
            <th class="px-3 py-2 text-right">健康度 (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="b in store.items"
            :key="b.id"
            class="border-b border-gray-700"
          >
            <td class="px-3 py-2">車 {{ b.vehicleId }}</td>
            <td class="px-3 py-2 text-right">
              <span
                :class="[
                  (b.health ?? 0) >= 80 ? 'text-green-400' :
                  (b.health ?? 0) >= 60 ? 'text-yellow-400' :
                                          'text-rose-400'
                ]"
              >
                {{ b.health ?? 0 }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── 長條圖 ────────────────────────────────────────────── -->
    <VChart
      v-if="store.items.length"
      :option="chartOption"
      autoresize
      class="h-72 w-full"
    />

    <!-- ── 輔助訊息 ─────────────────────────────────────────── -->
    <p v-if="store.isLoading" class="text-gray-400">Loading…</p>
    <p v-if="store.errMsg"    class="text-rose-400">{{ store.errMsg }}</p>
  </div>
</template>
