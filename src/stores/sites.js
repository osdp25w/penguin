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
        loading.value = true;
        error.value = null;
        try {
            // 目前使用假資料，未來可擴展為真實 API
            console.log('[Sites] Loading demo sites for region:', filters.value.region);
            const mod = await import('@/mocks/handlers/sites');
            const sites = (mod === null || mod === void 0 ? void 0 : mod.getDemoSites) ? mod.getDemoSites(filters.value.region) : [];
            list.value = sites;
            console.log('[Sites] Loaded', sites.length, 'sites successfully');
        }
        catch (err) {
            console.error('[Sites] Failed to load demo sites:', err);
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
        console.log('[Sites] Fetching paged sites:', { limit, offset, keyword: params === null || params === void 0 ? void 0 : params.keyword });
        try {
            // 假資料生成（擴充到多筆供測試）
            if (list.value.length < 50) {
                console.log('[Sites] Generating expanded demo data...');
                const mod = await import('@/mocks/handlers/sites');
                const base = (mod === null || mod === void 0 ? void 0 : mod.getDemoSites) ? mod.getDemoSites(filters.value.region) : [];
                if (base.length === 0) {
                    console.warn('[Sites] No base demo sites found');
                    return { data: [], total: 0 };
                }
                // 複製放大供分頁測試
                const big = [];
                for (let i = 0; i < 4; i++) {
                    big.push(...base.map((s, idx) => ({
                        ...s,
                        id: `${s.id}-${i}-${idx}`,
                        name: `${s.name} 站點 ${i + 1}-${idx + 1}`,
                        updatedAt: new Date().toISOString()
                    })));
                }
                list.value = big;
                console.log('[Sites] Generated', big.length, 'demo sites for testing');
            }
            let all = list.value;
            if (params === null || params === void 0 ? void 0 : params.keyword) {
                const kw = params.keyword.toLowerCase();
                all = all.filter(s => s.name.toLowerCase().includes(kw));
                console.log('[Sites] Filtered by keyword "' + params.keyword + '":', all.length, 'results');
            }
            const total = all.length;
            const data = all.slice(offset, offset + limit);
            console.log('[Sites] Returning paged results:', { total, returned: data.length, page: Math.floor(offset / limit) + 1 });
            return { data, total };
        }
        catch (e) {
            console.error('[Sites] Failed to fetch paged sites:', e);
            error.value = '載入場域失敗';
            return { data: [], total: 0 };
        }
        finally {
            loading.value = false;
        }
    }
    // 基本 CRUD（暫用本地狀態，未來可接 API）
    async function createSite(payload) {
        try {
            console.log('[Sites] Creating new site:', payload);
            const id = `site-${Math.random().toString(36).slice(2, 8)}`;
            const now = new Date().toISOString();
            const site = {
                id,
                name: payload.name,
                region: filters.value.region,
                location: { lat: payload.lat, lng: payload.lon },
                status: 'active',
                brand: 'huali',
                vehicleCount: 0,
                batteryLevels: { high: 0, medium: 0, low: 0 },
                availableSpots: 10, // 預設停車位
                totalSpots: 10,
                availableCount: 0,
                createdAt: now,
                updatedAt: now,
                // 兼容舊格式
                lat: payload.lat,
                lon: payload.lon
            };
            list.value = [site, ...list.value];
            console.log('[Sites] Site created successfully:', id);
            return site;
        }
        catch (e) {
            console.error('[Sites] Failed to create site:', e);
            throw new Error('新增場域失敗');
        }
    }
    async function updateSite(id, patch) {
        try {
            console.log('[Sites] Updating site:', id, patch);
            const idx = list.value.findIndex(s => s.id === id);
            if (idx === -1) {
                throw new Error(`Site with ID ${id} not found`);
            }
            const updatedSite = {
                ...list.value[idx],
                ...patch,
                updatedAt: new Date().toISOString()
            };
            list.value[idx] = updatedSite;
            console.log('[Sites] Site updated successfully:', id);
            return updatedSite;
        }
        catch (e) {
            console.error('[Sites] Failed to update site:', e);
            throw new Error('更新場域失敗');
        }
    }
    async function deleteSite(id) {
        try {
            console.log('[Sites] Deleting site:', id);
            const originalLength = list.value.length;
            list.value = list.value.filter(s => s.id !== id);
            if (list.value.length === originalLength) {
                throw new Error(`Site with ID ${id} not found`);
            }
            console.log('[Sites] Site deleted successfully:', id);
        }
        catch (e) {
            console.error('[Sites] Failed to delete site:', e);
            throw new Error('刪除場域失敗');
        }
    }
    return { list, selected, loading, error, filters, filteredSites, fetchSites, selectSite, fetchSitesPaged, createSite, updateSite, deleteSite };
});
