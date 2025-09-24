import { defineStore } from 'pinia';
import { ref } from 'vue';
import { z } from 'zod';
import { http } from '@/lib/api';
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
const KoalaRentalSchema = z.object({
    id: z.union([z.number(), z.string()]),
    bike: z
        .object({
        bike_id: z.string(),
        bike_name: z.string().optional().nullable(),
        bike_model: z.string().optional().nullable(),
    })
        .optional()
        .nullable(),
    member: z
        .object({
        id: z.union([z.number(), z.string()]).optional(),
        full_name: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
    })
        .optional()
        .nullable(),
    start_time: z.string().optional().nullable(),
    end_time: z.string().optional().nullable(),
    rental_status: z.string(),
    pickup_location: z.string().optional().nullable(),
    return_location: z.string().optional().nullable(),
    total_fee: z.string().optional().nullable(),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
});
const KoalaRentalListSchema = z.object({
    count: z.number().optional(),
    next: z.unknown().optional(),
    previous: z.unknown().optional(),
    results: z.array(KoalaRentalSchema).optional(),
});
const extractKoalaRentals = (payload) => {
    const parsed = KoalaRentalListSchema.safeParse(payload);
    if (parsed.success) {
        return parsed.data.results ?? [];
    }
    if (Array.isArray(payload))
        return payload;
    if (Array.isArray(payload === null || payload === void 0 ? void 0 : payload.results))
        return payload.results;
    return [];
};
const normalizeRentalToReturnRecord = (rental, siteId) => {
    try {
        var _a, _b, _c, _d, _e, _f, _g;
        const base = ReturnRecordSchema.parse({
            id: String(((_a = rental.id) !== null && _a !== void 0 ? _a : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now()))),
            vehicleId: ((_b = rental.bike) === null || _b === void 0 ? void 0 : _b.bike_id) ?? 'unknown',
            siteId: siteId ?? ((_c = rental.return_location) !== null && _c !== void 0 ? _c : 'unknown'),
            odometer: 0,
            battery: 0,
            issues: undefined,
            photos: undefined,
            fromSiteId: undefined,
            by: ((_d = rental.member) === null || _d === void 0 ? void 0 : _d.full_name) ?? '',
            createdAt: ((_g = (_f = (_e = rental.end_time) !== null && _e !== void 0 ? _e : rental.updated_at) !== null && _f !== void 0 ? _f : rental.created_at) !== null && _g !== void 0 ? _g : new Date().toISOString()),
        });
        const member = rental.member ?? {};
        const bike = rental.bike ?? {};
        return Object.assign(Object.assign({}, base), { memberName: (member === null || member === void 0 ? void 0 : member.full_name) ?? '', memberPhone: (member === null || member === void 0 ? void 0 : member.phone) ?? '', returnLocation: rental.return_location ?? undefined, bikeName: (bike === null || bike === void 0 ? void 0 : bike.bike_name) ?? undefined, bikeModel: (bike === null || bike === void 0 ? void 0 : bike.bike_model) ?? undefined });
    }
    catch (error) {
        console.warn('[Returns] Failed to normalize rental record:', error);
        return null;
    }
};
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
            searchParams.set('limit', String((params === null || params === void 0 ? void 0 : params.limit) ?? 20));
            searchParams.set('offset', '0');
            searchParams.set('rental_status', 'completed');
            const response = await http.get(`/api/rental/staff/rentals/?${searchParams.toString()}`);
            const payload = (response === null || response === void 0 ? void 0 : response.data) ?? response;
            const rentals = extractKoalaRentals(payload);
            const mapped = rentals
                .map((item) => normalizeRentalToReturnRecord(item, params === null || params === void 0 ? void 0 : params.siteId))
                .filter((item) => Boolean(item));
            list.value = mapped;
            return mapped;
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
            const searchParams = new URLSearchParams();
            searchParams.set('limit', String(Math.max(limit * 2, 10)));
            searchParams.set('offset', '0');
            searchParams.set('rental_status', 'completed');
            const response = await http.get(`/api/rental/staff/rentals/?${searchParams.toString()}`);
            const payload = (response === null || response === void 0 ? void 0 : response.data) ?? response;
            const rentals = extractKoalaRentals(payload);
            const mapped = rentals
                .map((item) => normalizeRentalToReturnRecord(item, siteId))
                .filter((item) => Boolean(item));
            if (mapped.length <= limit) {
                return mapped;
            }
            try {
                const { useSites } = await import('./sites');
                const sitesStore = useSites();
                const targetSite = sitesStore.list.find((s) => s.id === siteId);
                if (targetSite) {
                    const keyword = targetSite.name.toLowerCase();
                    const filtered = mapped.filter((record) => { var _a, _b; return ((_b = (_a = record.returnLocation) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === null || _b === void 0 ? void 0 : _b.includes(keyword)); });
                    if (filtered.length > 0) {
                        return filtered.slice(0, limit);
                    }
                }
            }
            catch (err) {
                console.warn('[Returns] Unable to refine recent returns by site:', err);
            }
            return mapped.slice(0, limit);
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
