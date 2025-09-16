import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SiteSchema } from '@/types/site';
import { z } from 'zod';
const SiteListSchema = z.array(SiteSchema);
export const useSites = defineStore('sites', () => {
    const list = ref([]);
    const selected = ref();
    const loading = ref(false);
    const error = ref(null);
    const filters = ref({
        region: 'hualien',
        brands: [],
        statuses: [],
        batteryRange: [0, 100]
    });
    const filteredSites = computed(() => {
        return list.value.filter(site => {
            if (site.region !== filters.value.region)
                return false;
            if (filters.value.brands.length > 0 && !filters.value.brands.includes(site.brand))
                return false;
            if (filters.value.statuses.length > 0 && !filters.value.statuses.includes(site.status))
                return false;
            const avgBattery = site.vehicleCount > 0
                ? ((site.batteryLevels.high * 85 + site.batteryLevels.medium * 50 + site.batteryLevels.low * 15) / site.vehicleCount)
                : 0;
            return avgBattery >= filters.value.batteryRange[0] && avgBattery <= filters.value.batteryRange[1];
        });
    });
    async function fetchSites() {
        // 使用假資料，停用 API 讀取
        loading.value = true;
        error.value = null;
        try {
            const mod = await import('@/mocks/handlers/sites');
            list.value = (mod === null || mod === void 0 ? void 0 : mod.getDemoSites) ? mod.getDemoSites(filters.value.region) : [];
        }
        catch (err) {
            console.error('載入站點假資料失敗:', err);
            error.value = '站點載入失敗（假資料）';
            list.value = [];
        }
        finally {
            loading.value = false;
        }
    }
    function selectSite(site) {
        selected.value = site;
    }
    // 通用分頁（本地假資料或未來 API）
    async function fetchSitesPaged(params) {
        var _a, _b;
        loading.value = true;
        error.value = null;
        const limit = (_a = params === null || params === void 0 ? void 0 : params.limit) !== null && _a !== void 0 ? _a : 20;
        const offset = (_b = params === null || params === void 0 ? void 0 : params.offset) !== null && _b !== void 0 ? _b : 0;
        try {
            // 假資料生成（擴充到 100 筆）
            if (list.value.length < 50) {
                const mod = await import('@/mocks/handlers/sites');
                const base = (mod === null || mod === void 0 ? void 0 : mod.getDemoSites) ? mod.getDemoSites(filters.value.region) : [];
                // 複製放大
                const big = [];
                for (let i = 0; i < 4; i++)
                    big.push(...base.map((s, idx) => ({ ...s, id: `${s.id}-${i}-${idx}`, name: `${s.name}-${i}` })));
                list.value = big;
            }
            let all = list.value;
            if (params === null || params === void 0 ? void 0 : params.keyword) {
                const kw = params.keyword.toLowerCase();
                all = all.filter(s => s.name.toLowerCase().includes(kw));
            }
            const total = all.length;
            const data = all.slice(offset, offset + limit);
            return { data, total };
        }
        catch (e) {
            error.value = '載入場域失敗';
            return { data: [], total: 0 };
        }
        finally {
            loading.value = false;
        }
    }
    // 基本 CRUD（暫用本地狀態，未來可接 API）
    async function createSite(payload) {
        const id = `site-${Math.random().toString(36).slice(2, 8)}`;
        const site = {
            id,
            name: payload.name,
            lat: payload.lat,
            lon: payload.lon,
            region: filters.value.region,
            brand: 'huali',
            status: 'normal',
            vehicleCount: 0,
            batteryLevels: { high: 0, medium: 0, low: 0 },
            availableSpots: 0,
            availableCount: 0
        };
        list.value = [site, ...list.value];
        return site;
    }
    async function updateSite(id, patch) {
        const idx = list.value.findIndex(s => s.id === id);
        if (idx !== -1)
            list.value[idx] = { ...list.value[idx], ...patch };
    }
    async function deleteSite(id) {
        list.value = list.value.filter(s => s.id !== id);
    }
    return { list, selected, loading, error, filters, filteredSites, fetchSites, selectSite, fetchSitesPaged, createSite, updateSite, deleteSite };
});
