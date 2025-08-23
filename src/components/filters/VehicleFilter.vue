<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
    <div 
      @click="toggleExpanded"
      class="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 rounded px-1 py-1 transition-colors"
    >
      <h3 class="text-sm font-semibold text-gray-900">車輛過濾</h3>
      <i :class="isExpanded ? 'i-ph-caret-up' : 'i-ph-caret-down'" class="w-4 h-4 text-gray-500"></i>
    </div>
    
    <div v-show="isExpanded" class="space-y-3">
      <!-- 快速過濾標籤 -->
      <div class="flex flex-wrap gap-1.5">
        <button 
          v-for="filter in quickFilters"
          :key="filter.key"
          @click="quickFilter = filter.key"
          :class="quickFilter === filter.key ? filter.activeClass : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          class="px-2 py-1 rounded-full text-xs font-medium transition-colors"
        >
          {{ filter.label }}
        </button>
      </div>
      
      <!-- 搜索框 -->
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索車輛編號..."
          class="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-8"
        >
        <i class="i-ph-magnifying-glass absolute left-2.5 top-2.5 w-3 h-3 text-gray-400"></i>
      </div>
      
      <!-- 車輛列表 -->
      <div class="max-h-40 overflow-y-auto space-y-1">
        <label 
          v-for="vehicle in filteredDisplayVehicles" 
          :key="vehicle.id"
          class="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer text-xs"
        >
          <input
            v-model="selectedVehicles"
            :value="vehicle.id"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          >
          <div 
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: getStatusColor(vehicle.status) }"
          ></div>
          <span class="font-medium text-black">{{ vehicle.id }}</span>
          <span :class="getStatusClass(vehicle.status)" class="px-1 py-0.5 rounded text-xs">
            {{ getStatusText(vehicle.status) }}
          </span>
          <span class="text-gray-500 text-xs ml-auto">{{ vehicle.batteryPct }}%</span>
        </label>
      </div>
      
      <!-- 選擇統計 -->
      <div class="pt-2 border-t border-gray-200 text-xs text-gray-600">
        已選擇 {{ selectedVehicles.length }} / {{ filteredVehicles.length }} 輛車輛
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

interface Vehicle {
  id: string
  status: string
  batteryPct: number
  speedKph: number
  [key: string]: any
}

interface Props {
  availableVehicles: Vehicle[]
  modelValue: string[]
}

interface Emits {
  'update:modelValue': [value: string[]]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 組件狀態
const isExpanded = ref(false)
const searchQuery = ref('')
const selectedVehicles = ref<string[]>([...props.modelValue])
const quickFilter = ref('all')

// 快速過濾選項
const quickFilters = [
  { key: 'all', label: '全部', activeClass: 'bg-indigo-100 text-indigo-800' },
  { key: 'available', label: '可租借', activeClass: 'bg-green-100 text-green-800' },
  { key: 'in-use', label: '使用中', activeClass: 'bg-blue-100 text-blue-800' },
  { key: 'low-battery', label: '低電量', activeClass: 'bg-red-100 text-red-800' },
  { key: 'offline', label: '離線', activeClass: 'bg-gray-100 text-gray-800' }
]

// 計算屬性 - 根據快速過濾篩選車輛
const filteredVehicles = computed(() => {
  let vehicles = props.availableVehicles
  
  if (quickFilter.value !== 'all') {
    vehicles = vehicles.filter(vehicle => {
      switch (quickFilter.value) {
        case 'available':
          return vehicle.status === '可租借' || vehicle.status === 'available'
        case 'in-use':
          return vehicle.status === '使用中' || vehicle.status === 'in-use' || vehicle.status === 'rented'
        case 'low-battery':
          return vehicle.status === '低電量' || vehicle.status === 'low-battery' || vehicle.batteryPct < 20
        case 'offline':
          return vehicle.status === '離線' || vehicle.status === 'offline' || vehicle.status === 'maintenance'
        default:
          return true
      }
    })
  }
  
  return vehicles
})

// 計算屬性 - 根據搜索關鍵字進一步篩選
const filteredDisplayVehicles = computed(() => {
  if (!searchQuery.value.trim()) {
    return filteredVehicles.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return filteredVehicles.value.filter(vehicle => 
    vehicle.id.toLowerCase().includes(query)
  )
})

// 輔助函數
function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function getStatusText(status: string): string {
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

function getStatusClass(status: string): string {
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

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    '可租借': '#10b981',
    '使用中': '#3b82f6',
    '離線': '#6b7280',
    '維修': '#f59e0b',
    '低電量': '#ef4444',
    'available': '#10b981',
    'in-use': '#3b82f6',
    'rented': '#8b5cf6',
    'maintenance': '#f59e0b',
    'charging': '#06b6d4',
    'low-battery': '#ef4444'
  }
  return colorMap[status] || '#6b7280'
}

// 防止循環更新的標誌
let isUpdatingInternally = false

// 監聽選擇變化並發射事件
watch(selectedVehicles, (newValue) => {
  if (!isUpdatingInternally) {
    emit('update:modelValue', newValue)
  }
}, { deep: true })

// 監聽外部變化
watch(() => props.modelValue, (newValue) => {
  isUpdatingInternally = true
  selectedVehicles.value = [...newValue]
  nextTick(() => {
    isUpdatingInternally = false
  })
})

// 監聽快速過濾變化，自動更新選中的車輛
watch(quickFilter, () => {
  isUpdatingInternally = true
  // 根據當前過濾條件更新選中車輛
  selectedVehicles.value = filteredVehicles.value.map(v => v.id)
  nextTick(() => {
    isUpdatingInternally = false
  })
})

// 初始化時選中所有車輛
watch(() => props.availableVehicles, (newVehicles) => {
  if (newVehicles.length > 0 && selectedVehicles.value.length === 0) {
    isUpdatingInternally = true
    selectedVehicles.value = newVehicles.map(v => v.id)
    nextTick(() => {
      isUpdatingInternally = false
    })
  }
}, { immediate: true })
</script>