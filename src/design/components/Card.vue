<template>
  <div :class="cardClasses" v-bind="$attrs">
    <header v-if="$slots.header" class="card-header">
      <slot name="header" />
    </header>
    
    <div class="card-content">
      <slot />
    </div>
    
    <footer v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
  hover: false,
})

const cardClasses = computed(() => {
  const baseClasses = ['rounded-xl', 'transition-shadow', 'duration-200']

  const variantClasses = {
    default: ['bg-white', 'shadow-base', 'border', 'border-gray-200'],
    elevated: ['bg-white', 'shadow-lg'],
    outlined: ['bg-white', 'border-2', 'border-gray-200'],
  }

  const paddingClasses = {
    none: [],
    sm: ['p-4'],
    md: ['p-6'],
    lg: ['p-8'],
  }

  const hoverClasses = props.hover ? ['hover:shadow-lg', 'cursor-pointer'] : []

  return [
    ...baseClasses,
    ...variantClasses[props.variant],
    ...paddingClasses[props.padding],
    ...hoverClasses,
  ].join(' ')
})
</script>

<style scoped>
.card-header {
  @apply pb-4 border-b border-gray-200;
}

.card-content {
  @apply flex-1;
}

.card-footer {
  @apply pt-4 border-t border-gray-200;
}

/* Remove padding from card when padding is none, but keep header/footer padding */
.card:has(.card-content) .card-content {
  @apply py-0;
}

.card-header + .card-content {
  @apply pt-4;
}

.card-content + .card-footer {
  @apply pt-4;
}
</style>