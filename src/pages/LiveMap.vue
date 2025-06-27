<script setup lang="ts">
import { ref, computed } from 'vue'
import BikeMap from '@/components/map/BikeMap.vue'

/* ---------- Demo：隨機 20 台車，散佈在中心 800m 內 ---------- */
const CENTER = { lat: 23.977, lon: 121.605 }
const RADIUS_METERS = 800

/** 將公尺轉成緯度差／經度差（簡化球體地球模型） */
const metersToLat = (m: number) => m / 111_320
const metersToLon = (m: number, lat: number) =>
  m / (111_320 * Math.cos((lat * Math.PI) / 180))

function randomPointNear(center:{lat:number;lon:number}, radiusM:number){
  const r = Math.random() * radiusM
  const θ = Math.random() * 2 * Math.PI
  const dx = r * Math.cos(θ)
  const dy = r * Math.sin(θ)
  return {
    lat: center.lat + metersToLat(dy),
    lon: center.lon + metersToLon(dx, center.lat)
  }
}

const demoBikes = ref(
  Array.from({ length: 20 }).map((_, i) => {
    const p = randomPointNear(CENTER, RADIUS_METERS)
    return { id:`demo-${i+1}`, lat: p.lat, lon: p.lon }
  })
)

/* ---------- 將 demo 資料餵進地圖 ---------- */
const bikeMarkers = computed(() => demoBikes.value)

/* 若未來接上真實 API，替換 bikeMarkers 即可 */
</script>

<template>
  <section class="h-[calc(100vh-3.5rem)] p-4 flex flex-col gap-4">
    <h2 class="text-xl font-bold">花蓮腳踏車即時位置（Demo）</h2>
    <BikeMap :bikes="bikeMarkers" class="flex-1 rounded-lg overflow-hidden" />
  </section>
</template>
