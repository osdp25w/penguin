<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
    <div 
      @click="toggleExpanded"
      class="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 rounded px-1 py-1 transition-colors"
    >
      <h3 class="text-sm font-semibold text-gray-900">軌跡過濾</h3>
      <i :class="isExpanded ? 'i-ph-caret-up' : 'i-ph-caret-down'" class="w-4 h-4 text-gray-500"></i>
    </div>
    
    <div v-show="isExpanded" class="space-y-3">
      <!-- 快速操作按鈕 -->
      <div class="flex gap-2">
        <button 
          @click="selectAll"
          class="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
        >
          全選
        </button>
        <button 
          @click="selectNone"
          class="px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          全不選
        </button>
        <button 
          @click="invertSelection"
          class="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors"
        >
          反選
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
          v-for="vehicle in filteredVehicles" 
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
            :style="{ backgroundColor: vehicle.color }"
          ></div>
          <span class="font-medium text-black">{{ vehicle.id }}</span>
          <span class="text-gray-500 text-xs">({{ vehicle.pointCount }}點)</span>
        </label>
      </div>
      
      <!-- 選擇統計 -->
      <div class="pt-2 border-t border-gray-200 text-xs text-gray-600">
        已選擇 {{ selectedVehicles.length }} / {{ availableVehicles.length }} 輛車輛
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

interface VehicleInfo {
  id: string
  color: string
  pointCount: number
}

interface Props {
  availableVehicles: VehicleInfo[]
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

// 計算屬性
const filteredVehicles = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.availableVehicles
  }
  
  const query = searchQuery.value.toLowerCase()
  return props.availableVehicles.filter(vehicle => 
    vehicle.id.toLowerCase().includes(query)
  )
})

// 防止循環更新的標誌
let isUpdatingInternally = false

// 方法
function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function selectAll() {
  isUpdatingInternally = true
  selectedVehicles.value = [...props.availableVehicles.map(v => v.id)]
  nextTick(() => {
    isUpdatingInternally = false
  })
}

function selectNone() {
  isUpdatingInternally = true
  selectedVehicles.value = []
  nextTick(() => {
    isUpdatingInternally = false
  })
}

function invertSelection() {
  isUpdatingInternally = true
  const allIds = props.availableVehicles.map(v => v.id)
  selectedVehicles.value = allIds.filter(id => !selectedVehicles.value.includes(id))
  nextTick(() => {
    isUpdatingInternally = false
  })
}

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

// 初始化時展開
watch(() => props.availableVehicles, (newVehicles) => {
  if (newVehicles.length > 0 && selectedVehicles.value.length === 0) {
    isUpdatingInternally = true
    // 如果沒有選中任何車輛，默認選中所有車輛
    selectedVehicles.value = newVehicles.map(v => v.id)
    nextTick(() => {
      isUpdatingInternally = false
    })
  }
}, { immediate: true })
</script>