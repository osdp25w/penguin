<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="buttonClasses"
    v-bind="$attrs"
    @click="$emit('click', $event)"
  >
    <slot name="icon-left" />
    <slot />
    <slot name="icon-right" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  fullWidth: false,
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'gap-2',
    'font-medium',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
  ]

  // Size variants
  const sizeClasses = {
    sm: ['px-3', 'py-1.5', 'text-sm'],
    md: ['px-4', 'py-2', 'text-base'],
    lg: ['px-6', 'py-3', 'text-lg'],
  }

  // Color variants
  const variantClasses = {
    primary: [
      'bg-brand-primary',
      'text-white',
      'hover:opacity-90',
      'focus:ring-brand-primary',
    ],
    secondary: [
      'bg-brand-secondary',
      'text-white',
      'hover:opacity-90',
      'focus:ring-brand-secondary',
    ],
    ghost: [
      'text-brand-primary',
      'border',
      'border-brand-primary',
      'hover:bg-brand-primary',
      'hover:text-white',
      'focus:ring-brand-primary',
    ],
    danger: [
      'bg-danger',
      'text-white',
      'hover:opacity-90',
      'focus:ring-danger',
    ],
  }

  const widthClasses = props.fullWidth ? ['w-full'] : []

  return [
    ...baseClasses,
    ...sizeClasses[props.size],
    ...variantClasses[props.variant],
    ...widthClasses,
  ].join(' ')
})
</script>