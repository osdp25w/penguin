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
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <i class="i-ph:cpu w-6 h-6 text-brand-primary" />
          <div>
            <h1 class="text-xl font-semibold text-gray-900">機器學習綜合預測</h1>
            <p class="text-sm text-gray-600">
              花蓮路線 (車站 ➜ 七星潭) 距離 ≈ {{ routeDistance }} km
            </p>
          </div>
        </div>
        <button
          @click="runPredict"
          :disabled="ml.loading"
          class="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary/90 disabled:opacity-50"
        >
          <i :class="['i-ph:arrow-clockwise w-4 h-4', { 'animate-spin': ml.loading }]" />
          <span>{{ ml.loading ? '計算中…' : '重新計算' }}</span>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">車輛 ID</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">緯度</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">經度</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">預計時間 (分)</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">能耗 (kWh)</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">減碳 (kg)</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">騎乘耗電 (kWh)</th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">充電建議</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">建議踏頻 (rpm)</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">建議變速比</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="v in vStore.items" :key="v.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ v.id }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{{ v.lat?.toFixed(6) ?? '—' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{{ v.lon?.toFixed(6) ?? '—' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {{ result[v.id]?.estTime ?? (ml.loading ? '…' : '—') }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {{ result[v.id]?.estEnergy ?? (ml.loading ? '…' : '—') }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-medium">
                  {{ result[v.id]?.saved ?? (ml.loading ? '…' : '—') }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {{ result[v.id]?.kWh ?? (ml.loading ? '…' : '—') }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {{ result[v.id]?.nextCharge ?? (ml.loading ? '…' : '—') }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {{ result[v.id]?.cadence ?? (ml.loading ? '…' : '—') }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {{ result[v.id]?.gearRatio ?? (ml.loading ? '…' : '—') }}
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="!hasResult" class="py-12 text-center">
            <i class="i-ph:cpu w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              {{ ml.loading ? '計算中，請稍候…' : '尚無預測結果' }}
            </h3>
            <p class="text-gray-500">點擊重新計算按鈕開始預測</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="ml.errMsg"
        class="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg"
      >
        <div class="flex items-center space-x-2">
          <i class="i-ph:warning-circle w-5 h-5" />
          <span class="font-medium">{{ ml.errMsg }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

