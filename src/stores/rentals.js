import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useVehicles } from '@/stores/vehicles';
import { http } from '@/lib/api';
import { useAuth } from '@/stores/auth';
function unwrapKoalaResponse(res) {
    var _a;
    if (!res)
        return res;
    if (typeof res.code === 'number' && res.code !== 2000) {
        const detail = res === null || res === void 0 ? void 0 : res.details;
        let message = (res === null || res === void 0 ? void 0 : res.msg) || (res === null || res === void 0 ? void 0 : res.message) || 'Koala API error';
        if (detail) {
            if (typeof detail === 'string')
                message = detail;
            else if (Array.isArray(detail))
                message = detail.join(', ');
            else if (detail.non_field_errors && Array.isArray(detail.non_field_errors)) {
                message = detail.non_field_errors[0];
            }
            else if (detail.bike_id && Array.isArray(detail.bike_id)) {
                message = detail.bike_id[0];
            }
        }
        const error = new Error(message);
        error.details = detail || res;
        throw error;
    }
    return (_a = res === null || res === void 0 ? void 0 : res.data) !== null && _a !== void 0 ? _a : res;
}
function mapKoalaRental(raw, fallback) {
    var _a, _b, _c, _d;
    if (!raw || typeof raw !== 'object') {
        return {
            rentalId: String(Date.now()),
            bikeId: fallback.bikeId,
            userName: fallback.userName,
            phone: fallback.phone,
            idLast4: fallback.idLast4,
            state: 'in_use',
            startedAt: new Date().toISOString()
        };
    }
    const bike = raw.bike || {};
    return {
        rentalId: String((_b = (_a = raw.id) !== null && _a !== void 0 ? _a : raw.rental_id) !== null && _b !== void 0 ? _b : Date.now()),
        bikeId: bike.bike_id || fallback.bikeId,
        userName: ((_c = raw.member) === null || _c === void 0 ? void 0 : _c.full_name) || fallback.userName,
        phone: ((_d = raw.member) === null || _d === void 0 ? void 0 : _d.phone) || fallback.phone,
        idLast4: fallback.idLast4,
        state: raw.rental_status === 'active' ? 'in_use' : 'in_use',
        startedAt: raw.start_time || new Date().toISOString()
    };
}
export const useRentals = defineStore('rentals', () => {
    const vehiclesStore = useVehicles();
    const auth = useAuth();
    // State
    const current = ref();
    const loading = ref(false);
    const error = ref();
    const memberRentals = ref([]);
    const memberRentalsTotal = ref(0);
    const memberRentalsLoading = ref(false);
    const memberRentalsError = ref();
    // Actions
    async function createRental(form) {
        var _a, _b;
        loading.value = true;
        error.value = undefined;
        try {
            const isPrivileged = (((_a = auth.user) === null || _a === void 0 ? void 0 : _a.roleId) === 'admin' || ((_b = auth.user) === null || _b === void 0 ? void 0 : _b.roleId) === 'staff');
            let res;
            if (isPrivileged) {
                const payload = { bike_id: form.bikeId, memo: form.memo };
                if (form.member_phone)
                    payload.member_phone = form.member_phone;
                else if (form.member_email)
                    payload.member_email = form.member_email;
                const response = await http.post('/api/rental/staff/rentals/', payload);
                res = unwrapKoalaResponse(response);
            }
            else {
                // member 自行租借
                const payload = { bike_id: form.bikeId };
                if (form.pickup_location)
                    payload.pickup_location = form.pickup_location;
                const response = await http.post('/api/rental/member/rentals/', payload);
                res = unwrapKoalaResponse(response);
            }
            const rental = mapKoalaRental(res, form);
            current.value = rental;
            // 同步更新車輛狀態
            vehiclesStore.updateVehicleStatus(form.bikeId, 'in-use');
            if (!isPrivileged) {
                try {
                    await fetchMemberRentals();
                }
                catch (fetchErr) {
                    console.warn('[Rentals] Unable to refresh member rentals after create:', fetchErr);
                }
            }
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
        var _a, _b;
        try {
            const isPrivileged = (((_a = auth.user) === null || _a === void 0 ? void 0 : _a.roleId) === 'admin' || ((_b = auth.user) === null || _b === void 0 ? void 0 : _b.roleId) === 'staff');
            if (isPrivileged) {
                const res = await http.get('/api/rental/staff/rentals/active_rentals/');
                if (res && res.code === 2000 && res.data) {
                    const rows = Array.isArray(res.data) ? res.data : [];
                    return rows;
                }
                const rows = (res === null || res === void 0 ? void 0 : res.data) || (res === null || res === void 0 ? void 0 : res.results) || res || [];
                return Array.isArray(rows) ? rows : [];
            }
            else {
                const res = await http.get('/api/rental/member/rentals/active_rental/');
                const one = (res === null || res === void 0 ? void 0 : res.data) || (res === null || res === void 0 ? void 0 : res.result) || null;
                return one ? [one] : [];
            }
        }
        catch (error) {
            console.error('[Rentals] Failed to load active rentals:', error);
            return [];
        }
    }
    async function returnByRentalId(id, opts) {
        var _a, _b;
        try {
            const isPrivileged = (((_a = auth.user) === null || _a === void 0 ? void 0 : _a.roleId) === 'admin' || ((_b = auth.user) === null || _b === void 0 ? void 0 : _b.roleId) === 'staff');
            if (isPrivileged) {
                await http.patch(`/api/rental/staff/rentals/${id}/`, { action: 'return' });
            }
            else {
                const payload = { action: 'return' };
                if (opts === null || opts === void 0 ? void 0 : opts.return_location)
                    payload.return_location = opts.return_location;
                await http.patch(`/api/rental/member/rentals/${id}/`, payload);
                try {
                    await fetchMemberRentals();
                }
                catch (fetchErr) {
                    console.warn('[Rentals] Unable to refresh member rentals after return:', fetchErr);
                }
            }
            return true;
        }
        catch (error) {
            console.error('[Rentals] Return API failed:', error);
            return false;
        }
    }
    async function returnByBikeId(bikeId, opts) {
        var _a;
        const norm = (v) => String(v || '').trim().toUpperCase();
        const target = norm(bikeId);
        console.log('[Rentals] Attempting to return bike:', bikeId, 'normalized:', target);
        // 1) 先從 active_rentals 找
        let actives = await listActiveRentals();
        let found = actives.find((r) => {
            var _a;
            const bikeIdFromAPI = ((_a = r === null || r === void 0 ? void 0 : r.bike) === null || _a === void 0 ? void 0 : _a.bike_id) || (r === null || r === void 0 ? void 0 : r.bike_id) || (r === null || r === void 0 ? void 0 : r.bikeId);
            const normalized = norm(bikeIdFromAPI);
            console.log('[Rentals] Comparing:', { target, bikeIdFromAPI, normalized, match: normalized === target });
            return normalized === target;
        });
        console.log('[Rentals] Found in active rentals:', !!found, found ? `ID: ${found.id}` : 'none');
        // 2) 找不到就打 list 全量，再本地篩 active + 比對 id
        if (!found) {
            console.log('[Rentals] Not found in active_rentals, trying full rental list...');
            try {
                // Check if user has staff/admin privileges
                const isPrivileged = (auth.user?.roleId === 'admin' || auth.user?.roleId === 'staff');
                if (!isPrivileged) {
                    console.warn('[Rentals] Non-staff user attempted to access full rental list');
                    throw new Error('找不到該車輛的進行中租借');
                }
                const res = await http.get('/api/rental/staff/rentals/');
                let rows = [];
                // 處理 Koala API 格式
                if (res && res.code === 2000 && res.data) {
                    rows = Array.isArray(res.data) ? res.data : [];
                }
                else {
                    rows = (res === null || res === void 0 ? void 0 : res.data) || (res === null || res === void 0 ? void 0 : res.results) || res || [];
                }
                actives = Array.isArray(rows) ? rows.filter((x) => (x.rental_status || x.status) === 'active') : [];
                console.log('[Rentals] Found', actives.length, 'active rentals in full list');
                found = actives.find((r) => {
                    var _a;
                    const bikeIdFromAPI = ((_a = r === null || r === void 0 ? void 0 : r.bike) === null || _a === void 0 ? void 0 : _a.bike_id) || (r === null || r === void 0 ? void 0 : r.bike_id) || (r === null || r === void 0 ? void 0 : r.bikeId);
                    const normalized = norm(bikeIdFromAPI);
                    return normalized === target;
                });
                console.log('[Rentals] Found in full list:', !!found, found ? `ID: ${found.id}` : 'none');
            }
            catch (err) {
                console.error('[Rentals] Error fetching full rental list:', err);
            }
        }
        if (!found) {
            console.error('[Rentals] Could not find active rental for bike:', bikeId);
            console.error('[Rentals] Available active rentals:', actives.map(r => {
                var _a;
                return ({
                    id: r.id,
                    bike_id: ((_a = r === null || r === void 0 ? void 0 : r.bike) === null || _a === void 0 ? void 0 : _a.bike_id) || (r === null || r === void 0 ? void 0 : r.bike_id) || (r === null || r === void 0 ? void 0 : r.bikeId),
                    status: r.rental_status || r.status
                });
            }));
            throw new Error('找不到該車輛的進行中租借');
        }
        const id = found.id || found.rental_id;
        if (!id)
            throw new Error('租借 ID 缺失');
        console.log('[Rentals] Found rental to return:', { id, bikeId });
        const success = await returnByRentalId(id, opts);
        if (success) {
            console.log('[Rentals] Return successful, updating vehicle status');
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
    async function fetchMemberRentals(params, opts) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
        try {
            if ((opts === null || opts === void 0 ? void 0 : opts.updateState) !== false) {
                memberRentalsLoading.value = true;
                memberRentalsError.value = undefined;
            }
            const limit = (_a = params === null || params === void 0 ? void 0 : params.limit) !== null && _a !== void 0 ? _a : 50;
            const offset = (_b = params === null || params === void 0 ? void 0 : params.offset) !== null && _b !== void 0 ? _b : 0;
            const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
            const path = qs.toString() ? `/api/rental/member/rentals/?${qs}` : '/api/rental/member/rentals/';
            console.log('[fetchMemberRentals] Requesting:', path);
            const res = await http.get(path);
            console.log('[fetchMemberRentals] Raw response:', res);
            const payload = unwrapKoalaResponse(res);
            console.log('[fetchMemberRentals] After unwrap:', payload);
            let rows = [];
            let total = 0;
            const ensureArray = (candidate) => (Array.isArray(candidate) ? candidate : []);
            console.log('[fetchMemberRentals] Checking payload structure...');
            console.log('[fetchMemberRentals] payload is Array:', Array.isArray(payload));
            console.log('[fetchMemberRentals] payload.results is Array:', Array.isArray(payload === null || payload === void 0 ? void 0 : payload.results));
            console.log('[fetchMemberRentals] payload.data is Array:', Array.isArray(payload === null || payload === void 0 ? void 0 : payload.data));
            console.log('[fetchMemberRentals] payload.rentals is Array:', Array.isArray(payload === null || payload === void 0 ? void 0 : payload.rentals));
            if (Array.isArray(payload)) {
                console.log('[fetchMemberRentals] Using payload as array');
                rows = payload;
                total = payload.length;
            }
            else if (payload && typeof payload === 'object') {
                if (Array.isArray(payload.results)) {
                    console.log('[fetchMemberRentals] Found payload.results');
                    rows = payload.results;
                    total = (_d = (_c = payload.count) !== null && _c !== void 0 ? _c : payload.total) !== null && _d !== void 0 ? _d : payload.results.length;
                }
                else if (Array.isArray(payload.data)) {
                    console.log('[fetchMemberRentals] Found payload.data');
                    rows = payload.data;
                    total = (_f = (_e = payload.count) !== null && _e !== void 0 ? _e : payload.total) !== null && _f !== void 0 ? _f : payload.data.length;
                }
                else if (Array.isArray(payload.rentals)) {
                    console.log('[fetchMemberRentals] Found payload.rentals');
                    rows = payload.rentals;
                    total = (_g = payload.total) !== null && _g !== void 0 ? _g : payload.rentals.length;
                }
            }
            if (!rows.length) {
                console.log('[fetchMemberRentals] No rows found yet, checking fallback paths...');
                console.log('[fetchMemberRentals] res.data.results is Array:', Array.isArray((_h = res === null || res === void 0 ? void 0 : res.data) === null || _h === void 0 ? void 0 : _h.results));
                console.log('[fetchMemberRentals] res.data is Array:', Array.isArray(res === null || res === void 0 ? void 0 : res.data));
                console.log('[fetchMemberRentals] res is Array:', Array.isArray(res));
                console.log('[fetchMemberRentals] res.results is Array:', Array.isArray(res === null || res === void 0 ? void 0 : res.results));
                if (Array.isArray((_j = res === null || res === void 0 ? void 0 : res.data) === null || _j === void 0 ? void 0 : _j.results)) {
                    console.log('[fetchMemberRentals] Using res.data.results');
                    rows = res.data.results;
                    total = (_l = (_k = res.data.count) !== null && _k !== void 0 ? _k : res.data.total) !== null && _l !== void 0 ? _l : rows.length;
                }
                else if (Array.isArray(res === null || res === void 0 ? void 0 : res.data)) {
                    console.log('[fetchMemberRentals] Using res.data');
                    rows = ensureArray(res.data);
                    total = (_o = (_m = res === null || res === void 0 ? void 0 : res.data) === null || _m === void 0 ? void 0 : _m.length) !== null && _o !== void 0 ? _o : rows.length;
                }
                else if (Array.isArray(res)) {
                    console.log('[fetchMemberRentals] Using res');
                    rows = res;
                    total = rows.length;
                }
                else if (Array.isArray(res === null || res === void 0 ? void 0 : res.results)) {
                    console.log('[fetchMemberRentals] Using res.results');
                    rows = res.results;
                    total = (_q = (_p = res === null || res === void 0 ? void 0 : res.count) !== null && _p !== void 0 ? _p : res === null || res === void 0 ? void 0 : res.total) !== null && _q !== void 0 ? _q : rows.length;
                }
            }
            if (!total) {
                total = (_u = (_t = (_s = (_r = res === null || res === void 0 ? void 0 : res.data) === null || _r === void 0 ? void 0 : _r.count) !== null && _s !== void 0 ? _s : res === null || res === void 0 ? void 0 : res.count) !== null && _t !== void 0 ? _t : res === null || res === void 0 ? void 0 : res.total) !== null && _u !== void 0 ? _u : rows.length;
            }
            console.log('[fetchMemberRentals] Final rows:', rows);
            console.log('[fetchMemberRentals] Final total:', total);
            console.log('[fetchMemberRentals] Returning:', { data: rows, total });
            if ((opts === null || opts === void 0 ? void 0 : opts.updateState) !== false) {
                memberRentals.value = rows;
                memberRentalsTotal.value = total;
                memberRentalsLoading.value = false;
            }
            return { data: rows, total };
        }
        catch (error) {
            console.error('[Rentals] Failed to load member rentals:', error);
            if ((opts === null || opts === void 0 ? void 0 : opts.updateState) !== false) {
                memberRentalsError.value = error instanceof Error ? error.message : '取得租借紀錄失敗';
                memberRentalsLoading.value = false;
            }
            throw error;
        }
    }
    async function fetchMemberRentalDetail(id) {
        var _a, _b;
        if (!id && id !== 0)
            return null;
        try {
            const res = await http.get(`/api/rental/member/rentals/${id}/`);
            return (_b = (_a = res === null || res === void 0 ? void 0 : res.data) !== null && _a !== void 0 ? _a : res) !== null && _b !== void 0 ? _b : null;
        }
        catch (error) {
            console.error('[Rentals] Failed to load member rental detail:', error);
            throw error;
        }
    }
    function clearMemberRentals() {
        memberRentals.value = [];
        memberRentalsTotal.value = 0;
        memberRentalsError.value = undefined;
        memberRentalsLoading.value = false;
    }
    async function fetchStaffRentals(params) {
        var _a, _b, _c, _d, _e, _f;
        // Check if user has staff/admin privileges
        const isPrivileged = (auth.user?.roleId === 'admin' || auth.user?.roleId === 'staff');
        if (!isPrivileged) {
            console.warn('[Rentals] Non-staff user attempted to access staff rentals');
            return { data: [], total: 0 };
        }
        try {
            const limit = (_a = params === null || params === void 0 ? void 0 : params.limit) !== null && _a !== void 0 ? _a : 50;
            const offset = (_b = params === null || params === void 0 ? void 0 : params.offset) !== null && _b !== void 0 ? _b : 0;
            const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
            const rentalStatus = params === null || params === void 0 ? void 0 : params.rentalStatus;
            if (Array.isArray(rentalStatus) && rentalStatus.length > 0) {
                qs.set('rental_status', rentalStatus.join(','));
            }
            else if (typeof rentalStatus === 'string' && rentalStatus.trim() !== '') {
                qs.set('rental_status', rentalStatus);
            }
            if (params === null || params === void 0 ? void 0 : params.search) {
                qs.set('search', params.search);
            }
            const path = qs.toString() ? `/api/rental/staff/rentals/?${qs}` : '/api/rental/staff/rentals/';
            const res = await http.get(path, (params === null || params === void 0 ? void 0 : params.signal) ? { signal: params.signal } : undefined);
            let rows = [];
            let total = 0;
            if ((res === null || res === void 0 ? void 0 : res.code) === 2000 && (res === null || res === void 0 ? void 0 : res.data)) {
                const section = res.data;
                if (Array.isArray(section)) {
                    rows = section;
                    total = section.length;
                }
                else if (Array.isArray(section.results)) {
                    rows = section.results;
                    total = (_c = section.count) !== null && _c !== void 0 ? _c : rows.length;
                }
                else if (Array.isArray(section.rentals)) {
                    rows = section.rentals;
                    total = (_d = section.total) !== null && _d !== void 0 ? _d : rows.length;
                }
            }
            if (!rows.length) {
                rows = Array.isArray(res === null || res === void 0 ? void 0 : res.data) ? res.data : Array.isArray(res) ? res : (res === null || res === void 0 ? void 0 : res.results) || (res === null || res === void 0 ? void 0 : res.rentals) || [];
                total = (_f = (_e = res === null || res === void 0 ? void 0 : res.count) !== null && _e !== void 0 ? _e : res === null || res === void 0 ? void 0 : res.total) !== null && _f !== void 0 ? _f : rows.length;
            }
            return { data: rows, total };
        }
        catch (error) {
            console.error('[Rentals] Failed to load staff rentals:', error);
            throw error;
        }
    }
    async function fetchStaffRentalDetail(id) {
        var _a, _b;
        if (!id && id !== 0)
            return null;
        // Check if user has staff/admin privileges
        const isPrivileged = (auth.user?.roleId === 'admin' || auth.user?.roleId === 'staff');
        if (!isPrivileged) {
            console.warn('[Rentals] Non-staff user attempted to access staff rental detail');
            return null;
        }
        try {
            const res = await http.get(`/api/rental/staff/rentals/${id}/`);
            return (_b = (_a = res === null || res === void 0 ? void 0 : res.data) !== null && _a !== void 0 ? _a : res) !== null && _b !== void 0 ? _b : null;
        }
        catch (error) {
            console.error('[Rentals] Failed to load staff rental detail:', error);
            throw error;
        }
    }
    return {
        // State
        current,
        loading,
        error,
        memberRentals,
        memberRentalsTotal,
        memberRentalsLoading,
        memberRentalsError,
        // Actions
        createRental,
        unlockCurrent,
        cancelCurrent,
        listActiveRentals,
        returnByBikeId,
        returnByRentalId,
        setInUse,
        clearError,
        clearCurrent,
        fetchMemberRentals,
        fetchMemberRentalDetail,
        fetchStaffRentals,
        fetchStaffRentalDetail,
        clearMemberRentals
    };
});
