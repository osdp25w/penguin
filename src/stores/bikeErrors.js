// src/stores/bikeErrors.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { http } from '@/lib/api';
export const useBikeErrors = defineStore('bikeErrors', () => {
    const list = ref([]);
    const total = ref(0);
    const loading = ref(false);
    const error = ref(null);
    const criticalUnreadIds = ref(new Set());
    async function fetchStatuses(params) {
        loading.value = true;
        error.value = null;
        try {
            const qs = new URLSearchParams();
            if ((params === null || params === void 0 ? void 0 : params.limit) != null)
                qs.set('limit', String(params.limit));
            if ((params === null || params === void 0 ? void 0 : params.offset) != null)
                qs.set('offset', String(params.offset));
            if (params === null || params === void 0 ? void 0 : params.level)
                qs.set('level', params.level);
            if ((params === null || params === void 0 ? void 0 : params.is_read) != null)
                qs.set('is_read', String(params.is_read));
            const res = await http.get(`/api/bike/error-log-status/${qs.toString() ? `?${qs.toString()}` : ''}`);
            const rows = (res === null || res === void 0 ? void 0 : res.results) || (res === null || res === void 0 ? void 0 : res.data) || res || [];
            list.value = Array.isArray(rows) ? rows : [];
            total.value = (res === null || res === void 0 ? void 0 : res.total_count) || (res === null || res === void 0 ? void 0 : res.count) || list.value.length;
        }
        catch (e) {
            error.value = (e === null || e === void 0 ? void 0 : e.message) || '讀取錯誤日誌狀態失敗';
            list.value = [];
            total.value = 0;
        }
        finally {
            loading.value = false;
        }
    }
    async function fetchCriticalUnread(limit = 500) {
        // 暫時停用 API 呼叫，直接設定空的錯誤列表
        console.warn('[BikeErrors] fetchCriticalUnread: API not available, using empty set');
        criticalUnreadIds.value = new Set();
        list.value = [];
        total.value = 0;
        loading.value = false;
        error.value = null;
    }
    function hasCritical(bikeId) {
        return criticalUnreadIds.value.has(bikeId);
    }
    async function fetchById(id) {
        try {
            // 暫時停用 API 呼叫，因為 /api/bike/error-log-status/ 在後端不存在
            console.warn('[BikeErrors] API /api/bike/error-log-status/${id}/ not available');
            return null;
        }
        catch (_a) {
            return null;
        }
    }
    return { list, total, loading, error, criticalUnreadIds, fetchStatuses, fetchCriticalUnread, hasCritical, fetchById };
});
