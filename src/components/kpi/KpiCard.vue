<template>
  <div
    :class="[
      /* ── 外框：玻璃卡 + 霓虹柔光 ─────────────────────────────── */
      'relative rounded-2xl p-6 flex items-center gap-5 shadow',
      glowClasses,                         /* 霓虹柔光背景（淡色）   */
      'before:absolute before:inset-0 before:-z-10 before:rounded-2xl',
      'before:bg-gradient-to-br',          /* 霓虹漸層 ↓            */
      gradientClasses                      /* 主要漸層（亮色→深色） */
    ]"
  >
    <!-- 左側 Icon（維持白色，底色稍透） -->
    <div class="grid place-content-center h-14 w-14 rounded-lg bg-white/20">
      <component :is="icon" class="h-7 w-7 text-white" />
    </div>

    <!-- 右側文字 -->
    <div class="flex flex-col leading-snug">
      <span class="text-base font-medium text-gray-500">{{ label }}</span>
      <span class="text-3xl font-extrabold text-gray-900">
        {{ value }}
        <span v-if="unit" class="ml-1 text-lg font-semibold text-gray-600">{{ unit }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  unit?: string
  icon: any
  /** 霓虹漸層 class 串（空白分隔）*/
  gradient?: string   // ex: "from-emerald-400/90 to-emerald-600"
  /** 柔光背景 class 串（空白分隔）*/
  glow?: string       // ex: "bg-emerald-400/30"
}>()

/* 預設漸層（indigo 系）與柔光 */
const gradientClasses = computed(() =>
  (props.gradient ?? 'from-indigo-400/90 to-indigo-600').split(' ')
)
const glowClasses = computed(() =>
  (props.glow ?? 'bg-indigo-400/30').split(' ')
)
</script>
