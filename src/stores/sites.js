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
            const response = await fetch(`/api/v1/sites?region=${filters.value.region}`);
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            list.value = SiteListSchema.parse(data);
        }
        catch (err) {
            error.value = err instanceof Error ? err.message : 'Unknown error';
            list.value = [];
        }
        finally {
            loading.value = false;
        }
    }
    function selectSite(site) {
        selected.value = site;
    }
    return { list, selected, loading, error, filters, filteredSites, fetchSites, selectSite };
});
