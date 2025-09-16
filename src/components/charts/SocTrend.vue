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
  labels: string[]
  values: number[]
  loading?: boolean
  granularity?: 'hour' | 'day' | 'month' | 'year'
}>(), { labels: () => [], values: () => [], loading: false, granularity: 'hour' })

const option = computed(() => {
  const granularityLabels = {
    hour: '小時',
    day: '日',
    month: '月',
    year: '年'
  }

  const xAxisConfig = {
    type: 'category',
    data: props.labels,
    axisLabel: {
      color: '#a1a1aa',
      rotate: props.granularity === 'hour' ? 0 : 45,
      formatter: (value: string) => {
        // 根據粒度調整標籤顯示
        if (props.granularity === 'day' && value.includes('-')) {
          return value.split('-').slice(1).join('/')
        }
        return value
      }
    }
  }

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0]
        return `${param.axisValue}<br/>SoC: ${param.data}%`
      }
    },
    xAxis: xAxisConfig,
    yAxis: {
      max: 100,
      min: 0,
      name: 'SoC %',
      nameTextStyle: { color: '#a1a1aa' },
      splitLine: { show: false },
      axisLabel: { color: '#a1a1aa' }
    },
    series: [{
      type: 'line',
      data: props.values,
      smooth: true,
      symbol: props.values.length > 24 ? 'none' : 'circle',
      symbolSize: 4,
      lineStyle: { width: 3, color: '#60a5fa' },
      areaStyle: { opacity: 0.15, color: '#60a5fa' },
      connectNulls: false
    }],
    grid: { top: 30, bottom: 50, left: 50, right: 20 },
    backgroundColor: 'transparent',
    textStyle: { color: '#e5e7eb', fontFamily: 'Inter' }
  }
})
</script>

<template>
  <div v-if="loading" class="animate-pulse h-72 w-full rounded-xl bg-white/5" />
  <VChart v-else :option="option" autoresize class="h-72 w-full" />
</template>
