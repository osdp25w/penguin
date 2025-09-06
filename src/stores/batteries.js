import { defineStore } from 'pinia';
export const useBatteries = defineStore('batteries', {
    state: () => ({
        isLoading: false,
        errMsg: '',
        items: [],
    }),
    actions: {
        async fetchAll() {
            var _a;
            try {
                this.isLoading = true;
                const res = await fetch('/api/v1/batteries');
                if (!res.ok)
                    throw new Error(res.statusText);
                this.items = await res.json();
                this.errMsg = '';
            }
            catch (e) {
                this.errMsg = (_a = e.message) !== null && _a !== void 0 ? _a : 'fetch batteries failed';
            }
            finally {
                this.isLoading = false;
            }
        },
    },
});
