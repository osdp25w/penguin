<script setup lang="ts">
import { onMounted } from 'vue'
import { useML } from '@/stores'

const ml = useML()
onMounted(() => ml.fetchBatteryRisk())
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">電池耗電 / 故障機率</h2>
      <button class="btn" @click="ml.fetchBatteryRisk" :disabled="ml.loading">重新整理</button>
    </header>

    <div class="card overflow-auto">
      <table class="min-w-full text-left text-sm">
        <thead class="bg-white/5 text-brand-300">
          <tr>
            <th class="px-4 py-2">ID</th>
            <th class="px-4 py-2 text-center">健康度</th>
            <th class="px-4 py-2 text-center">故障機率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in ml.batteries" :key="b.id"
              class="border-t border-white/5 hover:bg-brand-400/5 transition">
            <td class="px-4 py-2 font-mono">{{ b.id }}</td>
            <td class="px-4 py-2 text-center">{{ b.health }}%</td>
            <td class="px-4 py-2 text-center"
                :class="b.faultP>0.3?'text-rose-400':b.faultP>0.15?'text-amber-400':'text-emerald-400'">
              {{ (b.faultP*100).toFixed(0) }}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="ml.errMsg" class="text-rose-400">{{ ml.errMsg }}</p>
  </div>
</template>
