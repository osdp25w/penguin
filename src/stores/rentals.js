import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useVehicles } from '@/stores/vehicles';
import { http } from '@/lib/api';
export const useRentals = defineStore('rentals', () => {
    const vehiclesStore = useVehicles();
    // State
    const current = ref();
    const loading = ref(false);
    const error = ref();
    // Actions
    async function createRental(form) {
        loading.value = true;
        error.value = undefined;
        try {
            const payload = {
                bike_id: form.bikeId,
                memo: form.memo
            };
            if (form.member_phone)
                payload.member_phone = form.member_phone;
            else if (form.member_email)
                payload.member_email = form.member_email;
            const res = await http.post('/api/rental/staff/rentals/', payload);
            // Normalize to Rental type for UI
            const rental = {
                rentalId: String((res === null || res === void 0 ? void 0 : res.id) || (res === null || res === void 0 ? void 0 : res.rental_id) || Date.now()),
                bikeId: form.bikeId,
                userName: form.userName,
                phone: form.phone,
                idLast4: form.idLast4,
                state: 'in_use',
                startedAt: new Date().toISOString()
            };
            current.value = rental;
            // 同步更新車輛狀態
            vehiclesStore.updateVehicleStatus(form.bikeId, 'in-use');
            return rental;
        }
        catch (err) {
            error.value = (err === null || err === void 0 ? void 0 : err.message) || '租借失敗';
            throw err;
        }
        finally {
            loading.value = false;
        }
    }
    async function unlockCurrent() {
        // Koala API: 建立租借後即進入使用狀態，不需要額外 unlock API。
        return;
    }
    async function cancelCurrent() {
        if (!current.value) {
            return;
        }
        loading.value = true;
        error.value = undefined;
        try {
            // Koala 若有取消租借 API 可於此補上；暫無
            current.value = undefined;
        }
        catch (err) {
            error.value = err instanceof Error ? err.message : '取消失敗';
            throw err;
        }
        finally {
            loading.value = false;
        }
    }
    async function listActiveRentals() {
        try {
            const res = await http.get('/api/rental/staff/rentals/active_rentals/');
            // API 回應格式：{ code: 2000, msg: "success", data: [...] }
            const rows = (res === null || res === void 0 ? void 0 : res.data) || (res === null || res === void 0 ? void 0 : res.results) || res || [];
            console.log('[Rentals] Active rentals loaded:', rows.length, 'items');
            return Array.isArray(rows) ? rows : [];
        }
        catch (error) {
            console.error('[Rentals] Failed to load active rentals:', error);
            return [];
        }
    }
    async function returnByRentalId(id) {
        try {
            await http.patch(`/api/rental/staff/rentals/${id}/`, { action: 'return' });
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    async function returnByBikeId(bikeId) {
        var _a;
        const actives = await listActiveRentals();
        const found = actives.find((r) => (r.bike_id || r.bikeId) === bikeId);
        if (!found)
            throw new Error('找不到該車輛的進行中租借');
        const id = found.id || found.rental_id;
        if (!id)
            throw new Error('租借 ID 缺失');
        const success = await returnByRentalId(id);
        if (success) {
            // 同步更新車輛狀態為可用
            vehiclesStore.updateVehicleStatus(bikeId, 'available');
            // 清除當前租借記錄
            if (((_a = current.value) === null || _a === void 0 ? void 0 : _a.bikeId) === bikeId) {
                current.value = undefined;
            }
        }
        return success;
    }
    // Helper for vehicles store
    function setInUse(bikeId) {
        vehiclesStore.updateVehicleStatus(bikeId, '使用中');
    }
    function clearError() {
        error.value = undefined;
    }
    function clearCurrent() {
        current.value = undefined;
    }
    return {
        // State
        current,
        loading,
        error,
        // Actions
        createRental,
        unlockCurrent,
        cancelCurrent,
        listActiveRentals,
        returnByBikeId,
        returnByRentalId,
        setInUse,
        clearError,
        clearCurrent
    };
});
