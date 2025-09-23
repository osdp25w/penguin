<template>
  <div class="fixed top-20 right-4 z-50 space-y-2 w-80 max-w-[90vw] select-none">
    <TransitionGroup name="toast" tag="div">
      <div v-for="t in toasts.items" :key="t.id"
           class="rounded-lg shadow-lg border p-3 flex items-start gap-3 text-sm bg-white"
           :class="kindClass(t.kind)"
           :data-testid="`toast-${t.kind}`">
        <div>
          <i :class="iconClass(t.kind)" class="w-5 h-5"></i>
        </div>
        <div class="flex-1">
          <div v-if="t.title" class="font-medium mb-0.5">{{ t.title }}</div>
          <div class="text-gray-700 whitespace-pre-line">{{ t.message }}</div>
        </div>
        <button class="opacity-60 hover:opacity-100" @click="toasts.remove(t.id)">
          <i class="i-ph-x w-4 h-4"></i>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToasts } from '@/stores/toasts'

const toasts = useToasts()

const kindClass = (k: string) => ({
  'border-blue-200': k==='info',
  'border-emerald-200': k==='success',
  'border-amber-300': k==='warning',
  'border-rose-300': k==='error',
})
const iconClass = (k: string) => (
  k==='success' ? 'i-ph-check-circle text-emerald-600' :
  k==='warning' ? 'i-ph-warning text-amber-600' :
  k==='error' ? 'i-ph-x-circle text-rose-600' : 'i-ph-info text-blue-600'
)
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all .2s ease; }
.toast-enter-from { opacity: 0; transform: translateY(-4px); }
.toast-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
