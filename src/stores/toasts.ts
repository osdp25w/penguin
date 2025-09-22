import { defineStore } from 'pinia'

export type ToastKind = 'info' | 'success' | 'warning' | 'error'

export interface ToastItem {
  id: string
  kind: ToastKind
  title?: string
  message: string
  timeout: number
}

function uid() {
  return Math.random().toString(36).slice(2)
}

export const useToasts = defineStore('toasts', {
  state: () => ({ items: [] as ToastItem[] }),
  actions: {
    push(kind: ToastKind, message: string, title?: string, timeout = 4000) {
      const item: ToastItem = { id: uid(), kind, title, message, timeout }
      this.items.push(item)
      // auto-remove
      setTimeout(() => this.remove(item.id), timeout)
      return item.id
    },
    remove(id: string) {
      this.items = this.items.filter(t => t.id !== id)
    },
    info(msg: string, title?: string, timeout?: number) { return this.push('info', msg, title, timeout) },
    success(msg: string, title?: string, timeout?: number) { return this.push('success', msg, title, timeout) },
    warning(msg: string, title?: string, timeout?: number) { return this.push('warning', msg, title, timeout) },
    error(msg: string, title?: string, timeout?: number) { return this.push('error', msg, title, timeout) },
  }
})

