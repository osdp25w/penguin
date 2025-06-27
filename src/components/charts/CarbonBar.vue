<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'

/* 註冊 ECharts 元件 */
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = withDefaults(defineProps<{
  labels : string[]
  values : number[]
  loading?: boolean
}>(), { labels: () => [], values: () => [], loading: false })

const option = computed(() => ({
  tooltip:{ trigger:'axis', formatter:(p:any)=>`${p[0].axisValue}<br/>減碳 ${p[0].data} kg` },
  xAxis  : { type:'category', data: props.labels, axisLabel:{ color:'#a1a1aa' } },
  yAxis  : { name:'kg', splitLine:{ show:false }, axisLabel:{ color:'#a1a1aa' } },
  series : [{
    type:'bar', data: props.values, barWidth:'60%',
    itemStyle:{ color:'#4ade80', borderRadius:[4,4,0,0] }
  }],
  grid:{ top:20, bottom:40, left:50, right:10 },
  backgroundColor:'transparent',
  textStyle:{ color:'#e5e7eb', fontFamily:'Inter' }
}))
</script>

<template>
  <div v-if="loading" class="animate-pulse h-72 w-full rounded-xl bg-white/5" />
  <VChart v-else :option="option" autoresize class="h-72 w-full" />
</template>
