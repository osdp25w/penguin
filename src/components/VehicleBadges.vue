<!-- src/components/VehicleBadges.vue -->
<template>
  <div class="flex items-center gap-2">
    <!-- 狀態徽章 -->
    <span
      :class="[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        getStatusBadgeClass(status)
      ]"
    >
      {{ getStatusText(status) }}
    </span>

    <!-- 低電量徽章 -->
    <span
      v-if="isLowBattery"
      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"
    >
      <i class="i-ph-battery-low w-3 h-3 mr-1"></i>
      低電量
    </span>

    <!-- 錯誤徽章（由 ErrorLogStatus 決定） -->
    <span
      v-if="props.hasError"
      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"
    >
      <i class="i-ph-warning-circle w-3 h-3 mr-1"></i>
      錯誤
    </span>

    <!-- MQTT 離線徽章 -->
    <span
      v-if="!mqttOnline"
      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
    >
      <i class="i-ph-wifi-slash w-3 h-3 mr-1"></i>
      離線
    </span>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { VEHICLE_CONFIG } from '@/config/vehicle'

interface Props {
  status: string
  batteryLevel: number
  mqttStatus?: string | boolean
  lowBatteryThreshold?: number
  hasError?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  lowBatteryThreshold: VEHICLE_CONFIG.LOW_BATTERY_THRESHOLD
})

// 計算是否低電量
const isLowBattery = computed(() => {
  return props.batteryLevel < props.lowBatteryThreshold
})

// 計算 MQTT 是否在線
const mqttOnline = computed(() => {
  if (typeof props.mqttStatus === 'boolean') {
    return props.mqttStatus
  }
  return props.mqttStatus === 'online'
})

// 狀態文字映射
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'available': '可用',
    'in-use': '使用中',
    'maintenance': '維護中',
    'low-battery': '低電量'
  }
  return statusMap[status] || status
}

// 狀態徽章樣式
const getStatusBadgeClass = (status: string) => {
  const styleMap: Record<string, string> = {
    'available': 'bg-green-100 text-green-800 border border-green-200',
    'in-use': 'bg-blue-100 text-blue-800 border border-blue-200',
    'maintenance': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    'low-battery': 'bg-red-100 text-red-800 border border-red-200'
  }
  return styleMap[status] || 'bg-gray-100 text-gray-800 border border-gray-200'
}
</script>
