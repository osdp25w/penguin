// src/stores/telemetry.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { http } from '@/lib/api';
export const useTelemetry = defineStore('telemetry', () => {
    const devices = ref([]);
    const available = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const statusOptions = ref([]);
    async function fetchDevices(params) {
        loading.value = true;
        error.value = null;
        try {
            const qs = new URLSearchParams();
            if (params === null || params === void 0 ? void 0 : params.status)
                qs.set('status', params.status);
            if (params === null || params === void 0 ? void 0 : params.model)
                qs.set('model', params.model);
            if (params === null || params === void 0 ? void 0 : params.IMEI_q)
                qs.set('IMEI_q', params.IMEI_q);
            const url = `/api/telemetry/devices${qs.toString() ? `?${qs.toString()}` : ''}`;
            const res = await http.get(url);
            const rows = (res === null || res === void 0 ? void 0 : res.results) || (res === null || res === void 0 ? void 0 : res.data) || res || [];
            devices.value = rows.map((r) => ({
                IMEI: r.IMEI || r.imei || r.id,
                name: r.name,
                model: r.model,
                status: r.status || 'available'
            }));
        }
        catch (e) {
            // fallback demo
            devices.value = [
                { IMEI: '867295075673001', name: 'TD-001', model: 'TD-2024', status: 'available' },
                { IMEI: '867295075673002', name: 'TD-002', model: 'TD-2024', status: 'maintenance' }
            ];
            error.value = '無法讀取遙測設備（使用預設）';
        }
        finally {
            loading.value = false;
        }
    }
    async function fetchAvailable() {
        await fetchDevices({ status: 'available' });
        available.value = devices.value.filter(d => d.status === 'available');
    }
    async function fetchDevicesPaged(params) {
        const { limit = 20, offset = 0, ...filters } = params || {};
        loading.value = true;
        error.value = null;
        try {
            const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
            if (filters.status)
                qs.set('status', filters.status);
            if (filters.model)
                qs.set('model', filters.model);
            if (filters.IMEI_q)
                qs.set('IMEI_q', filters.IMEI_q);
            const url = `/api/telemetry/devices${qs.toString() ? `?${qs.toString()}` : ''}`;
            const res = await http.get(url);
            const rows = (res === null || res === void 0 ? void 0 : res.results) || (res === null || res === void 0 ? void 0 : res.data) || res || [];
            const total = (res === null || res === void 0 ? void 0 : res.total_count) || (res === null || res === void 0 ? void 0 : res.count) || rows.length;
            const out = rows.map((r) => ({
                IMEI: r.IMEI || r.imei || r.id,
                name: r.name,
                model: r.model,
                status: r.status || 'available'
            }));
            devices.value = out;
            return { data: out, total };
        }
        catch (e) {
            // fallback demo
            const all = [
                { IMEI: '867295075673001', name: 'TD-001', model: 'TD-2024', status: 'available' },
                { IMEI: '867295075673002', name: 'TD-002', model: 'TD-2024', status: 'maintenance' },
                { IMEI: '867295075673003', name: 'TD-003', model: 'TD-2024-IoT', status: 'available' }
            ];
            const filtered = all.filter(d => (!filters.status || d.status === filters.status) &&
                (!filters.model || (d.model || '').includes(filters.model)) &&
                (!filters.IMEI_q || d.IMEI.includes(filters.IMEI_q)));
            const data = filtered.slice(offset, offset + limit);
            devices.value = data;
            return { data, total: filtered.length };
        }
        finally {
            loading.value = false;
        }
    }
    async function fetchDeviceStatusOptions() {
        try {
            const res = await http.get('/api/telemetry/device-status-options/');
            const rows = (res === null || res === void 0 ? void 0 : res.results) || (res === null || res === void 0 ? void 0 : res.data) || res || [];
            statusOptions.value = Array.isArray(rows) ? rows : Object.values(rows || {});
            if (!Array.isArray(statusOptions.value) || statusOptions.value.length === 0) {
                statusOptions.value = ['available', 'in-use', 'maintenance', 'disabled'];
            }
        }
        catch (_a) {
            statusOptions.value = ['available', 'in-use', 'maintenance', 'disabled'];
        }
    }
    async function createDevice(payload) {
        const res = await http.post('/api/telemetry/devices/', {
            IMEI: payload.IMEI,
            name: payload.name,
            model: payload.model,
            status: payload.status || 'available'
        });
        // refresh list
        await fetchDevices();
        return res;
    }
    async function updateDevice(IMEI, patch) {
        const res = await http.patch(`/api/telemetry/devices/${IMEI}/`, patch);
        await fetchDevices();
        return res;
    }
    async function deleteDevice(IMEI) {
        await http.del(`/api/telemetry/devices/${IMEI}/`);
        await fetchDevices();
    }
    return { devices, available, loading, error, statusOptions, fetchDevices, fetchAvailable, fetchDevicesPaged, fetchDeviceStatusOptions, createDevice, updateDevice, deleteDevice };
});
