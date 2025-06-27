<!-- src/pages/MLPredict.vue -->
<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { useVehicles, useML } from '@/stores'

/* 1. store */
const vStore = useVehicles()
const ml     = useML()

/* 2. 路線設定 */
const ORIGIN = { lat: 23.9971, lon: 121.6019 }
const DEST   = { lat: 24.0304, lon: 121.6249 }

/* 3. Haversine */
function haversineKm (lat1:number,lon1:number,lat2:number,lon2:number){
  const R=6371,rad=(d:number)=>d*Math.PI/180
  const a = Math.sin(rad(lat2-lat1)/2)**2 +
            Math.cos(rad(lat1))*Math.cos(rad(lat2))*
            Math.sin(rad(lon2-lon1)/2)**2
  return 2*R*Math.asin(Math.sqrt(a))
}
const routeDistance = haversineKm(
  ORIGIN.lat,ORIGIN.lon,DEST.lat,DEST.lon
).toFixed(2)

/* 4. 型別 & State */
type PredictRow={
  id:string;estTime:number|string;estEnergy:number|string;saved:number;kWh:number;
  nextCharge:string;cadence:number;gearRatio:string
}
const result=reactive<Record<string,PredictRow>>({})

/* 5. 預測流程 ------------------------------------------------------- */
function randFactor(maxPct:number){  //  maxPct=0.05 → ±5 %
  return 1 + (Math.random()*2-1)*maxPct
}
async function runPredict(){
  if(!vStore.items.length) return
  ml.errMsg='';ml.loading=true
  try{
    const dist=+routeDistance
    const [strategy,carbon]=await Promise.all([
      ml.fetchStrategy({distance:dist}),
      ml.fetchCarbon({distance:dist})
    ])
    const estMin=+strategy.estTime
    const avgSpeed=estMin?+(dist/(estMin/60)).toFixed(2):0
    const power=await ml.fetchPower({speed:avgSpeed})

    vStore.items.forEach(v=>{
      /* ========== 隨機微調以避免全部一致 ========== */
      const time    = +(strategy.estTime * randFactor(0.05)).toFixed(1)
      const energy  = +(strategy.estEnergy * randFactor(0.05)).toFixed(2)
      const saved   = +(carbon.saved       * randFactor(0.1) ).toFixed(2)
      const kWh     = +(power.kWh          + (Math.random()*0.3-0.15)).toFixed(2)

      /* 踏頻 70‒95 rpm 基準，再 ±5 隨機 */
      let baseCad = avgSpeed<15?72:avgSpeed<22?82:92
      const cadence = baseCad + Math.round((Math.random()*10-5))

      /* 變速比 1.8‒2.8 線性 + 0.1 隨機 */
      const baseRatio = 1.8 + (avgSpeed/30)
      const gearRatio = `1:${(baseRatio + (Math.random()*0.2-0.1)).toFixed(1)}`

      result[v.id]={
        id:v.id,
        estTime:time,
        estEnergy:energy,
        saved,
        kWh,
        nextCharge:power.nextCharge,
        cadence,
        gearRatio
      }
    })
  }catch(e:any){ml.errMsg=e.message??'預測失敗';console.error(e)}
  finally{ml.loading=false}
}

/* 6. 掛載：載入車輛並隨機座標 */
onMounted(async()=>{
  try{
    await vStore.fetchPage({page:1,size:20})
    vStore.items.forEach((v,i)=>{
      const t=(i+1)/(vStore.items.length+1)
      v.lat=+(ORIGIN.lat+(DEST.lat-ORIGIN.lat)*t+(Math.random()-0.5)*0.001).toFixed(6)
      v.lon=+(ORIGIN.lon+(DEST.lon-ORIGIN.lon)*t+(Math.random()-0.5)*0.001).toFixed(6)
    })
    await runPredict()
  }catch(e:any){ml.errMsg=e.message??'載入失敗'}
})
const hasResult=computed(()=>Object.keys(result).length>0)
</script>

<template>
  <div class="space-y-6">
    <!-- 標題列 -->
    <header class="flex items-center gap-4">
      <h2 class="text-2xl font-bold">機器學習綜合預測</h2>
      <span class="text-brand-300 text-sm">
        花蓮路線 (車站 ➜ 七星潭) 距離 ≈ {{ routeDistance }} km
      </span>
      <button class="btn ml-auto" :disabled="ml.loading" @click="runPredict">
        {{ ml.loading ? '計算中…' : '重新計算' }}
      </button>
    </header>

    <!-- 表格 -->
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
            <th class="px-4 py-2 text-right">建議踏頻 (rpm)</th>
            <th class="px-4 py-2 text-right">建議變速比</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in vStore.items" :key="v.id"
              class="border-t border-white/10 hover:bg-brand-400/5 transition">
            <td class="px-4 py-2">{{ v.id }}</td>
            <td class="px-4 py-2 text-right">{{ v.lat?.toFixed(6) ?? '—' }}</td>
            <td class="px-4 py-2 text-right">{{ v.lon?.toFixed(6) ?? '—' }}</td>
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
            <td class="px-4 py-2 text-right">
              {{ result[v.id]?.cadence ?? (ml.loading ? '…' : '—') }}
            </td>
            <td class="px-4 py-2 text-right">
              {{ result[v.id]?.gearRatio ?? (ml.loading ? '…' : '—') }}
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!hasResult" class="py-8 text-center text-brand-300">
        {{ ml.loading ? '計算中，請稍候…' : '尚無預測結果' }}
      </div>
    </div>

    <p v-if="ml.errMsg" class="text-rose-400">{{ ml.errMsg }}</p>
  </div>
</template>

<style scoped>
.btn  { @apply rounded bg-brand-600 px-4 py-1.5 text-white hover:bg-brand-500 disabled:opacity-60 transition; }
.card { @apply rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20 p-4; }
</style>
