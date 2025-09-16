// src/stores/bikeMeta.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { http } from '@/lib/api';
export const useBikeMeta = defineStore('bikeMeta', () => {
    const categories = ref([]);
    const series = ref([]);
    const bikeStatusOptions = ref([]);
    const loading = ref(false);
    const error = ref(null);
    async function fetchCategories() {
        loading.value = true;
        error.value = null;
        try {
            const res = await http.get('/api/bike/categories/');
            const rows = (res === null || res === void 0 ? void 0 : res.results) || (res === null || res === void 0 ? void 0 : res.data) || res || [];
            categories.value = rows.map((r, idx) => { var _a, _b, _c; return ({ id: (_a = r.id) !== null && _a !== void 0 ? _a : idx + 1, name: (_c = (_b = r.name) !== null && _b !== void 0 ? _b : r.category) !== null && _c !== void 0 ? _c : `分類${idx + 1}` }); });
        }
        catch (e) {
            // fallback demo
            categories.value = [
                { id: 1, name: '城市車' },
                { id: 2, name: '登山車' },
                { id: 3, name: '電輔車' }
            ];
            error.value = '無法讀取車種分類（使用預設）';
        }
        finally {
            loading.value = false;
        }
    }
    async function fetchSeries() {
        loading.value = true;
        error.value = null;
        try {
            const res = await http.get('/api/bike/series/');
            const rows = (res === null || res === void 0 ? void 0 : res.results) || (res === null || res === void 0 ? void 0 : res.data) || res || [];
            series.value = rows.map((r, idx) => { var _a, _b, _c; return ({ id: (_a = r.id) !== null && _a !== void 0 ? _a : idx + 1, name: (_c = (_b = r.name) !== null && _b !== void 0 ? _b : r.series) !== null && _c !== void 0 ? _c : `系列${idx + 1}` }); });
        }
        catch (e) {
            // fallback demo
            series.value = [
                { id: 1, name: 'S1' },
                { id: 2, name: 'S2' },
                { id: 3, name: 'S3' }
            ];
            error.value = '無法讀取系列（使用預設）';
        }
        finally {
            loading.value = false;
        }
    }
    async function fetchBikeStatusOptions() {
        try {
            const res = await http.get('/api/bike/status-options/');
            const rows = (res === null || res === void 0 ? void 0 : res.results) || (res === null || res === void 0 ? void 0 : res.data) || res || [];
            bikeStatusOptions.value = Array.isArray(rows) ? rows : Object.values(rows || {});
        }
        catch (_a) {
            bikeStatusOptions.value = ['available', 'in-use', 'maintenance'];
        }
    }
    return { categories, series, bikeStatusOptions, loading, error, fetchCategories, fetchSeries, fetchBikeStatusOptions };
});
