<template>
  <div ref="mapContainer" class="w-full h-full relative">
    <!-- Loading 狀態 -->
    <div 
      v-if="loading" 
      class="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-10"
    >
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <div class="text-sm text-gray-600 dark:text-gray-600">載入地圖中...</div>
      </div>
    </div>

    <!-- 錯誤狀態 -->
    <div 
      v-if="error" 
      class="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-10"
    >
      <div class="text-center p-4">
        <MapIcon class="mx-auto h-12 w-12 text-red-400 mb-2" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">地圖載入失敗</h3>
        <p class="text-gray-600 dark:text-gray-600 text-sm">{{ error }}</p>
        <button 
          @click="initializeMap"
          class="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          重新載入
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { MapIcon } from 'lucide-vue-next'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Site } from '@/types/site'
import type { Vehicle } from '@/types/vehicle'

interface Props {
  sites?: Site[]
  vehicles?: Vehicle[]
  selected?: Site | Vehicle
  displayMode?: 'sites' | 'vehicles' | 'history'
  vehicleTraces?: Record<string, Array<{lat: number, lon: number, timestamp: string}>>
  defaultCenter?: { lat: number, lng: number, zoom: number }
}

interface Emits {
  select: [id: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 響應式狀態
const mapContainer = ref<HTMLElement>()
const loading = ref(true)
const error = ref<string | null>(null)
let map: maplibregl.Map | null = null
let popup: maplibregl.Popup | null = null
let activeTraceIds: string[] = []

// 環境變數
const defaultMapCenter = import.meta.env.VITE_MAP_CENTER?.split(',').map(Number) || [23.8, 121.6]
const defaultMapZoom = Number(import.meta.env.VITE_MAP_ZOOM) || 10
const emapLayer = import.meta.env.VITE_EMAP_LAYER || 'EMAP'
const emapMatrixSet = import.meta.env.VITE_EMAP_MATRIXSET || 'GoogleMapsCompatible'

// 計算使用的地圖中心點和縮放級別
const mapCenter = props.defaultCenter 
  ? [props.defaultCenter.lat, props.defaultCenter.lng] 
  : defaultMapCenter
const mapZoom = props.defaultCenter?.zoom || defaultMapZoom

// WMTS URL
const wmtsUrl = `https://wmts.nlsc.gov.tw/wmts/${emapLayer}/default/${emapMatrixSet}/{z}/{y}/{x}`

async function initializeMap(): Promise<void> {
  if (!mapContainer.value) return
  
  loading.value = true
  error.value = null
  
  try {
    // 建立 MapLibre 地圖
    map = new maplibregl.Map({
      container: mapContainer.value,
      style: {
        version: 8,
        sources: {},
        layers: []
      },
      center: [mapCenter[1], mapCenter[0]], // MapLibre 用 [lng, lat]
      zoom: mapZoom,
      attributionControl: true
    })

    // 等待地圖載入完成
    await new Promise((resolve, reject) => {
      map!.on('load', resolve)
      map!.on('error', reject)
      
      // 5秒超時
      setTimeout(() => reject(new Error('地圖載入超時')), 5000)
    })

    // 加入 NLSC EMAP 圖層
    map.addSource('emap', {
      type: 'raster',
      tiles: [wmtsUrl],
      tileSize: 256,
      attribution: '© 內政部國土測繪中心（NLSC）'
    })

    map.addLayer({
      id: 'emap',
      type: 'raster',
      source: 'emap'
    })

    // 根據顯示模式加入對應圖層
    if (props.displayMode === 'vehicles') {
      addVehiclesLayer()
      bindVehicleEvents()
    } else {
      addSitesLayer()
      bindSiteEvents()
    }

    loading.value = false
  } catch (err) {
    console.error('[MapLibre] 初始化失敗:', err)
    error.value = err instanceof Error ? err.message : '未知錯誤'
    loading.value = false
  }
}

function addSitesLayer(): void {
  if (!map || !props.sites) return

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: props.sites.map(site => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [site.location.lng, site.location.lat]
      },
      properties: {
        id: site.id,
        name: site.name,
        status: site.status,
        brand: site.brand,
        vehicleCount: site.vehicleCount,
        availableCount: site.availableCount,
        type: 'site'
      }
    }))
  }

  // 移除既有圖層
  if (map.getSource('sites')) {
    map.removeLayer('sites-layer')
    map.removeSource('sites')
  }

  // 加入資料源
  map.addSource('sites', {
    type: 'geojson',
    data: geojson
  })

  // 加入圓點圖層
  map.addLayer({
    id: 'sites-layer',
    type: 'circle',
    source: 'sites',
    paint: {
      'circle-radius': 8,
      'circle-color': [
        'match',
        ['get', 'status'],
        'active', '#10b981',
        'maintenance', '#f59e0b', 
        'offline', '#ef4444',
        '#6b7280'
      ],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2
    }
  })
}

function addVehiclesLayer(): void {
  if (!map || !props.vehicles) return

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: props.vehicles
      .filter(vehicle => vehicle.location) // 只顯示有位置資訊的車輛
      .map(vehicle => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [vehicle.location!.lng, vehicle.location!.lat]
        },
        properties: {
          id: vehicle.id,
          status: vehicle.status,
          batteryLevel: vehicle.batteryLevel,
          brand: vehicle.brand,
          siteId: vehicle.siteId,
          model: vehicle.model,
          type: 'vehicle'
        }
      }))
  }

  // 移除既有圖層
  if (map.getSource('vehicles')) {
    map.removeLayer('vehicles-layer')
    map.removeSource('vehicles')
  }

  // 加入資料源
  map.addSource('vehicles', {
    type: 'geojson',
    data: geojson
  })

  // 加入圓點圖層
  map.addLayer({
    id: 'vehicles-layer',
    type: 'circle',
    source: 'vehicles',
    paint: {
      'circle-radius': [
        'case',
        ['==', ['get', 'status'], 'in-use'], 12, // 使用中的車輛較大
        10
      ],
      'circle-color': [
        'match',
        ['get', 'status'],
        'available', '#10b981',   // 綠色 - 可用
        'in-use', '#3b82f6',     // 藍色 - 使用中
        'rented', '#8b5cf6',     // 紫色 - 已租借
        'maintenance', '#f59e0b', // 黃色 - 維護中
        'charging', '#06b6d4',   // 青色 - 充電中
        'low-battery', '#ef4444', // 紅色 - 低電量
        '#6b7280'                // 灰色 - 其他
      ],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-opacity': 0.9
    }
  })

  // 加入車輛編號標籤圖層
  map.addLayer({
    id: 'vehicles-labels',
    type: 'symbol',
    source: 'vehicles',
    layout: {
      'text-field': ['get', 'id'],
      'text-size': 10,
      'text-offset': [0, 0],
      'text-anchor': 'center',
      'text-allow-overlap': true,
      'text-ignore-placement': true
    },
    paint: {
      'text-color': '#000000',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5
    }
  })
}

function bindSiteEvents(): void {
  if (!map) return
  
  map.on('click', 'sites-layer', handleClick)
  map.on('mouseenter', 'sites-layer', () => {
    if (map) map.getCanvas().style.cursor = 'pointer'
  })
  map.on('mouseleave', 'sites-layer', () => {
    if (map) map.getCanvas().style.cursor = ''
  })
}

function bindVehicleEvents(): void {
  if (!map) return
  
  // 為車輛圓點層添加事件
  map.on('click', 'vehicles-layer', handleClick)
  map.on('mouseenter', 'vehicles-layer', () => {
    if (map) map.getCanvas().style.cursor = 'pointer'
  })
  map.on('mouseleave', 'vehicles-layer', () => {
    if (map) map.getCanvas().style.cursor = ''
  })
  
  // 為車輛標籤層也添加相同事件
  map.on('click', 'vehicles-labels', handleClick)
  map.on('mouseenter', 'vehicles-labels', () => {
    if (map) map.getCanvas().style.cursor = 'pointer'
  })
  map.on('mouseleave', 'vehicles-labels', () => {
    if (map) map.getCanvas().style.cursor = ''
  })
}

function handleClick(e: maplibregl.MapMouseEvent): void {
  const feature = e.features?.[0]
  if (feature?.properties && map) {
    const properties = feature.properties
    
    // 關閉現有的彈出窗格
    if (popup) {
      popup.remove()
    }
    
    // 取得狀態文字和樣式 (使用與 showVehiclePopup 相同的邏輯)
    const getStatusText = (status: string) => {
      const statusMap: Record<string, string> = {
        '可租借': '可租借',
        '使用中': '使用中', 
        '離線': '離線',
        '維修': '維修',
        '低電量': '低電量',
        'available': '可租借',
        'in-use': '使用中',
        'rented': '使用中',
        'maintenance': '維修',
        'charging': '充電中',
        'low-battery': '低電量'
      }
      return statusMap[status] || status
    }
    
    const getStatusBadgeClass = (status: string) => {
      const classMap: Record<string, string> = {
        '可租借': 'bg-green-100 text-green-800',
        '使用中': 'bg-blue-100 text-blue-800', 
        '離線': 'bg-gray-100 text-gray-800',
        '維修': 'bg-yellow-100 text-yellow-800',
        '低電量': 'bg-red-100 text-red-800',
        'available': 'bg-green-100 text-green-800',
        'in-use': 'bg-blue-100 text-blue-800',
        'rented': 'bg-blue-100 text-blue-800',
        'maintenance': 'bg-yellow-100 text-yellow-800',
        'charging': 'bg-cyan-100 text-cyan-800',
        'low-battery': 'bg-red-100 text-red-800'
      }
      return classMap[status] || 'bg-gray-100 text-gray-800'
    }
    
    const getRelativeTime = (isoString: string) => {
      const now = new Date()
      const time = new Date(isoString)
      const diff = now.getTime() - time.getTime()
      const minutes = Math.floor(diff / (1000 * 60))
      
      if (minutes < 1) return '剛剛'
      if (minutes < 60) return `${minutes}分鐘前`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}小時前`
      const days = Math.floor(hours / 24)
      return `${days}天前`
    }

    // 創建彈出窗格內容 (調整後的美觀格式)
    const popupContent = `
      <div class="p-2 w-64">
        <div class="mb-2">
          <h4 class="text-base font-semibold text-gray-900">${properties.id}</h4>
        </div>
        
        <div class="grid grid-cols-2 gap-1.5 text-xs">
          <div class="bg-gray-50 p-1.5 rounded text-center">
            <div class="text-gray-600 mb-1">狀態</div>
            <span class="${getStatusBadgeClass(properties.status)} px-1.5 py-0.5 rounded-full text-xs font-medium">
              ${getStatusText(properties.status)}
            </span>
          </div>
          <div class="bg-gray-50 p-1.5 rounded text-center">
            <div class="text-gray-600 mb-1">電量</div>
            <div class="font-medium text-gray-900">${properties.batteryPct || properties.battery || 0}%</div>
          </div>
          <div class="bg-gray-50 p-1.5 rounded text-center">
            <div class="text-gray-600 mb-1">速度</div>
            <div class="font-medium text-gray-900">${properties.speedKph || properties.speed || 0} km/h</div>
          </div>
          <div class="bg-gray-50 p-1.5 rounded text-center">
            <div class="text-gray-600 mb-1">經緯度</div>
            <div class="font-medium text-gray-900 font-mono">${properties.lat?.toFixed(6) || 'N/A'}, ${properties.lng || properties.lon ? (properties.lng || properties.lon).toFixed(6) : 'N/A'}</div>
          </div>
          <div class="bg-gray-50 p-1.5 rounded col-span-2 text-center">
            <div class="text-gray-600 mb-1">最後更新</div>
            <div class="font-medium text-gray-900">${getRelativeTime(properties.lastSeen || new Date().toISOString())}</div>
          </div>
          ${(properties.status === '使用中' || properties.status === 'in-use') && properties.registeredUser ? `
          <div class="bg-blue-50 p-1.5 rounded col-span-2 text-center">
            <div class="text-gray-600 mb-1">使用者</div>
            <div class="font-medium text-blue-700">${properties.registeredUser}</div>
          </div>
          ` : ''}
        </div>
      </div>
    `
    
    // 創建並顯示彈出窗格
    popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: [0, -10],
      maxWidth: '280px'
    })
      .setLngLat(feature.geometry.coordinates as [number, number])
      .setHTML(popupContent)
      .addTo(map)
      
    // 同時發送選擇事件（保持原有功能）
    emit('select', properties.id)
  }
}

// 輔助函數：獲取狀態顯示文字
function getStatusDisplayText(status: string): string {
  const statusMap = {
    'available': '可用',
    'in-use': '使用中',
    'rented': '已租借',
    'maintenance': '維護中',
    'charging': '充電中',
    'low-battery': '低電量'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

// 輔助函數：獲取彈出窗格狀態樣式
function getPopupStatusClass(status: string): string {
  const statusClasses = {
    'available': 'bg-green-100 text-green-800',
    'in-use': 'bg-blue-100 text-blue-800', 
    'rented': 'bg-purple-100 text-purple-800',
    'maintenance': 'bg-yellow-100 text-yellow-800',
    'charging': 'bg-cyan-100 text-cyan-800',
    'low-battery': 'bg-red-100 text-red-800'
  }
  return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'
}

// 監聽資料變化
watch(() => props.sites, () => {
  if (map && props.displayMode !== 'vehicles') {
    addSitesLayer()
  }
}, { deep: true })

watch(() => props.vehicles, () => {
  if (map && props.displayMode === 'vehicles') {
    addVehiclesLayer()
  }
}, { deep: true })

watch(() => props.displayMode, (newMode) => {
  if (!map) return
  
  // 清除所有圖層
  clearAllLayers()
  
  // 根據新模式添加對應圖層
  if (newMode === 'vehicles') {
    addVehiclesLayer()
    bindVehicleEvents()
  } else if (newMode === 'history') {
    addVehicleTracesLayer()
  } else {
    addSitesLayer()
    bindSiteEvents()
  }
})

watch(() => props.vehicleTraces, () => {
  if (!map || props.displayMode !== 'history') return
  addVehicleTracesLayer()
}, { deep: true })

// 監聽選中項目變化，自動移動地圖到該位置
watch(() => props.selected, (selectedItem) => {
  if (!map || !selectedItem) return

  // 如果選中的是軌跡（從 focusTrace 函數傳來）
  if ('type' in selectedItem && selectedItem.type === 'trace' && 'center' in selectedItem) {
    map.flyTo({
      center: [selectedItem.center.lng, selectedItem.center.lat],
      zoom: selectedItem.center.zoom,
      duration: 1000
    })
  }
  // 如果選中的是車輛，移動地圖到車輛位置
  else if ('lat' in selectedItem && 'lon' in selectedItem) {
    map.flyTo({
      center: [selectedItem.lon, selectedItem.lat],
      zoom: 16,
      duration: 1000
    })

    // 如果是車輛模式，可以高亮該車輛（通過更新圖層樣式）
    if (props.displayMode === 'vehicles') {
      highlightVehicle(selectedItem.id)
    }
  }
  // 如果選中的是站點，移動地圖到站點位置
  else if ('location' in selectedItem) {
    map.flyTo({
      center: [selectedItem.location.lng, selectedItem.location.lat],
      zoom: 15,
      duration: 1000
    })
  }
}, { deep: true })

function removeTraceLayers(traceId: string): void {
  if (!map) return

  const traceLineId = `trace-line-${traceId}`
  if (map.getLayer(traceLineId)) {
    map.removeLayer(traceLineId)
  }

  const tracePointsId = `trace-points-${traceId}`
  if (map.getLayer(tracePointsId)) {
    map.removeLayer(tracePointsId)
  }

  const traceStartId = `trace-start-${traceId}`
  if (map.getLayer(traceStartId)) {
    map.removeLayer(traceStartId)
  }

  const traceEndId = `trace-end-${traceId}`
  if (map.getLayer(traceEndId)) {
    map.removeLayer(traceEndId)
  }

  const traceLabelId = `trace-label-${traceId}`
  if (map.getLayer(traceLabelId)) {
    map.removeLayer(traceLabelId)
  }

  const traceSourceId = `trace-${traceId}`
  if (map.getSource(traceSourceId)) {
    map.removeSource(traceSourceId)
  }

  const tracePointsSourceId = `trace-points-${traceId}`
  if (map.getSource(tracePointsSourceId)) {
    map.removeSource(tracePointsSourceId)
  }
}

function clearTraceLayers(): void {
  if (!map || activeTraceIds.length === 0) return
  activeTraceIds.forEach(removeTraceLayers)
  activeTraceIds = []
}

function clearAllLayers(): void {
  if (!map) return
  
  // 清除站點圖層
  if (map.getSource('sites')) {
    map.removeLayer('sites-layer')
    map.removeSource('sites')
  }
  
  // 清除車輛圖層
  if (map.getSource('vehicles')) {
    if (map.getLayer('vehicles-labels')) map.removeLayer('vehicles-labels')
    map.removeLayer('vehicles-layer')
    map.removeSource('vehicles')
  }
  
  // 清除選中車輛高亮圖層
  if (map.getLayer('vehicles-selected')) {
    map.removeLayer('vehicles-selected')
  }
  if (map.getSource('vehicles-selected')) {
    map.removeSource('vehicles-selected')
  }
  clearTraceLayers()
}

// 高亮選中的車輛
function highlightVehicle(vehicleId: string): void {
  if (!map) return
  
  // 移除之前的高亮
  if (map.getLayer('vehicles-selected')) {
    map.removeLayer('vehicles-selected')
  }
  if (map.getSource('vehicles-selected')) {
    map.removeSource('vehicles-selected')
  }
  
  // 找到選中的車輛
  const selectedVehicle = props.vehicles?.find(v => v.id === vehicleId)
  if (!selectedVehicle) return
  
  // 添加高亮圖層
  map.addSource('vehicles-selected', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { id: selectedVehicle.id },
        geometry: {
          type: 'Point',
          coordinates: [selectedVehicle.lon, selectedVehicle.lat]
        }
      }]
    }
  })
  
  // 添加高亮圓圈
  map.addLayer({
    id: 'vehicles-selected',
    type: 'circle',
    source: 'vehicles-selected',
    paint: {
      'circle-radius': 25,
      'circle-color': '#3b82f6',
      'circle-opacity': 0.3,
      'circle-stroke-width': 3,
      'circle-stroke-color': '#1d4ed8'
    }
  })
  
  // 顯示車輛資訊彈窗
  showVehiclePopup(selectedVehicle)
}

// 顯示車輛資訊彈窗
function showVehiclePopup(vehicle: any): void {
  if (!map || !vehicle) return
  
  // 移除之前的彈窗
  if (popup) {
    popup.remove()
  }
  
  // 取得狀態文字和樣式
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      '可租借': '可租借',
      '使用中': '使用中', 
      '離線': '離線',
      '維修': '維修',
      '低電量': '低電量'
    }
    return statusMap[status] || status
  }
  
  const getStatusBadgeClass = (status: string) => {
    const classMap: Record<string, string> = {
      '可租借': 'bg-green-100 text-green-800',
      '使用中': 'bg-blue-100 text-blue-800', 
      '離線': 'bg-gray-100 text-gray-800',
      '維修': 'bg-yellow-100 text-yellow-800',
      '低電量': 'bg-red-100 text-red-800'
    }
    return classMap[status] || 'bg-gray-100 text-gray-800'
  }
  
  const getRelativeTime = (isoString: string) => {
    const now = new Date()
    const time = new Date(isoString)
    const diff = now.getTime() - time.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return '剛剛'
    if (minutes < 60) return `${minutes}分鐘前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小時前`
    const days = Math.floor(hours / 24)
    return `${days}天前`
  }
  
  // 創建彈窗內容 (與地圖點擊popup保持一致的樣式)
  const popupContent = `
    <div class="p-2 w-64">
      <div class="mb-2">
        <h4 class="text-base font-semibold text-gray-900">${vehicle.id}</h4>
      </div>
      
      <div class="grid grid-cols-2 gap-1.5 text-xs">
        <div class="bg-gray-50 p-1.5 rounded text-center">
          <div class="text-gray-600 mb-1">狀態</div>
          <span class="${getStatusBadgeClass(vehicle.status)} px-1.5 py-0.5 rounded-full text-xs font-medium">
            ${getStatusText(vehicle.status)}
          </span>
        </div>
        <div class="bg-gray-50 p-1.5 rounded text-center">
          <div class="text-gray-600 mb-1">電量</div>
          <div class="font-medium text-gray-900">${vehicle.batteryPct}%</div>
        </div>
        <div class="bg-gray-50 p-1.5 rounded text-center">
          <div class="text-gray-600 mb-1">速度</div>
          <div class="font-medium text-gray-900">${vehicle.speedKph || 0} km/h</div>
        </div>
        <div class="bg-gray-50 p-1.5 rounded text-center">
          <div class="text-gray-600 mb-1">經緯度</div>
          <div class="font-medium text-gray-900 font-mono">${vehicle.lat?.toFixed(6) || 'N/A'}, ${vehicle.lon?.toFixed(6) || 'N/A'}</div>
        </div>
        <div class="bg-gray-50 p-1.5 rounded col-span-2 text-center">
          <div class="text-gray-600 mb-1">最後更新</div>
          <div class="font-medium text-gray-900">${getRelativeTime(vehicle.lastSeen || new Date().toISOString())}</div>
        </div>
        ${(vehicle.status === '使用中' || vehicle.status === 'in-use') && vehicle.registeredUser ? `
        <div class="bg-blue-50 p-1.5 rounded col-span-2 text-center">
          <div class="text-gray-600 mb-1">使用者</div>
          <div class="font-medium text-blue-700">${vehicle.registeredUser}</div>
        </div>
        ` : ''}
      </div>
    </div>
  `
  
  // 創建並顯示彈窗
  popup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: false,
    maxWidth: '280px'
  })
    .setLngLat([vehicle.lon, vehicle.lat])
    .setHTML(popupContent)
    .addTo(map)
}

// 添加車輛軌跡圖層
function addVehicleTracesLayer(): void {
  if (!map || !props.vehicleTraces) return
  clearTraceLayers()
  
  // 定義不同車輛的顏色
  const vehicleColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  
  let colorIndex = 0
  
  // 為每台車輛添加軌跡線
  Object.entries(props.vehicleTraces).forEach(([vehicleId, trace]) => {
    if (!trace || trace.length < 2) return
    
    const color = vehicleColors[colorIndex % vehicleColors.length]
    colorIndex++
    
    // 創建軌跡線的 GeoJSON
    const lineString = {
      type: 'Feature' as const,
      properties: { vehicleId },
      geometry: {
        type: 'LineString' as const,
        coordinates: trace.map(point => [point.lon, point.lat])
      }
    }
    
    // 添加軌跡線圖層
    map.addSource(`trace-${vehicleId}`, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [lineString]
      }
    })
    
    map.addLayer({
      id: `trace-line-${vehicleId}`,
      type: 'line',
      source: `trace-${vehicleId}`,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': color,
        'line-width': 3,
        'line-opacity': 0.8
      }
    })
    
    // 添加軌跡點圖層
    const points = trace.map((point, index) => ({
      type: 'Feature' as const,
      properties: { 
        vehicleId, 
        timestamp: point.timestamp,
        isStart: index === 0,
        isEnd: index === trace.length - 1
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [point.lon, point.lat]
      }
    }))
    
    map.addSource(`trace-points-${vehicleId}`, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: points
      }
    })
    
    // 起點標記（大圓點）
    map.addLayer({
      id: `trace-start-${vehicleId}`,
      type: 'circle',
      source: `trace-points-${vehicleId}`,
      filter: ['==', ['get', 'isStart'], true],
      paint: {
        'circle-radius': 8,
        'circle-color': color,
        'circle-opacity': 0.9,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#FFFFFF'
      }
    })
    
    // 終點標記（方形標記）
    map.addLayer({
      id: `trace-end-${vehicleId}`,
      type: 'circle',
      source: `trace-points-${vehicleId}`,
      filter: ['==', ['get', 'isEnd'], true],
      paint: {
        'circle-radius': 8,
        'circle-color': color,
        'circle-opacity': 0.9,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#FFFFFF'
      }
    })
    
    // 中間點（小圓點）
    map.addLayer({
      id: `trace-points-${vehicleId}`,
      type: 'circle',
      source: `trace-points-${vehicleId}`,
      filter: ['all', ['!=', ['get', 'isStart'], true], ['!=', ['get', 'isEnd'], true]],
      paint: {
        'circle-radius': 4,
        'circle-color': color,
        'circle-opacity': 0.7,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#FFFFFF'
      }
    })
    
    // 車輛ID標籤
    map.addLayer({
      id: `trace-label-${vehicleId}`,
      type: 'symbol',
      source: `trace-points-${vehicleId}`,
      filter: ['==', ['get', 'isEnd'], true],
      layout: {
        'text-field': vehicleId,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-offset': [0, -2],
        'text-anchor': 'bottom'
      },
      paint: {
        'text-color': '#333333',
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 2
      }
    })

    activeTraceIds.push(vehicleId)
  })
  
  bindTraceEvents()
}

// 綁定軌跡相關事件
function bindTraceEvents(): void {
  if (!map || !props.vehicleTraces) return
  
  Object.keys(props.vehicleTraces).forEach(vehicleId => {
    // 軌跡點點擊事件
    map.on('click', `trace-points-${vehicleId}`, (e) => {
      if (!e.features?.[0]) return
      
      const feature = e.features[0]
      const { timestamp, vehicleId: id } = feature.properties as any
      
      // 格式化時間
      const time = new Date(timestamp).toLocaleString('zh-TW', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      // 顯示軌跡點資訊
      if (popup) popup.remove()
      
      popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: '280px'
      })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div class="p-2 w-64">
            <div class="mb-2">
              <h4 class="text-base font-semibold text-gray-900">${id}</h4>
            </div>
            
            <div class="grid grid-cols-1 gap-1.5 text-xs">
              <div class="bg-gray-50 p-1.5 rounded text-center">
                <div class="text-gray-600 mb-1">軌跡記錄時間</div>
                <div class="font-medium text-gray-900">${time}</div>
              </div>
            </div>
          </div>
        `)
        .addTo(map)
    })
    
    // 懸停效果
    map.on('mouseenter', `trace-line-${vehicleId}`, () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    
    map.on('mouseleave', `trace-line-${vehicleId}`, () => {
      map.getCanvas().style.cursor = ''
    })
  })
}

// 生命週期
onMounted(async () => {
  await nextTick()
  await initializeMap()
})

onUnmounted(() => {
  if (popup) {
    popup.remove()
    popup = null
  }
  map?.remove()
  map = null
})
</script>
