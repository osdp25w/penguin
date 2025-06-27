/// <reference types="google.maps" />
<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'

/* ---------- Props ---------- */
const props = withDefaults(defineProps<{
  bikes : { id: string; lat: number; lon: number; soc?: number }[]
  height?: string
}>(), { bikes: () => [], height: '100%' })

/* ---------- Refs ---------- */
const mapEl   = ref<HTMLDivElement | null>(null)
let   map     : google.maps.Map | null = null
const markers = new Map<string, google.maps.Marker>()

/* ---------- 花蓮市中心 & 精簡邊界 ---------- */
const HUALIEN_CENTER = { lat: 23.977, lng: 121.605 }
const HUALIEN_BOUNDS = { north: 23.995, south: 23.955, west: 121.585, east: 121.625 } // ← 收窄

/* ---------- Init Google Map ---------- */
const initMap = async () => {
  const loader = new Loader({
    apiKey : import.meta.env.VITE_GOOGLE_MAPS_KEY as string,
    version: 'weekly'
  })
  await loader.load()

  map = new google.maps.Map(mapEl.value as HTMLElement, {
    center: HUALIEN_CENTER,
    zoom  : 14,
    restriction      : { latLngBounds: HUALIEN_BOUNDS, strictBounds: false },
    mapTypeControl   : false,
    streetViewControl: false,
    fullscreenControl: false
  })

  updateMarkers(props.bikes)
}

/* ---------- Icon helper ---------- */
const COLORS = ['#4ade80','#3b82f6','#facc15','#fb7185','#a78bfa','#34d399']
const makeIcon = (color: string) => ({
  path        : google.maps.SymbolPath.CIRCLE,
  scale       : 22,
  fillColor   : color,
  fillOpacity : 1,
  strokeWeight: 4,
  strokeColor : '#ffffff'
})

/* ---------- Sync markers ---------- */
const updateMarkers = (bikes: typeof props.bikes) => {
  if (!map) return

  bikes.forEach((b, idx) => {
    const key   = b.id
    const color = COLORS[idx % COLORS.length]

    if (markers.has(key)) {
      markers.get(key)!.setPosition({ lat: b.lat, lng: b.lon })
    } else {
      const marker = new google.maps.Marker({
        position: { lat: b.lat, lng: b.lon },
        map,
        title   : `#${b.id}`,
        label   : { text: `${idx+1}`, color:'#000', fontSize:'14px', fontWeight:'bold' },
        icon    : makeIcon(color)
      })
      markers.set(key, marker)
    }
  })

  markers.forEach((m, key) => {
    if (!bikes.find(b => b.id === key)) {
      m.setMap(null)
      markers.delete(key)
    }
  })
}

onMounted(initMap)
watch(() => props.bikes, updateMarkers, { deep:true })
</script>

<template>
  <div :style="{ width:'100%', height }" ref="mapEl" />
</template>
