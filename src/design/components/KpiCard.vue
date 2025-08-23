<template>
  <Card variant="default" padding="md" :hover="hover" :class="cardClass">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <div v-if="icon" :class="iconClass">
            <component :is="icon" class="w-5 h-5" />
          </div>
          <h3 class="text-sm font-medium text-gray-600">{{ title }}</h3>
        </div>
        
        <div class="space-y-1">
          <div class="text-2xl font-bold text-gray-900">
            {{ formattedValue }}
          </div>
          
          <div v-if="change !== undefined" class="flex items-center gap-1">
            <component 
              :is="changeIcon" 
              :class="changeIconClass"
              class="w-4 h-4" 
            />
            <span :class="changeTextClass" class="text-sm font-medium">
              {{ Math.abs(change) }}{{ unit }}
              <span class="text-gray-700 font-normal ml-1">vs {{ period }}</span>
            </span>
          </div>
        </div>
      </div>
      
      <div v-if="$slots.chart" class="ml-4 flex-shrink-0">
        <slot name="chart" />
      </div>
    </div>
    
    <div v-if="$slots.footer" class="mt-4 pt-4 border-t border-gray-200">
      <slot name="footer" />
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from './Card.vue'

interface Props {
  title: string
  value: number | string
  unit?: string
  change?: number
  period?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: string
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  hover?: boolean
  format?: 'number' | 'currency' | 'percentage'
  precision?: number
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  period: '上月',
  trend: 'neutral',
  color: 'blue',
  hover: false,
  format: 'number',
  precision: 0,
})

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  
  const num = props.value
  
  switch (props.format) {
    case 'currency':
      return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: props.precision,
        maximumFractionDigits: props.precision,
      }).format(num)
    
    case 'percentage':
      return `${num.toFixed(props.precision)}%`
    
    case 'number':
    default:
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`
      }
      return num.toLocaleString('zh-TW', {
        minimumFractionDigits: props.precision,
        maximumFractionDigits: props.precision,
      })
  }
})

const cardClass = computed(() => {
  const colorClasses = {
    blue: 'border-l-4 border-l-blue-500',
    green: 'border-l-4 border-l-green-500',
    red: 'border-l-4 border-l-red-500',
    yellow: 'border-l-4 border-l-yellow-500',
    purple: 'border-l-4 border-l-purple-500',
  }
  
  return colorClasses[props.color]
})

const iconClass = computed(() => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    red: 'text-red-600 bg-red-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100',
  }
  
  return `p-2 rounded-lg ${colorClasses[props.color]}`
})

const changeIcon = computed(() => {
  if (props.change === undefined) return null
  
  if (props.change > 0) {
    return props.trend === 'down' ? 'i-ph-trend-down' : 'i-ph-trend-up'
  } else if (props.change < 0) {
    return props.trend === 'up' ? 'i-ph-trend-up' : 'i-ph-trend-down'
  }
  
  return 'i-ph-minus'
})

const changeIconClass = computed(() => {
  if (props.change === undefined) return ''
  
  if (props.change > 0) {
    return props.trend === 'down' ? 'text-red-500' : 'text-green-500'
  } else if (props.change < 0) {
    return props.trend === 'up' ? 'text-green-500' : 'text-red-500'
  }
  
  return 'text-gray-700'
})

const changeTextClass = computed(() => {
  if (props.change === undefined) return ''
  
  if (props.change > 0) {
    return props.trend === 'down' ? 'text-red-600' : 'text-green-600'
  } else if (props.change < 0) {
    return props.trend === 'up' ? 'text-green-600' : 'text-red-600'
  }
  
  return 'text-gray-600'
})
</script>