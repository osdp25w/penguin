<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'

/* 註冊 ECharts 元件 */
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = withDefaults(defineProps<{
  labels : string[]
  values : number[]
  loading?: boolean
}>(), { labels: () => [], values: () => [], loading: false })

const option = computed(() => ({
  tooltip: { trigger: 'axis' },
  xAxis  : { type:'category', data: props.labels, axisLabel:{ color:'#a1a1aa' } },
  yAxis  : { max:100, min:0, name:'%', splitLine:{ show:false } },
  series : [{
    type:'line', data: props.values, smooth:true, symbol:'none',
    lineStyle:{ width:3, color:'#60a5fa' },
    areaStyle:{ opacity:0.15, color:'#60a5fa' }
  }],
  grid:{ top:20, bottom:40, left:40, right:10 },
  backgroundColor:'transparent',
  textStyle:{ color:'#e5e7eb', fontFamily:'Inter' }
}))
</script>

<template>
  <div v-if="loading" class="animate-pulse h-72 w-full rounded-xl bg-white/5" />
  <VChart v-else :option="option" autoresize class="h-72 w-full" />
</template>
