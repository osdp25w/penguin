<template>
  <div ref="mapContainer" class="w-full h-full relative">
    <!-- Loading 狀態 -->
    <div 
      v-if="loading" 
      class="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-10"
    >
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <div class="text-sm text-gray-600 dark:text-gray-400">載入地圖中...</div>
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
        <p class="text-gray-600 dark:text-gray-400 text-sm">{{ error }}</p>
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

interface Props {
  sites: Site[]
  selected?: Site
}

interface Emits {
  select: [siteId: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 響應式狀態
const mapContainer = ref<HTMLElement>()
const loading = ref(true)
const error = ref<string | null>(null)
let map: maplibregl.Map | null = null

// 環境變數
const mapCenter = import.meta.env.VITE_MAP_CENTER?.split(',').map(Number) || [23.8, 121.6]
const mapZoom = Number(import.meta.env.VITE_MAP_ZOOM) || 10
const emapLayer = import.meta.env.VITE_EMAP_LAYER || 'EMAP'
const emapMatrixSet = import.meta.env.VITE_EMAP_MATRIXSET || 'GoogleMapsCompatible'

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

    // 加入站點圖層
    addSitesLayer()
    
    // 綁定點擊事件
    map.on('click', 'sites-layer', handleSiteClick)
    map.on('mouseenter', 'sites-layer', () => {
      if (map) map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'sites-layer', () => {
      if (map) map.getCanvas().style.cursor = ''
    })

    loading.value = false
  } catch (err) {
    console.error('[MapLibre] 初始化失敗:', err)
    error.value = err instanceof Error ? err.message : '未知錯誤'
    loading.value = false
  }
}

function addSitesLayer(): void {
  if (!map) return

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
        availableCount: site.availableCount
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

function handleSiteClick(e: maplibregl.MapMouseEvent): void {
  const feature = e.features?.[0]
  if (feature?.properties?.id) {
    emit('select', feature.properties.id)
  }
}

// 監聽站點資料變化
watch(() => props.sites, () => {
  if (map) {
    addSitesLayer()
  }
}, { deep: true })

// 生命週期
onMounted(async () => {
  await nextTick()
  await initializeMap()
})

onUnmounted(() => {
  map?.remove()
  map = null
})
</script>