<!-- src/pages/MLPredict.vue -->
<script setup lang="ts">
import { reactive, computed, onMounted, ref } from 'vue'
import { useVehicles, useML } from '@/stores'
import type { Telemetry } from '@/ml/featurizer'
import { predictCadenceFromModel, predictGearRateFromModel } from '@/ml/runners'
import { getAllModelPaths, setModelPaths } from '@/ml/paths'

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
const routeDistance = ref(haversineKm(ORIGIN.lat,ORIGIN.lon,DEST.lat,DEST.lon))
const distKm = ref<number>(+routeDistance.value.toFixed(2))

// user controls
const pref01   = ref(0.3)   // 0 舒適, 1 挑戰
const terrain  = ref(0.3)   // 0 平地, 1 山路
const wind01   = ref(0.5)   // 0 順風, 1 逆風

/* 4. 型別 & State */
type PredictRow={
  id:string;estTime:number|string;estEnergy:number|string;saved:number;kWh:number;
  nextCharge:string;cadence:number;gearRatio:string
}
const result=reactive<Record<string,PredictRow>>({})
const telemetry = reactive<{ value: Telemetry | null }>({ value: null })

// 車輛選擇（多選）
const selectedIds = ref<string[]>([])
const search = ref('')
const allVehicles = computed(() => (vStore.vehicles?.length ? vStore.vehicles : vStore.items) as any[])
const safeVehicles = computed<any[]>(() => (Array.isArray(allVehicles.value) ? allVehicles.value : []).filter((v:any)=> v && v.id))
// 測試資料（當 store 無資料時使用）
const localDummies = ref<any[]>([])
const viewVehicles = computed<any[]>(() => (safeVehicles.value.length ? safeVehicles.value : localDummies.value))
const filteredOptions = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return viewVehicles.value
  return viewVehicles.value.filter((v:any) =>
    String(v.id).toLowerCase().includes(q) ||
    String(v.name||'').toLowerCase().includes(q)
  )
})
const selectedRows = computed<any[]>(() => viewVehicles.value.filter((v:any)=> v && v.id && selectedIds.value.includes(v.id)))

/* 5. 預測流程 ------------------------------------------------------- */
function randFactor(maxPct:number){  //  maxPct=0.05 → ±5 %
  return 1 + (Math.random()*2-1)*maxPct
}
async function runPredict(){
  if(!selectedIds.value.length) return
  ml.errMsg='';ml.loading=true
  try{
    const dist=+distKm.value
    const [strategy,carbon]=await Promise.all([
      ml.fetchStrategy({distance:dist, preference01: pref01.value, terrain01: terrain.value, wind01: wind01.value}),
      ml.fetchCarbon({distance:dist})
    ])
    const estMin=+strategy.estTime
    const avgSpeed=estMin?+(dist/(estMin/60)).toFixed(2):0
    const power=await ml.fetchPower({speed:avgSpeed})

    // Try optional cadence/gear models per vehicle (use pasted telemetry if provided)
    const rows = selectedRows.value
    if (!rows.length) { throw new Error('請先選擇有效車輛') }
    const baseTel = telemetry.value || telemetryFromVehicle(rows[0]) || undefined
    const cad = await predictCadenceFromModel(baseTel)
    const gear= await predictGearRateFromModel(baseTel)
    // 清空舊結果
    for (const k of Object.keys(result)) delete result[k]

    rows.forEach((v:any)=>{
      if (!v || !v.id) return
      /* ========== 隨機微調以避免全部一致 ========== */
      const time    = +(strategy.estTime * randFactor(0.05)).toFixed(1)
      const energy  = +(strategy.estEnergy * randFactor(0.05)).toFixed(2)
      const saved   = +(carbon.saved       * randFactor(0.1) ).toFixed(2)
      const kWh     = +(power.kWh          + (Math.random()*0.3-0.15)).toFixed(2)

      /* 踏頻：若有模型，採用模型輸出，否則 70‒95 rpm 基準 ±5 */
      let cadence = cad ?? ((avgSpeed<15?72:avgSpeed<22?82:92) + Math.round((Math.random()*10-5)))

      /* 變速比：若有模型，採用模型輸出 (四捨五入至 0.1)，否則 1.8‒2.8 線性 + 0.1 隨機 */
      const baseRatio = gear ?? (1.8 + (avgSpeed/30) + (Math.random()*0.2-0.1))
      const gearRatio = `1:${(+baseRatio).toFixed(1)}`

      const key = String(v.id)
      result[key]={
        id:key,
        estTime:time,
        estEnergy:energy,
        saved,
        kWh,
        nextCharge:power.nextCharge,
        cadence,
        gearRatio
      }
    })

    // battery risk 僅針對已選車輛
    await ml.fetchBatteryRisk(rows.map((v:any)=> String(v.id)))
  }catch(e:any){ml.errMsg=e.message??'預測失敗';console.error(e)}
  finally{ml.loading=false}
}

/* 6. 掛載：載入車輛並隨機座標 */
onMounted(async()=>{
  try{
    await vStore.fetchPage({page:1,size:20})
    // 若無資料，建立 8 筆示範車輛
    if (!safeVehicles.value.length) {
      const count = 8
      const arr: any[] = []
      for (let i=0;i<count;i++) {
        const t=(i+1)/(count+1)
        const lat = +(ORIGIN.lat+(DEST.lat-ORIGIN.lat)*t+(Math.random()-0.5)*0.001).toFixed(6)
        const lon = +(ORIGIN.lon+(DEST.lon-ORIGIN.lon)*t+(Math.random()-0.5)*0.001).toFixed(6)
        const soc = Math.round(60 + Math.random()*35)
        arr.push({ id: `DEMO-${String(i+1).padStart(3,'0')}`, name:`示範車輛-${i+1}`, lat, lon, batteryPct: soc, batteryLevel: soc, status: soc>20 ? '可租借' : '低電量', speedKph: Math.round(Math.random()*22) })
      }
      localDummies.value = arr
    }

    // 為目前資料加上座標（若未定）
    const denom = (viewVehicles.value.length || 1) + 1
    viewVehicles.value.forEach((v:any,i:number)=>{
      if (typeof v.lat !== 'number' || typeof v.lon !== 'number') {
        const t=(i+1)/denom
        v.lat=+(ORIGIN.lat+(DEST.lat-ORIGIN.lat)*t+(Math.random()-0.5)*0.001).toFixed(6)
        v.lon=+(ORIGIN.lon+(DEST.lon-ORIGIN.lon)*t+(Math.random()-0.5)*0.001).toFixed(6)
      }
    })

    // 預設勾選第一台車（若可用）
    if (viewVehicles.value.length) selectedIds.value = [viewVehicles.value[0].id]
  }catch(e:any){ml.errMsg=e.message??'載入失敗'}
})
const hasResult=computed(()=>Object.keys(result).length>0)

// 將現有車輛快照轉為 Telemetry 物件（缺值用隨機）
function telemetryFromVehicle(v:any): Telemetry {
  const rand = (min:number,max:number)=> min + Math.random()*(max-min)
  const mv10 = Math.round(rand(490, 540)) // 49.0~54.0 V → 490~540 (0.1V)
  const ct = Math.random()<0.1 ? 2000 : Math.round(rand(28,42))
  const soc = Math.round(v.batteryLevel ?? v.batteryPct ?? rand(20, 95))
  const vs  = Math.round(v.speedKph ?? rand(0, 22))
  const lat = typeof v.lat==='number' ? Math.round(v.lat*1e6) : 0
  const lon = typeof v.lon==='number' ? Math.round(v.lon*1e6) : 0
  return {
    ID: String(v.id),
    MSG: {
      VS: vs,
      SO: soc,
      LA: lat,
      LG: lon,
      MV: mv10,
      CT: ct,
      AL: 1,
      CA: 0,
      PT: 0,
      GQ: 23
    }
  }
}

// 模型設定（UI 狀態）
const ui = reactive({
  powerPath: getAllModelPaths().power,
  batteryPath: getAllModelPaths().battery,
  status: '未載入'
})

const powerOptions = [
  { label: '內建 power.onnx', value: '/models/power.onnx' },
  { label: 'range.onnx', value: '/models/range.onnx' }
]
const batteryOptions = [
  { label: '內建 battery_risk.onnx', value: '/models/battery_risk.onnx' },
  { label: 'soh_rf.onnx', value: '/models/soh_rf.onnx' },
  { label: 'iforest.onnx', value: '/models/iforest.onnx' }
]

function applyModelPaths() {
  const partial: any = {}
  if (ui.powerPath) partial.power = ui.powerPath
  if (ui.batteryPath) partial.battery = ui.batteryPath
  setModelPaths(partial)
  ui.status = '已套用，推論時載入'
}

async function testLoad() {
  try {
    applyModelPaths()
    // 試跑一次最小輸入以驗證 ORT 可載入
    await Promise.all([
      // 以現有流程觸發 power/ battery 兩組模型
      ml.fetchPower({ speed: 18 }),
      ml.fetchBatteryRisk(['DEMO-000'])
    ])
    ui.status = 'ONNX 已載入'
  } catch (e:any) {
    ui.status = '載入失敗：' + (e?.message || 'unknown')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
    <div class="mx-auto max-w-7xl space-y-8">
      <!-- 標題列 -->
      <header class="flex items-center justify-between rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-white/20">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
              機器學習綜合預測
            </h1>
            <p class="text-sm text-gray-600 mt-1">智能分析與路線優化系統</p>
          </div>
        </div>
        <button class="btn-primary" :disabled="ml.loading || selectedIds.length===0" @click="runPredict">
          <span v-if="ml.loading" class="flex items-center gap-2">
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            計算中...
          </span>
          <span v-else class="flex items-center gap-2">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            {{ hasResult ? '重新計算' : '開始預測' }}
          </span>
        </button>
      </header>

      

      <!-- 車輛選擇（多選） -->
      <div class="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-white/20">
        <div class="flex items-center gap-3 mb-6">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h1a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900">車輛選擇</h3>
          <span class="ml-auto inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            已選 {{ selectedIds.length }} 台
          </span>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-4">
            <!-- 搜索和操作按鈕 -->
            <div class="flex items-center gap-3">
              <div class="relative flex-1">
                <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input type="text" 
                       v-model="search" 
                       placeholder="搜尋車輛 ID/名稱..." 
                       class="input-field pl-10" />
              </div>
              <button class="btn-outline" @click="selectAll">全選</button>
              <button class="btn-outline" @click="clearAll">清除</button>
            </div>
            
            <!-- 車輛列表 -->
            <div class="rounded-lg border border-gray-200 bg-gray-50/50 max-h-64 overflow-auto">
              <div v-for="(v, idx) in filteredOptions" :key="(v && v.id) || idx" 
                   class="flex items-center gap-3 px-4 py-3 hover:bg-white/80 border-b border-gray-100 last:border-0 transition-colors">
                <label class="flex items-center gap-3 cursor-pointer flex-1">
                  <input type="checkbox" 
                         :value="(v && v.id) || ''" 
                         v-model="selectedIds" 
                         class="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 text-xs font-semibold">
                      {{ String(v?.name || 'E')[0].toUpperCase() }}
                    </div>
                    <div class="min-w-0">
                      <div class="truncate text-sm font-medium text-gray-900">{{ (v && v.name) || 'E-Bike' }}</div>
                      <div class="truncate text-xs font-mono text-gray-500">{{ (v && v.id) || '—' }}</div>
                    </div>
                  </div>
                  <div v-if="v?.batteryLevel || v?.batteryPct" class="text-xs text-gray-500">
                    {{ Math.round(v?.batteryLevel || v?.batteryPct || 0) }}%
                  </div>
                </label>
              </div>
      </div>
    </div>

    <!-- 模型設定（下拉選單） -->
    <div class="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-white/20">
      <div class="flex items-center gap-3 mb-6">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900">模型設定</h3>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">用電/續航 模型</label>
          <select v-model="ui.powerPath" class="input-field">
            <option v-for="opt in powerOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">故障/異常 模型</label>
          <select v-model="ui.batteryPath" class="input-field">
            <option v-for="opt in batteryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="flex items-end gap-3">
          <button class="btn-secondary" @click="applyModelPaths">套用模型</button>
          <button class="btn-outline" @click="testLoad">測試載入</button>
        </div>
      </div>
      <div class="mt-4 flex items-center gap-2">
        <span class="text-sm text-gray-600">狀態：</span>
        <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              :class="ui.status === 'ONNX 已載入' ? 'bg-emerald-100 text-emerald-800' : 
                      ui.status.includes('載入失敗') ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'">
          <div class="h-1.5 w-1.5 rounded-full"
               :class="ui.status === 'ONNX 已載入' ? 'bg-emerald-500' : 
                       ui.status.includes('載入失敗') ? 'bg-red-500' :
                       'bg-yellow-500'"></div>
          {{ ui.status }}
        </span>
      </div>
    </div>

          <!-- 選中車輛預覽 -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700">已選車輛</label>
            <div class="rounded-lg border border-gray-200 bg-gray-50/50 p-4 min-h-[8rem] max-h-64 overflow-auto space-y-2">
              <div v-for="id in selectedIds" :key="id" 
                   class="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm shadow-sm">
                <span class="truncate font-mono text-gray-700">{{ id }}</span>
                <button @click="selectedIds = selectedIds.filter(i => i !== id)" 
                        class="ml-2 text-gray-400 hover:text-red-500 transition-colors">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div v-if="selectedIds.length === 0" class="text-center text-gray-400 py-4">
                尚未選擇車輛
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Telemetry paste (optional) -->
      <div class="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-white/20">
        <div class="flex items-center gap-3 mb-6">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900">MQTT 數據輸入</h3>
          <span class="ml-auto text-xs text-gray-500">（可選）</span>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700">貼上 MQTT JSON 數據</label>
            <textarea class="textarea-field h-40 font-mono text-xs"
                      placeholder='{"ID":"867...","MSG":{...}}'
                      @change="e => onPasteTelemetry((e.target as HTMLTextAreaElement).value)"
            />
            <p class="text-xs text-gray-600 flex items-center gap-1">
              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              缺少的特徵會用隨機數填補（溫度/濕度/坡度/心率等）
            </p>
          </div>
          
          <div class="space-y-4">
            <div class="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-sm font-medium text-gray-700">解析狀態</span>
                <span class="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium"
                      :class="telemetry.value ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'">
                  <div class="h-1.5 w-1.5 rounded-full"
                       :class="telemetry.value ? 'bg-emerald-500' : 'bg-gray-400'"></div>
                  {{ telemetry.value ? '已載入' : '未提供' }}
                </span>
              </div>
              
              <div v-if="telemetry.value" class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-600">設備 ID</span>
                  <span class="text-xs font-mono text-gray-900">{{ telemetry.value.ID }}</span>
                </div>
                <div v-if="telemetry.value.MSG" class="text-xs text-gray-600">
                  包含 {{ Object.keys(telemetry.value.MSG).length }} 個數據欄位
                </div>
              </div>
              
              <div v-else class="text-xs text-gray-500 text-center py-2">
                尚未提供 MQTT 數據
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 控制面板 -->
      <div class="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-white/20">
        <div class="flex items-center gap-3 mb-6">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900">路線參數設定</h3>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700">距離 (km)</label>
            <div class="relative">
              <input type="number" 
                     min="1" 
                     step="0.1" 
                     v-model.number="distKm" 
                     class="input-field pr-12" />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">km</span>
            </div>
          </div>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700">騎乘偏好</label>
              <span class="text-xs text-gray-500">{{ (pref01 * 100).toFixed(0) }}%</span>
            </div>
            <input type="range" 
                   min="0" 
                   max="1" 
                   step="0.05" 
                   v-model.number="pref01" 
                   class="slider" />
            <div class="flex justify-between text-xs text-gray-500">
              <span>舒適</span>
              <span>挑戰</span>
            </div>
          </div>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700">地形條件</label>
              <span class="text-xs text-gray-500">{{ (terrain * 100).toFixed(0) }}%</span>
            </div>
            <input type="range" 
                   min="0" 
                   max="1" 
                   step="0.05" 
                   v-model.number="terrain" 
                   class="slider" />
            <div class="flex justify-between text-xs text-gray-500">
              <span>平地</span>
              <span>山路</span>
            </div>
          </div>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700">風況影響</label>
              <span class="text-xs text-gray-500">{{ (wind01 * 100).toFixed(0) }}%</span>
            </div>
            <input type="range" 
                   min="0" 
                   max="1" 
                   step="0.05" 
                   v-model.number="wind01" 
                   class="slider" />
            <div class="flex justify-between text-xs text-gray-500">
              <span>順風</span>
              <span>逆風</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 預測結果表格 -->
      <div class="rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 overflow-hidden">
        <div class="flex items-center gap-3 p-6 border-b border-gray-200/50">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900">預測結果</h3>
          <span v-if="hasResult" class="ml-auto text-xs text-gray-500">
            共 {{ selectedRows.length }} 台車輛
          </span>
        </div>
        
        <div class="overflow-auto max-h-96">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50/80 text-gray-700 sticky top-0">
              <tr>
                <th class="px-4 py-3 text-left font-medium">車輛 ID</th>
                <th class="px-4 py-3 text-right font-medium">位置（緯度）</th>
                <th class="px-4 py-3 text-right font-medium">位置（經度）</th>
                <th class="px-4 py-3 text-right font-medium">預計時間<span class="text-xs text-gray-500 block font-normal">分鐘</span></th>
                <th class="px-4 py-3 text-right font-medium">能耗<span class="text-xs text-gray-500 block font-normal">kWh</span></th>
                <th class="px-4 py-3 text-right font-medium">減碳<span class="text-xs text-gray-500 block font-normal">kg</span></th>
                <th class="px-4 py-3 text-right font-medium">耗電<span class="text-xs text-gray-500 block font-normal">kWh</span></th>
                <th class="px-4 py-3 text-center font-medium">充電建議</th>
                <th class="px-4 py-3 text-right font-medium">建議踏頻<span class="text-xs text-gray-500 block font-normal">rpm</span></th>
                <th class="px-4 py-3 text-right font-medium">建議變速比</th>
              </tr>
            </thead>
            <tbody class="bg-white/50">
              <tr v-for="(v, idx) in selectedRows" :key="(v && v.id) || idx"
                  class="border-t border-gray-100 hover:bg-white/80 transition-colors">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-medium text-gray-600">
                      {{ String(v?.name || v?.id || 'E')[0].toUpperCase() }}
                    </div>
                    <span class="truncate max-w-[10ch] font-mono text-gray-900" :title="(v && v.id) || ''">
                      {{ (v && v.id) || '—' }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3 text-right text-gray-700">
                  {{ (v && typeof v.lat==='number') ? v.lat.toFixed(6) : '—' }}
                </td>
                <td class="px-4 py-3 text-right text-gray-700">
                  {{ (v && typeof v.lon==='number') ? v.lon.toFixed(6) : '—' }}
                </td>
                <td class="px-4 py-3 text-right font-medium text-gray-900">
                  {{ (v && result[String(v.id)]?.estTime) ?? (ml.loading ? '…' : '—') }}
                </td>
                <td class="px-4 py-3 text-right font-medium text-green-700">
                  {{ (v && result[String(v.id)]?.estEnergy) ?? (ml.loading ? '…' : '—') }}
                </td>
                <td class="px-4 py-3 text-right font-medium text-emerald-700">
                  {{ (v && result[String(v.id)]?.saved) ?? (ml.loading ? '…' : '—') }}
                </td>
                <td class="px-4 py-3 text-right font-medium text-orange-700">
                  {{ (v && result[String(v.id)]?.kWh) ?? (ml.loading ? '…' : '—') }}
                </td>
                <td class="px-4 py-3 text-center">
                  <span v-if="v && result[String(v.id)]?.nextCharge" 
                        class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                        :class="result[String(v.id)].nextCharge === '立即充電' ? 'bg-red-100 text-red-800' :
                                result[String(v.id)].nextCharge === '建議充電' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'">
                    {{ result[String(v.id)].nextCharge }}
                  </span>
                  <span v-else>{{ ml.loading ? '…' : '—' }}</span>
                </td>
                <td class="px-4 py-3 text-right font-medium text-blue-700">
                  {{ (v && result[String(v.id)]?.cadence) ?? (ml.loading ? '…' : '—') }}
                </td>
                <td class="px-4 py-3 text-right font-medium text-purple-700">
                  {{ (v && result[String(v.id)]?.gearRatio) ?? (ml.loading ? '…' : '—') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!hasResult" class="py-12 text-center">
          <div v-if="ml.loading" class="flex flex-col items-center gap-3 text-gray-600">
            <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>計算中，請稍候…</span>
          </div>
          <div v-else class="text-gray-500">
            <svg class="mx-auto h-12 w-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 17v-2m3 2v-4m3 4v-6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p>尚無預測結果</p>
            <p class="text-sm text-gray-400 mt-1">選擇車輛後點擊「開始預測」</p>
          </div>
        </div>
      </div>

      <!-- 錯誤訊息 -->
      <div v-if="ml.errMsg" class="rounded-2xl bg-red-50/80 backdrop-blur-sm p-4 shadow-lg border border-red-200/50">
        <div class="flex items-center gap-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-medium text-red-900">預測失敗</h3>
            <p class="text-sm text-red-700 mt-1">{{ ml.errMsg }}</p>
          </div>
        </div>
      </div>

      <!-- 電池健康與故障風險 -->
      <div class="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-white/20">
        <div class="flex items-center gap-3 mb-6">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900">電池健康與故障風險</h3>
          <span v-if="ml.batteries?.length" class="ml-auto text-xs text-gray-500">
            {{ ml.batteries.filter(b => b && b.id && selectedIds.includes(String(b.id))).length }} 台車輛分析
          </span>
        </div>
        
        <div class="overflow-auto max-h-64">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50/80 text-gray-700 sticky top-0">
              <tr>
                <th class="px-4 py-3 text-left font-medium">車輛 ID</th>
                <th class="px-4 py-3 text-right font-medium">健康度<span class="text-xs text-gray-500 block font-normal">%</span></th>
                <th class="px-4 py-3 text-right font-medium">故障機率<span class="text-xs text-gray-500 block font-normal">%</span></th>
                <th class="px-4 py-3 text-right font-medium">用電<span class="text-xs text-gray-500 block font-normal">kWh</span></th>
                <th class="px-4 py-3 text-center font-medium">充電建議</th>
                <th class="px-4 py-3 text-center font-medium">風險等級</th>
              </tr>
            </thead>
            <tbody class="bg-white/50">
              <tr v-for="(b, idx) in ml.batteries" :key="(b && b.id) || idx" 
                  class="border-t border-gray-100 hover:bg-white/80 transition-colors"
                  v-if="b && b.id && selectedIds.includes(String(b.id))">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-medium text-gray-600">
                      {{ String(b.id || 'B')[0].toUpperCase() }}
                    </div>
                    <span class="truncate max-w-[10ch] font-mono text-gray-900" :title="(b && b.id) || ''">
                      {{ (b && b.id) || '—' }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <div class="w-16 bg-gray-200 rounded-full h-2">
                      <div class="h-2 rounded-full transition-all"
                           :class="b.health >= 80 ? 'bg-green-500' : b.health >= 60 ? 'bg-yellow-500' : 'bg-red-500'"
                           :style="{ width: `${Math.max(0, Math.min(100, b.health))}%` }"></div>
                    </div>
                    <span class="font-medium text-gray-900 min-w-[3rem]">{{ b.health }}%</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-right font-medium text-gray-900">
                  {{ (b.faultP * 100).toFixed(1) }}%
                </td>
                <td class="px-4 py-3 text-right font-medium text-gray-900">
                  {{ (result[b.id]?.kWh ?? '—') }}
                </td>
                <td class="px-4 py-3 text-center text-gray-900">
                  {{ (result[b.id]?.nextCharge ?? '—') }}
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                        :class="b.faultP < 0.1 ? 'bg-green-100 text-green-800' :
                                b.faultP < 0.3 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'">
                    {{ b.faultP < 0.1 ? '正常' : b.faultP < 0.3 ? '注意' : '高風險' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-if="!ml.batteries?.length || !ml.batteries.some(b => b && b.id && selectedIds.includes(String(b.id)))" 
             class="py-8 text-center text-gray-500">
          <svg class="mx-auto h-12 w-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <p>尚無電池分析數據</p>
          <p class="text-sm text-gray-400 mt-1">執行預測後將顯示電池健康狀態</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Primary Button */
.btn-primary {
  @apply inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 
         px-6 py-3 text-sm font-semibold text-white shadow-lg 
         hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl
         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
         disabled:opacity-50 disabled:cursor-not-allowed 
         transform transition-all duration-200 hover:scale-105 active:scale-95;
}

/* Secondary Button */
.btn-secondary {
  @apply inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 
         px-4 py-2 text-sm font-medium text-white shadow-md
         hover:from-gray-700 hover:to-gray-800 hover:shadow-lg
         focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
         disabled:opacity-50 disabled:cursor-not-allowed 
         transition-all duration-150 hover:scale-105 active:scale-95;
}

/* Outline Button */
.btn-outline {
  @apply inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white
         px-4 py-2 text-sm font-medium text-gray-700 shadow-sm
         hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md
         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
         disabled:opacity-50 disabled:cursor-not-allowed 
         transition-all duration-150 hover:scale-105 active:scale-95;
}

/* Input Field */
.input-field {
  @apply w-full rounded-lg border border-gray-300 bg-white/90 px-4 py-2.5 text-sm text-gray-900
         placeholder:text-gray-500 
         focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none
         disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
         transition-all duration-150;
}

/* Textarea Field */
.textarea-field {
  @apply w-full rounded-lg border border-gray-300 bg-white/90 px-4 py-3 text-sm text-gray-900
         placeholder:text-gray-500 resize-y min-h-[6rem]
         focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none
         disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
         transition-all duration-150;
}

/* Range Slider */
.slider {
  @apply w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer;
}

.slider::-webkit-slider-thumb {
  @apply appearance-none w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full cursor-pointer
         shadow-lg hover:shadow-xl transition-all duration-150 hover:scale-110;
}

.slider::-moz-range-thumb {
  @apply w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full cursor-pointer
         border-0 shadow-lg hover:shadow-xl transition-all duration-150 hover:scale-110;
}

/* Deprecated - keeping for backwards compatibility */
.btn { 
  @apply btn-secondary;
}
</style>

<script lang="ts">
export default {
  methods: {
    onPasteTelemetry(this: any, raw: string) {
      try {
        const obj = JSON.parse(raw)
        this.telemetry.value = obj
      } catch {
        this.telemetry.value = null
      }
    },
    selectAll(this: any) {
      this.selectedIds = this.filteredOptions.map((v:any)=>v.id)
    },
    clearAll(this: any) {
      this.selectedIds = []
    }
  }
}
</script>
