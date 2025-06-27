<!-- src/pages/MLPredict.vue -->
<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { useVehicles, useML } from '@/stores'

/* ───────────────────── 1. 初始化 ───────────────────── */
const vStore = useVehicles()
const ml     = useML()

/* 2. 花蓮示範路線：花蓮車站 → 七星潭 */
const ORIGIN = { lat: 23.9971, lon: 121.6019 }  // 花蓮火車站
const DEST   = { lat: 24.0304, lon: 121.6249 }  // 七星潭海堤

/* 3. Haversine 計算兩點距離 (km) */
function haversineKm (lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

const routeDistance = haversineKm(
  ORIGIN.lat, ORIGIN.lon, DEST.lat, DEST.lon
).toFixed(2)

/* 4. 響應式結果容器 */
type PredictRow = {
  id: string
  estTime   : string | number
  estEnergy : string | number
  saved     : number
  kWh       : number
  nextCharge: string
}
const result = reactive<Record<string, PredictRow>>({})

/* ───────────────────── 5. 執行預測 ───────────────────── */
async function runPredict () {
  if (!vStore.items.length) return

  try {
    ml.errMsg  = ''
    ml.loading = true
    const dist = Number(routeDistance)

    /* ① distance → strategy / carbon */
    const [strategy, carbon] = await Promise.all([
      ml.fetchStrategy({ distance: dist }),
      ml.fetchCarbon  ({ distance: dist })
    ])

    /* ② estTime → avgSpeed → power */
    const estMin   = Number(strategy.estTime)
    const avgSpeed = estMin ? +(dist / (estMin / 60)).toFixed(2) : 0
    const power    = await ml.fetchPower({ speed: avgSpeed })

    /* ③ 寫入所有車 */
    vStore.items.forEach(v => {
      result[v.id] = {
        id        : v.id,
        estTime   : strategy.estTime,
        estEnergy : strategy.estEnergy,
        saved     : carbon.saved,
        kWh       : power.kWh,
        nextCharge: power.nextCharge
      }
    })
  } catch (e: any) {
    ml.errMsg = e.message ?? '預測失敗'
    console.error('Predict failed:', e)
  } finally {
    ml.loading = false
  }
}

/* 6. 掛載：先抓車再跑一次 */
onMounted(async () => {
  try {
    await vStore.fetchPage({ page: 1, size: 20 })
    await runPredict()
  } catch (e: any) {
    ml.errMsg = e.message ?? '載入失敗'
  }
})

/* 7. 判斷是否有結果 */
const hasResult = computed(() => Object.keys(result).length > 0)
</script>

<template>
  <div class="space-y-6">
    <!-- ── 標題列 ───────────────────────────────────────── -->
    <header class="flex items-center gap-4">
      <h2 class="text-2xl font-bold">機器學習綜合預測</h2>
      <span class="text-brand-300 text-sm">
        花蓮路線 (車站 ➜ 七星潭) 距離 ≈ {{ routeDistance }} km
      </span>

      <button class="btn ml-auto" :disabled="ml.loading" @click="runPredict">
        {{ ml.loading ? '計算中…' : '重新計算' }}
      </button>
    </header>

    <!-- ── 結果表 ──────────────────────────────────────── -->
    <div class="card overflow-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-700 text-gray-200 sticky top-0">
          <tr>
            <th class="px-4 py-2 text-left">車輛 ID</th>
            <th class="px-4 py-2 text-right">緯度</th>
            <th class="px-4 py-2 text-right">經度</th>
            <th class="px-4 py-2 text-right">預計時間 (分)</th>
            <th class="px-4 py-2 text-right">能耗 (kWh)</th>
            <th class="px-4 py-2 text-right">減碳 (kg)</th>
            <th class="px-4 py-2 text-right">騎乘耗電 (kWh)</th>
            <th class="px-4 py-2 text-center">充電建議</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="v in vStore.items"
            :key="v.id"
            class="border-t border-white/10 hover:bg-brand-400/5 transition"
          >
            <td class="px-4 py-2">{{ v.id }}</td>
            <td class="px-4 py-2 text-right">
              {{ typeof v.lat === 'number' ? v.lat.toFixed(6) : '—' }}
            </td>
            <td class="px-4 py-2 text-right">
              {{ typeof v.lon === 'number' ? v.lon.toFixed(6) : '—' }}
            </td>
            <td class="px-4 py-2 text-right">
              {{ result[v.id]?.estTime ?? (ml.loading ? '…' : '—') }}
            </td>
            <td class="px-4 py-2 text-right">
              {{ result[v.id]?.estEnergy ?? (ml.loading ? '…' : '—') }}
            </td>
            <td class="px-4 py-2 text-right">
              {{ result[v.id]?.saved ?? (ml.loading ? '…' : '—') }}
            </td>
            <td class="px-4 py-2 text-right">
              {{ result[v.id]?.kWh ?? (ml.loading ? '…' : '—') }}
            </td>
            <td class="px-4 py-2 text-center">
              {{ result[v.id]?.nextCharge ?? (ml.loading ? '…' : '—') }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 空狀態 / Loading 提示 -->
      <div v-if="!hasResult" class="py-8 text-center text-brand-300">
        {{ ml.loading ? '計算中，請稍候…' : '尚無預測結果' }}
      </div>
    </div>

    <!-- 錯誤訊息 -->
    <p v-if="ml.errMsg" class="text-rose-400">{{ ml.errMsg }}</p>
  </div>
</template>

<style scoped>
.btn {
  @apply rounded bg-brand-600 px-4 py-1.5 text-white
         hover:bg-brand-500 disabled:opacity-60 transition;
}
.card {
  @apply rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10
         shadow-lg shadow-black/20 p-4;
}
</style>
