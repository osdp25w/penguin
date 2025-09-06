import { defineStore } from 'pinia';
export const useSummary = defineStore('summary', {
    state: () => ({
        isLoading: false,
        errMsg: '',
        data: {},
    }),
    actions: {
        async fetch() {
            var _a;
            try {
                this.isLoading = true;
                const res = await fetch('/api/v1/metrics/summary');
                if (!res.ok)
                    throw new Error(res.statusText);
                this.data = await res.json();
                this.errMsg = '';
            }
            catch (e) {
                this.errMsg = (_a = e.message) !== null && _a !== void 0 ? _a : 'fetch summary failed';
            }
            finally {
                this.isLoading = false;
            }
        },
    },
});
