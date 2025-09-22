import { defineStore } from 'pinia';
function uid() {
    return Math.random().toString(36).slice(2);
}
export const useToasts = defineStore('toasts', {
    state: () => ({ items: [] }),
    actions: {
        push(kind, message, title, timeout = 4000) {
            const item = { id: uid(), kind, title, message, timeout };
            this.items.push(item);
            // auto-remove
            setTimeout(() => this.remove(item.id), timeout);
            return item.id;
        },
        remove(id) {
            this.items = this.items.filter(t => t.id !== id);
        },
        info(msg, title, timeout) { return this.push('info', msg, title, timeout); },
        success(msg, title, timeout) { return this.push('success', msg, title, timeout); },
        warning(msg, title, timeout) { return this.push('warning', msg, title, timeout); },
        error(msg, title, timeout) { return this.push('error', msg, title, timeout); },
    }
});
