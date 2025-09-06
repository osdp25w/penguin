import { defineStore } from 'pinia';
import { ref } from 'vue';
import { z } from 'zod';
// Zod Schemas
export const ReturnPayloadSchema = z.object({
    vehicleId: z.string().min(1),
    siteId: z.string().min(1),
    odometer: z.number().nonnegative(),
    battery: z.number().min(0).max(100),
    issues: z.string().optional(),
    photos: z.array(z.string().url()).optional(),
});
export const ReturnRecordSchema = ReturnPayloadSchema.extend({
    id: z.string(),
    fromSiteId: z.string().optional(),
    by: z.string().optional(),
    createdAt: z.string(), // ISO string
});
export const useReturns = defineStore('returns', () => {
    const list = ref([]);
    const isLoading = ref(false);
    /**
     * 歸還車輛（實際執行）
     */
    const returnVehicle = async (payload) => {
        // Validate payload
        const validatedPayload = ReturnPayloadSchema.parse(payload);
        isLoading.value = true;
        try {
            const response = await fetch('/api/v1/returns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(validatedPayload)
            });
            if (!response.ok) {
                throw new Error(`歸還失敗: ${response.statusText}`);
            }
            const data = await response.json();
            const returnRecord = ReturnRecordSchema.parse(data);
            // Add to local list
            list.value.unshift(returnRecord);
            // Update related stores
            await updateRelatedStores(returnRecord);
            return returnRecord;
        }
        catch (error) {
            console.error('Return vehicle error:', error);
            throw error;
        }
        finally {
            isLoading.value = false;
        }
    };
    /**
     * 確認執行歸還（帶確認步驟的版本）
     */
    const confirmReturnVehicle = async (payload) => {
        return returnVehicle(payload);
    };
    /**
     * 獲取歸還記錄
     */
    const fetchReturns = async (params) => {
        isLoading.value = true;
        try {
            const searchParams = new URLSearchParams();
            if (params === null || params === void 0 ? void 0 : params.siteId)
                searchParams.set('siteId', params.siteId);
            if (params === null || params === void 0 ? void 0 : params.limit)
                searchParams.set('limit', params.limit.toString());
            const response = await fetch(`/api/v1/returns?${searchParams}`);
            if (!response.ok) {
                throw new Error(`Fetch returns failed: ${response.statusText}`);
            }
            const data = await response.json();
            const returns = z.array(ReturnRecordSchema).parse(data);
            list.value = returns;
            return returns;
        }
        catch (error) {
            console.error('Fetch returns error:', error);
            throw error;
        }
        finally {
            isLoading.value = false;
        }
    };
    /**
     * 獲取特定站點的最近歸還記錄
     */
    const fetchRecentReturns = async (siteId, limit = 5) => {
        try {
            const response = await fetch(`/api/v1/returns?siteId=${siteId}&limit=${limit}`);
            if (!response.ok) {
                throw new Error(`Fetch recent returns failed: ${response.statusText}`);
            }
            const data = await response.json();
            return z.array(ReturnRecordSchema).parse(data);
        }
        catch (error) {
            console.error('Fetch recent returns error:', error);
            return [];
        }
    };
    /**
     * 更新相關 stores
     */
    const updateRelatedStores = async (returnRecord) => {
        // Import stores dynamically to avoid circular dependencies
        const { useVehicles } = await import('./vehicles');
        const { useSites } = await import('./sites');
        const vehiclesStore = useVehicles();
        const sitesStore = useSites();
        // Update vehicle status and location
        const vehicleIndex = vehiclesStore.vehicles.findIndex(v => v.id === returnRecord.vehicleId);
        if (vehicleIndex !== -1) {
            vehiclesStore.vehicles[vehicleIndex] = {
                ...vehiclesStore.vehicles[vehicleIndex],
                status: 'available',
                siteId: returnRecord.siteId,
                batteryLevel: returnRecord.battery,
                lastSeen: returnRecord.createdAt
            };
        }
        // Update site available count
        const siteIndex = sitesStore.sites.findIndex(s => s.id === returnRecord.siteId);
        if (siteIndex !== -1) {
            sitesStore.sites[siteIndex] = {
                ...sitesStore.sites[siteIndex],
                availableCount: sitesStore.sites[siteIndex].availableCount + 1,
                availableSpots: Math.max(0, sitesStore.sites[siteIndex].availableSpots - 1)
            };
        }
    };
    /**
     * 清空記錄
     */
    const clearReturns = () => {
        list.value = [];
    };
    return {
        list,
        isLoading,
        returnVehicle,
        confirmReturnVehicle,
        fetchReturns,
        fetchRecentReturns,
        clearReturns
    };
});
