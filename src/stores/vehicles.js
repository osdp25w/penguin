// src/stores/vehicles.ts
import { defineStore } from 'pinia';
import { VehicleListSchema } from '@/types/vehicle';
const DEFAULT_PAGE_SIZE = 20;
export const useVehicles = defineStore('vehicles', {
    state: () => ({
        loading: false,
        errMsg: '',
        items: [],
        page: 1,
        total: 0,
        pageSize: DEFAULT_PAGE_SIZE,
        // Site-based vehicle storage for map
        bySite: {},
        loadingBySite: {},
        errorBySite: {}
    }),
    getters: {
        totalPages: (state) => Math.ceil(state.total / state.pageSize)
    },
    actions: {
        /** 分頁抓取 */
        async fetchPage({ page = 1, size = DEFAULT_PAGE_SIZE } = {}) {
            this.loading = true;
            try {
                const res = await fetch(`/api/v1/vehicles?page=${page}&size=${size}`);
                if (!res.ok)
                    throw new Error(res.statusText);
                const { items, total } = await res.json();
                this.items = items;
                this.total = total;
                this.page = page;
                this.pageSize = size;
                this.errMsg = '';
            }
            catch (e) {
                this.errMsg = e.message || '取得車輛清單失敗';
            }
            finally {
                this.loading = false;
            }
        },
        /** 為兼容呼叫 */
        async fetch(page = 1) {
            return this.fetchPage({ page });
        },
        /** 更新現有車輛（假 API） */
        async updateDevice(v) {
            const idx = this.items.findIndex(x => x.id === v.id);
            if (idx !== -1) {
                this.items[idx] = v;
            }
        },
        /** 新增車輛 (假資料) */
        async createVehicle(v) {
            // 預先加到列表前面，並更新總數
            this.items.unshift(v);
            this.total += 1;
        },
        /** Fetch vehicles by site ID for map */
        async fetchBySite(siteId) {
            if (!siteId)
                return;
            this.loadingBySite[siteId] = true;
            this.errorBySite[siteId] = null;
            try {
                const response = await fetch(`/api/v1/vehicles?siteId=${siteId}`);
                if (!response.ok)
                    throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                this.bySite[siteId] = VehicleListSchema.parse(data);
            }
            catch (err) {
                this.errorBySite[siteId] = err.message || 'Unknown error';
                this.bySite[siteId] = [];
            }
            finally {
                this.loadingBySite[siteId] = false;
            }
        },
        /** Get vehicles by site ID */
        getVehiclesBySite(siteId) {
            return this.bySite[siteId] || [];
        },
        /** Check if site vehicles are loading */
        isLoadingBySite(siteId) {
            return this.loadingBySite[siteId] || false;
        },
        /** Get error for site vehicles */
        getErrorBySite(siteId) {
            return this.errorBySite[siteId] || null;
        }
    }
});
