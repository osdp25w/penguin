<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div v-if="icon" class="mb-4">
      <div :class="iconClass">
        <component :is="icon" class="w-12 h-12" />
      </div>
    </div>
    
    <div class="space-y-2">
      <h3 class="text-lg font-medium text-gray-900">
        {{ title }}
      </h3>
      
      <p v-if="description" class="text-gray-500 max-w-sm">
        {{ description }}
      </p>
    </div>
    
    <div v-if="$slots.action" class="mt-6">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  description?: string
  icon?: string
  variant?: 'default' | 'search' | 'error' | 'loading'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const iconClass = computed(() => {
  const baseClasses = 'p-3 rounded-full'
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-400',
    search: 'bg-blue-100 text-blue-400',
    error: 'bg-red-100 text-red-400',
    loading: 'bg-yellow-100 text-yellow-400',
  }
  
  return `${baseClasses} ${variantClasses[props.variant]}`
})
</script>