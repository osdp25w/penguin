<!-- src/pages/MLPredict.vue -->
<script setup lang="ts">
import { reactive, computed, onMounted, ref } from 'vue'
import { useVehicles, useML } from '@/stores'
import type { Telemetry } from '@/ml/featurizer'
import { predictCadenceFromModel, predictGearRateFromModel, predictBatteryRisk } from '@/ml/runners'
import { getAllModelPaths, setModelPaths } from '@/ml/paths'

/* 1. store */
const vStore = useVehicles()
const ml     = useML()
const usingRealData = ref(false)

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

// Sorting configuration for results table
const sortConfig = ref({
  field: '' as string,
  order: 'asc' as 'asc' | 'desc'
})
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
const selectedRowsUnsorted = computed<any[]>(() => viewVehicles.value.filter((v:any)=> v && v.id && selectedIds.value.includes(String(v.id))))

// Apply sorting to selected rows
const selectedRows = computed<any[]>(() => {
  let list = [...selectedRowsUnsorted.value]

  if (sortConfig.value.field) {
    list.sort((a, b) => {
      let aVal: any = ''
      let bVal: any = ''

      switch (sortConfig.value.field) {
        case 'vehicle':
          aVal = a.name || a.id || ''
          bVal = b.name || b.id || ''
          break
        case 'status':
          aVal = a.status || ''
          bVal = b.status || ''
          break
        case 'health':
          const aBattery = ml.batteries?.find((bat: any) => bat?.id === String(a?.id))
          const bBattery = ml.batteries?.find((bat: any) => bat?.id === String(b?.id))
          aVal = aBattery?.health || 0
          bVal = bBattery?.health || 0
          break
        case 'risk':
          const aBatteryRisk = ml.batteries?.find((bat: any) => bat?.id === String(a?.id))
          const bBatteryRisk = ml.batteries?.find((bat: any) => bat?.id === String(b?.id))
          aVal = aBatteryRisk?.faultP || 0
          bVal = bBatteryRisk?.faultP || 0
          break
        case 'charge':
          aVal = result[String(a.id)]?.nextCharge || ''
          bVal = result[String(b.id)]?.nextCharge || ''
          break
        case 'cadence':
          aVal = a.status === 'in-use' ? (result[String(a.id)]?.cadence || 0) : 0
          bVal = b.status === 'in-use' ? (result[String(b.id)]?.cadence || 0) : 0
          break
        case 'gearRatio':
          aVal = a.status === 'in-use' ? (result[String(a.id)]?.gearRatio || '') : ''
          bVal = b.status === 'in-use' ? (result[String(b.id)]?.gearRatio || '') : ''
          break
      }

      const compareResult = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortConfig.value.order === 'asc' ? compareResult : -compareResult
    })
  }

  return list
})

// Sorting function
function handleSort(field: string) {
  if (sortConfig.value.field === field) {
    sortConfig.value.order = sortConfig.value.order === 'asc' ? 'desc' : 'asc'
  } else {
    sortConfig.value.field = field
    sortConfig.value.order = 'asc'
  }
}

/* 5. 預測流程 ------------------------------------------------------- */
// 決定論噪聲工具：以字串產生穩定 0..1 值
function hashStr(s:string){ let h=2166136261>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0 } return h>>>0 }
function noise01(key:string){ return (hashStr(key)%1000)/1000 }
function detFactor(key:string,maxPct:number){ return 1 + ((noise01(key)*2-1)*maxPct) }
function noiseRange(key:string,min:number,max:number){ return min + noise01(key)*(max-min) }
function shortId(id: any){
  if (id == null) return '—'
  const s = String(id)
  if (s.length <= 12) return s
  return `${s.slice(0, 6)}…${s.slice(-4)}`
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
    const estMin = Number(strategy.estTime)
    const estEnergyVal = Number(strategy.estEnergy)
    const carbonSavedVal = Number(carbon.saved)
    const avgSpeed = estMin ? +(dist / (estMin / 60)).toFixed(2) : 0
    const power = await ml.fetchPower({speed:avgSpeed})

    // Try optional cadence/gear models per vehicle (use pasted telemetry if provided)
    const rows = selectedRows.value
    if (!rows.length) { throw new Error('請先選擇有效車輛') }
    // 先以第一台車嘗試模型以暖機，再逐台計算（避免每次都 cold-start）
    const warmupTel = telemetry.value || telemetryFromVehicle(rows[0]) || undefined
    await predictCadenceFromModel(warmupTel)
    await predictGearRateFromModel(warmupTel)
    // 清空舊結果
    for (const k of Object.keys(result)) delete result[k]

    for (const v of rows as any[]) {
      if (!v || !v.id) return
      /* ========== 決定論微調，避免全部一致（同車同參數輸出恆定） ========== */
      const vid = String(v.id)
      const time    = +(estMin * detFactor(vid+':time', 0.05)).toFixed(1)
      const energy  = +(estEnergyVal * detFactor(vid+':energy', 0.05)).toFixed(2)
      const saved   = +(carbonSavedVal * detFactor(vid+':saved', 0.10)).toFixed(2)
      // 以每台車的即時速度（若有）微調耗能（決定論）
      const vSpeed  = typeof v.vehicleSpeed === 'number' ? v.vehicleSpeed : (typeof v.speedKph === 'number' ? v.speedKph : avgSpeed)
      const speedMul= avgSpeed ? Math.max(0.5, Math.min(1.5, (vSpeed/avgSpeed)**2 )) : 1
      const kWhBase = power.kWh * speedMul
      const kWhNoise= noiseRange(vid+':kwh', -0.15, 0.15)
      const kWh     = +(kWhBase + kWhNoise).toFixed(2)

      /* 踏頻：若有模型，採用模型輸出，否則 70‒95 rpm 基準 ±5 */
      const tel = telemetry.value || telemetryFromVehicle(v) || undefined
      const cadV = await predictCadenceFromModel(tel)
      let cadence = cadV ?? ((vSpeed<15?72:vSpeed<22?82:92) + Math.round((Math.random()*10-5)))

      /* 變速比：若有模型，採用模型輸出 (四捨五入至 0.1)，否則 1.8‒2.8 線性 + 0.1 隨機 */
      const gearV = await predictGearRateFromModel(tel)
      const baseRatio = gearV ?? (1.8 + (vSpeed/30) + (Math.random()*0.2-0.1))
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
    }

    // battery risk：針對每台車序列推論（避免 ONNX session 衝突）
    console.log('[ML] Starting battery risk prediction for', rows.length, 'vehicles')
    const risks = []
    for (const v of rows as any[]) {
      const tel = telemetry.value || telemetryFromVehicle(v) || undefined
      console.log('[ML] Predicting battery risk for vehicle:', v.id, 'with telemetry:', !!tel)
      try {
        const out = await predictBatteryRisk([String(v.id)], tel)
        console.log('[ML] Battery risk result for', v.id, ':', out)
        risks.push(out && out.length > 0 ? out[0] : null)
      } catch (err) {
        console.error('[ML] Battery risk prediction error for', v.id, ':', err)
        risks.push(null)
      }
    }
    // 寫回 store（包含所有結果，即使是 null）
    const validRisks = risks.filter((risk) => risk && risk.id).map((risk: any) => ({
      id: String(risk.id),
      health: Number(risk.health) || 0,
      faultP: Number(risk.faultP) || 0,
      capacity: risk.capacity != null ? Number(risk.capacity) : null
    }))
    console.log('[ML] Final battery analysis results:', validRisks)
    console.log('[ML] Selected IDs:', selectedIds.value)
    ml.batteries = validRisks
  }catch(e:any){ml.errMsg=e.message??'預測失敗';console.error(e)}
  finally{ml.loading=false}
}

// 重新整理資料函數
const refreshData = async () => {
  try {
    // 優先從後端載入即時車輛資料
    const { data, total } = await (vStore as any).fetchVehiclesPaged({ limit: 48, offset: 0 })
    if (Array.isArray(data) && data.length) {
      ;(vStore as any).vehicles = data
      ;(vStore as any).total = total
      ;(vStore as any).page = 1
      ;(vStore as any).pageSize = 48
      usingRealData.value = true
      console.log('[ML] 已載入真實車輛資料:', data.length, '台')
    } else {
      throw new Error('無真實資料')
    }
  } catch (err) {
    console.warn('[ML] 載入真實資料失敗，使用示範資料:', err)
    await vStore.fetchPage({page:1,size:20})
    usingRealData.value = false
  }
}

/* 6. 掛載：載入車輛並隨機座標 */
onMounted(async()=>{
  try{
    await refreshData()
    // 若無資料，建立 8 筆示範車輛
    if (!safeVehicles.value.length) {
      const count = 8
      const arr: any[] = []
      for (let i=0;i<count;i++) {
        const id = `DEMO-${String(i+1).padStart(3,'0')}`
        const t=(i+1)/(count+1)
        const lat = +(ORIGIN.lat+(DEST.lat-ORIGIN.lat)*t).toFixed(6)
        const lon = +(ORIGIN.lon+(DEST.lon-ORIGIN.lon)*t).toFixed(6)
        const soc = Math.round(noiseRange(id+':soc', 40, 85))
        const spd = Math.round(noiseRange(id+':speed', 0, 22))
        arr.push({ id, name:`示範車輛-${i+1}`, lat, lon, batteryPct: soc, batteryLevel: soc, status: soc>20 ? '可租借' : '低電量', speedKph: spd })
      }
      localDummies.value = arr
    }

    // 為目前資料加上座標（若未定，使用決定論位置）
    const denom = (viewVehicles.value.length || 1) + 1
    viewVehicles.value.forEach((v:any,i:number)=>{
      if (typeof v.lat !== 'number' || typeof v.lon !== 'number') {
        const t=(i+1)/denom
        v.lat=+(ORIGIN.lat+(DEST.lat-ORIGIN.lat)*t).toFixed(6)
        v.lon=+(ORIGIN.lon+(DEST.lon-ORIGIN.lon)*t).toFixed(6)
      }
    })

    // 預設勾選第一台車（若可用）
    if (viewVehicles.value.length) selectedIds.value = [String(viewVehicles.value[0].id)]
  }catch(e:any){ml.errMsg=e.message??'載入失敗'}
})
const hasResult=computed(()=>Object.keys(result).length>0)

// 將現有車輛快照轉為 Telemetry 物件（缺值用隨機）
function telemetryFromVehicle(v:any): Telemetry {
  const vid = String(v.id)
  const rawSoc = v.batteryLevel ?? v.batteryPct ?? v.soc ?? noiseRange(vid+':soc', 35, 90)
  const voltage = v.voltage ?? v.packVoltage ?? (typeof v.mv10 === 'number' ? v.mv10 / 10 : undefined)
  const ctrlTemp = v.controllerTemp ?? v.motorTemp ?? v.temperature ?? noiseRange(vid+':ct', 28, 42)
  const speed = v.vehicleSpeed ?? v.speedKph ?? noiseRange(vid+':speed', 0, 22)
  const lat = typeof v.lat === 'number' ? Math.round(v.lat * 1e6) : 0
  const lon = typeof v.lon === 'number' ? Math.round(v.lon * 1e6) : 0

  const mv10 = Math.round((voltage ?? noiseRange(vid+':mv10', 50, 54)) * 10)
  const soc = Math.round(rawSoc)
  const vs = Math.round(speed)
  const ct = Math.round(ctrlTemp)

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
  { label: '容量模型 (battery_capacity.onnx)', value: '/models/battery_capacity.onnx' },
  { label: '風險模型 (battery_risk.onnx)', value: '/models/battery_risk.onnx' },
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
  <div class="min-h-screen bg-gray-50 p-4">
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- 頁面標題 -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">ML 預測分析</h1>
            <p class="mt-1 text-sm text-gray-600">智慧路線規劃與能耗預測</p>
          </div>
          <div class="flex items-center gap-3">
            <!-- 資料來源指示 -->
            <div class="px-3 py-1.5 rounded-md text-xs font-medium"
                 :class="usingRealData ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'">
              <i :class="usingRealData ? 'i-ph-database' : 'i-ph-test-tube'" class="w-4 h-4 inline-block mr-1"></i>
              {{ usingRealData ? '真實資料' : '示範資料' }}
            </div>
            <!-- 重新整理按鈕 -->
            <button
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="refreshData"
              :disabled="vStore.loading"
            >
              <i class="w-4 h-4" :class="vStore.loading ? 'i-ph-spinner animate-spin' : 'i-ph-arrow-clockwise'"></i>
              {{ vStore.loading ? '載入中...' : '重新整理' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 車輛選擇 -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">選擇車輛</h2>
            <p class="text-sm text-gray-600 mt-1">選擇要進行預測分析的車輛（可多選）</p>
          </div>
          <div class="text-sm font-medium text-blue-600">
            已選擇 {{ selectedIds.length }} 台車輛
          </div>
        </div>

        <!-- 搜索和操作區 -->
        <div class="space-y-3 mb-4">
          <!-- 搜尋欄單獨一行 -->
          <div class="relative max-w-md">
            <i class="i-ph-magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"></i>
            <input type="text"
                   v-model="search"
                   placeholder="搜尋車輛 ID 或名稱..."
                   class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <!-- 按鈕區另一行 -->
          <div class="flex items-center gap-3">
            <button
              @click="selectedIds = filteredOptions.map((v:any)=> String(v && v.id)).filter(Boolean)"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
              <i class="i-ph-check-square w-4 h-4 inline-block mr-1"></i>
              全選 ({{ filteredOptions.length }})
            </button>
            <button
              @click="selectedIds = []"
              class="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors">
              <i class="i-ph-x-square w-4 h-4 inline-block mr-1"></i>
              清除
            </button>
            <div class="ml-auto text-sm text-gray-500">
              共 {{ viewVehicles.length }} 台可選
            </div>
          </div>
        </div>

        <!-- 車輛列表 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
          <div v-for="(v, idx) in filteredOptions" :key="(v && v.id) || idx"
               class="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
               :class="selectedIds.includes(String(v?.id)) ? 'bg-blue-50 border-blue-300' : 'bg-white'">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox"
                     :value="String((v && v.id) || '')"
                     v-model="selectedIds"
                     class="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">
                    {{ String(v?.name || v?.id || 'E')[0].toUpperCase() }}
                  </div>
                  <div class="font-medium text-sm text-gray-900 truncate">{{ (v && v.name) || 'E-Bike' }}</div>
                </div>
                <div class="text-xs text-gray-500 font-mono">{{ shortId(v && v.id) }}</div>
                <div v-if="v?.batteryLevel || v?.batteryPct" class="text-xs text-gray-600 mt-1">
                  電量: {{ Math.round(v?.batteryLevel || v?.batteryPct || 0) }}%
                </div>
                <div v-if="v?.vehicleSpeed" class="text-xs text-gray-600">
                  速度: {{ v.vehicleSpeed }} km/h
                </div>
              </div>
            </label>
          </div>
        </div>

        <div v-if="selectedIds.length === 0" class="text-center py-8 text-gray-500">
          <i class="i-ph-bicycle w-12 h-12 mx-auto text-gray-300 mb-2"></i>
          <p>請選擇至少一台車輛進行預測</p>
        </div>
        <!-- 開始預測按鈕 -->
        <div class="mt-6 flex justify-center">
          <button
            @click="runPredict"
            :disabled="ml.loading || selectedIds.length === 0"
            class="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2">
            <i v-if="ml.loading" class="i-ph-spinner w-5 h-5 animate-spin"></i>
            <i v-else class="i-ph-play w-5 h-5"></i>
            {{ ml.loading ? '計算中...' : (hasResult ? '重新計算' : '開始預測') }}
          </button>
        </div>
      </div>

      <!-- 預測結果 -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">預測結果與電池分析</h2>
              <p class="text-sm text-gray-600 mt-1">路線能耗預測與電池健康評估</p>
            </div>
            <div v-if="hasResult" class="text-sm text-gray-600">
              {{ selectedRows.length }} 台車輛
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50">
              <tr class="text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                <th class="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('vehicle')">
                  <div class="flex items-center gap-1">
                    車輛
                    <i v-if="sortConfig.field === 'vehicle'"
                       :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                       class="w-3 h-3"></i>
                    <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
                  </div>
                </th>
                <th class="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('status')">
                  <div class="flex items-center gap-1">
                    狀態
                    <i v-if="sortConfig.field === 'status'"
                       :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                       class="w-3 h-3"></i>
                    <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
                  </div>
                </th>
                <th class="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('health')">
                  <div class="flex items-center gap-1">
                    健康度
                    <i v-if="sortConfig.field === 'health'"
                       :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                       class="w-3 h-3"></i>
                    <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
                  </div>
                </th>
                <th class="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('risk')">
                  <div class="flex items-center gap-1">
                    故障風險
                    <i v-if="sortConfig.field === 'risk'"
                       :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                       class="w-3 h-3"></i>
                    <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
                  </div>
                </th>
                <th class="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('charge')">
                  <div class="flex items-center gap-1">
                    充電建議
                    <i v-if="sortConfig.field === 'charge'"
                       :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                       class="w-3 h-3"></i>
                    <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
                  </div>
                </th>
                <th class="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('cadence')">
                  <div class="flex items-center gap-1">
                    建議踏頻
                    <i v-if="sortConfig.field === 'cadence'"
                       :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                       class="w-3 h-3"></i>
                    <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
                  </div>
                </th>
                <th class="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" @click="handleSort('gearRatio')">
                  <div class="flex items-center gap-1">
                    建議變速比
                    <i v-if="sortConfig.field === 'gearRatio'"
                       :class="sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                       class="w-3 h-3"></i>
                    <i v-else class="i-ph-caret-up-down w-3 h-3 opacity-30"></i>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(v, idx) in selectedRows" :key="(v && v.id) || idx">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                      {{ String(v?.name || v?.id || 'E')[0].toUpperCase() }}
                    </div>
                    <div class="ml-3">
                      <div class="text-sm font-medium text-gray-900">{{ (v && v.name) || 'E-Bike' }}</div>
                      <div class="text-sm text-gray-500 font-mono">{{ (v && v.id) || '—' }}</div>
                    </div>
                  </div>
                </td>
                <!-- 狀態 -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                        :class="v?.status === 'in-use' ? 'bg-blue-100 text-blue-800' :
                                v?.status === 'available' ? 'bg-green-100 text-green-800' :
                                v?.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'">
                    {{ v?.status === 'in-use' ? '使用中' :
                       v?.status === 'available' ? '可用' :
                       v?.status === 'maintenance' ? '維護中' : v?.status || '未知' }}
                  </span>
                </td>
                <!-- 電池健康度 -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center" v-if="ml.batteries?.find(b => b?.id === String(v?.id))">
                    <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div class="h-2 rounded-full transition-all"
                           :class="Number(ml.batteries.find(b => b?.id === String(v?.id))?.health) >= 80 ? 'bg-green-500' :
                                   Number(ml.batteries.find(b => b?.id === String(v?.id))?.health) >= 60 ? 'bg-yellow-500' : 'bg-red-500'"
                           :style="{ width: `${Math.max(0, Math.min(100, Number(ml.batteries.find(b => b?.id === String(v?.id))?.health) || 0))}%` }"></div>
                    </div>
                    <span class="text-sm font-medium text-gray-900">{{ Number(ml.batteries.find(b => b?.id === String(v?.id))?.health || 0).toFixed(1) }}%</span>
                  </div>
                  <span v-else class="text-sm text-gray-500">—</span>
                </td>
                <!-- 故障風險 -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span v-if="ml.batteries?.find(b => b?.id === String(v?.id))"
                        class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                        :class="Number(ml.batteries.find(b => b?.id === String(v?.id))?.faultP || 0) < 0.1 ? 'bg-green-100 text-green-800' :
                                Number(ml.batteries.find(b => b?.id === String(v?.id))?.faultP || 0) < 0.3 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'">
                    {{ (Number(ml.batteries.find(b => b?.id === String(v?.id))?.faultP || 0) * 100).toFixed(1) }}%
                  </span>
                  <span v-else class="text-sm text-gray-500">—</span>
                </td>
                <!-- 充電建議 -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span v-if="v && result[String(v.id)]?.nextCharge"
                        class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                        :class="result[String(v.id)].nextCharge === '立即充電' ? 'bg-red-100 text-red-800' :
                                result[String(v.id)].nextCharge === '建議充電' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'">
                    {{ result[String(v.id)].nextCharge }}
                  </span>
                  <span v-else class="text-sm text-gray-500">{{ ml.loading ? '...' : '—' }}</span>
                </td>
                <!-- 建議踏頻 -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                  <template v-if="v?.status === 'in-use'">
                    {{ v && result[String(v.id)]?.cadence != null ? Number(result[String(v.id)].cadence).toFixed(2) : (ml.loading ? '...' : '—') }}
                    <div v-if="v && result[String(v.id)]?.cadence != null" class="text-xs text-gray-500">rpm</div>
                  </template>
                  <span v-else class="text-sm text-gray-400">—</span>
                </td>
                <!-- 建議變速比 -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                  <template v-if="v?.status === 'in-use'">
                    {{ (v && result[String(v.id)]?.gearRatio) ?? (ml.loading ? '...' : '—') }}
                  </template>
                  <span v-else class="text-sm text-gray-400">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!hasResult" class="py-12 text-center">
          <div v-if="ml.loading" class="flex flex-col items-center gap-3 text-gray-600">
            <i class="i-ph-spinner w-8 h-8 animate-spin text-blue-600"></i>
            <span>計算中，請稍候...</span>
          </div>
          <div v-else class="text-gray-500">
            <i class="i-ph-chart-line w-12 h-12 mx-auto mb-3 text-gray-300"></i>
            <p>尚無預測結果</p>
            <p class="text-sm text-gray-400 mt-1">選擇車輛後點擊「開始預測」</p>
          </div>
        </div>
      </div>

      <!-- 錯誤訊息 -->
      <div v-if="ml.errMsg" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <i class="i-ph-warning-circle w-6 h-6 text-red-500"></i>
          <div>
            <h3 class="font-medium text-red-900">預測失敗</h3>
            <p class="text-sm text-red-700 mt-1">{{ ml.errMsg }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 簡化的樣式 */
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
    }
  }
}
</script>
