<!-- src/pages/Overview.vue -->
<template>
  <!-- ==== 背景：星空 & 霓虹線條 ==== -->
  <div class="fixed inset-0 -z-20 overflow-hidden bg-slate-950">
    <!-- 點點星空 -->
    <div
      class="absolute inset-0 bg-[url('/_data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 fill=%22white%22 opacity=%220.12%22><circle cx=%225%22 cy=%225%22 r=%221%22/><circle cx=%2250%22 cy=%2250%22 r=%221%22/><circle cx=%2295%22 cy=%2295%22 r=%221%22/></svg>')]
      bg-[length:200px_200px]"
    />
    <!-- 霓虹斜線 -->
    <div class="absolute -top-1/3 -left-1/4 w-[180%] h-[180%] rotate-45 bg-gradient-to-tr from-indigo-600/5 via-fuchsia-600/10 to-teal-500/5" />
  </div>

  <!-- 內容容器 -->
  <div class="relative mx-auto max-w-screen-2xl px-10 py-10 space-y-10">

    <!-- KPI 卡片 -->
    <section class="grid grid-cols-4 gap-8 h-[20vh]">
      <KpiCard label="上線車輛"  :value="summary.online"  :icon="Bike"
               gradient="from-emerald-400/90 to-emerald-600"
               glow="bg-emerald-400/40" />
      <KpiCard label="離線車輛"  :value="summary.offline" :icon="CircleOff"
               gradient="from-rose-400/90 to-rose-600"
               glow="bg-rose-400/40" />
      <KpiCard label="今日總里程" :value="summary.distance" unit="km" :icon="Map"
               gradient="from-indigo-400/90 to-indigo-600"
               glow="bg-indigo-400/40" />
      <KpiCard label="今日減碳"   :value="summary.carbon" unit="kg" :icon="Leaf"
               gradient="from-teal-400/90 to-teal-600"
               glow="bg-teal-400/40" />
    </section>

    <!-- 圖表區 -->
    <section class="grid grid-cols-7 gap-8 h-[45vh]">
      <!-- SoC 折線圖 -->
      <div class="col-span-5 glass p-6 flex flex-col">
        <h3 class="text-slate-800 text-lg mb-3">平均電池 SoC 趨勢</h3>
        <SocTrend
          :labels="socLabels"
          :values="socValues"
          :loading="socLoading"
          class="flex-1"
        />
      </div>

      <!-- 減碳長條圖 -->
      <div class="col-span-2 glass p-6 flex flex-col">
        <h3 class="text-slate-800 text-lg mb-3">最近 7 天減碳量</h3>
        <CarbonBar
          :labels="carbonLabels"
          :values="carbonValues"
          :loading="carbonLoading"
          class="flex-1"
        />
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import KpiCard   from '@/components/kpi/KpiCard.vue'
import SocTrend  from '@/components/charts/SocTrend.vue'
import CarbonBar from '@/components/charts/CarbonBar.vue'
import { Bike, CircleOff, Map, Leaf } from 'lucide-vue-next'

/* 假資料（可改為 Pinia / API） */
const summary = reactive({ online: 42, offline: 8, distance: 128, carbon: 9.6 })

const socLabels  = ['00h','02h','04h','06h','08h','10h','12h','14h','16h','18h','20h','22h']
const socValues  = [92,90,87,84,80,75,70,65,60,55,50,45]
const socLoading = false

const carbonLabels  = ['06-20','06-21','06-22','06-23','06-24','06-25','06-26']
const carbonValues  = [9.6,10.2,8.7,11.3,9.9,12.1,10.4]
const carbonLoading = false
</script>

<style scoped>
.glass {
  @apply rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10
          shadow-xl shadow-black/40;
}
</style>
