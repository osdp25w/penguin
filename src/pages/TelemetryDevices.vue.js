import { ref, computed, onMounted, watch, onErrorCaptured } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button } from '@/design/components';
import PaginationBar from '@/components/PaginationBar.vue';
import TelemetryDeviceModal from '@/components/modals/TelemetryDeviceModal.vue';
import { usePaging } from '@/composables/usePaging';
import { DEFAULT_TELEMETRY_STATUS_OPTIONS, useTelemetry } from '@/stores/telemetry';
import { useToasts } from '@/stores/toasts';
// 全局錯誤捕獲
onErrorCaptured((err, instance, info) => {
    console.error('[TelemetryDevices] Component error captured:', {
        error: err,
        instance,
        info,
        stack: err.stack
    });
    return false; // 不阻止錯誤傳播
});
const telemetry = useTelemetry();
const toasts = useToasts();
const route = useRoute();
const router = useRouter();
const filters = ref({ status: '', model: '', imei: '' });
const deletingMap = ref({});
const LOCALE_MESSAGES = {
    'zh-TW': {
        'telemetry.delete.confirm': '確定要刪除設備 {imei} 嗎？',
        'telemetry.delete.success': '已刪除設備：{label}',
        'telemetry.delete.error.title': '刪除失敗',
        'telemetry.delete.error.association': '無法刪除，該設備仍綁定腳踏車（例如：{bike}）。請先解除綁定後再刪除。',
        'telemetry.delete.error.generic': '刪除失敗，請稍後再試。',
        'telemetry.delete.action': '刪除',
        'telemetry.delete.working': '刪除中…',
        'telemetry.create.success': '已新增設備：{label}',
        'telemetry.create.error.title': '新增失敗',
        'telemetry.create.error.generic': '新增失敗，請稍後再試。'
    },
    en: {
        'telemetry.delete.confirm': 'Are you sure you want to delete device {imei}?',
        'telemetry.delete.success': 'Device deleted: {label}',
        'telemetry.delete.error.title': 'Delete failed',
        'telemetry.delete.error.association': 'Cannot delete because the device is still bound to a bike (e.g. {bike}). Please unbind it before deleting.',
        'telemetry.delete.error.generic': 'Delete failed. Please try again later.',
        'telemetry.delete.action': 'Delete',
        'telemetry.delete.working': 'Deleting…',
        'telemetry.create.success': 'Device created: {label}',
        'telemetry.create.error.title': 'Create failed',
        'telemetry.create.error.generic': 'Create failed. Please try again later.'
    }
};
function resolveLocale() {
    if (typeof navigator === 'undefined')
        return 'en';
    const lang = navigator.language || (navigator.languages && navigator.languages[0]) || 'en';
    return lang.toLowerCase().includes('zh') ? 'zh-TW' : 'en';
}
const currentLocale = resolveLocale();
function translate(key, params) {
    const table = LOCALE_MESSAGES[currentLocale] || LOCALE_MESSAGES.en;
    const fallback = LOCALE_MESSAGES.en;
    const template = (table === null || table === void 0 ? void 0 : table[key]) || fallback[key] || key;
    if (!params)
        return template;
    return template.replace(/\{(\w+)\}/g, (_, token) => String(params[token] !== undefined ? params[token] : `{${token}}`));
}
// Sorting configuration
const sortConfig = ref({
    field: '',
    order: 'asc'
});
const statusOptions = computed(() => {
    const options = telemetry.statusOptions;
    return (options === null || options === void 0 ? void 0 : options.length) > 0 ? options : DEFAULT_TELEMETRY_STATUS_OPTIONS;
});
function setDeleting(imei, value) {
    if (value) {
        deletingMap.value = Object.assign(Object.assign({}, deletingMap.value), { [imei]: true });
    }
    else {
        const map = Object.assign({}, deletingMap.value);
        delete map[imei];
        deletingMap.value = map;
    }
}
function isDeleting(imei) {
    var _a;
    return Boolean((_a = deletingMap.value) === null || _a === void 0 ? void 0 : _a[imei]);
}
function deviceLabel(device) {
    const name = typeof (device === null || device === void 0 ? void 0 : device.name) === 'string' ? device.name.trim() : '';
    if (name)
        return name;
    return String((device === null || device === void 0 ? void 0 : device.IMEI) || '');
}
function parseKoalaError(error) {
    if (!error)
        return null;
    const raw = typeof error === 'string'
        ? error
        : typeof (error === null || error === void 0 ? void 0 : error.message) === 'string'
            ? error.message
            : '';
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch (_a) {
        return null;
    }
}
function extractErrorDetail(payload) {
    if (!payload || !payload.details)
        return null;
    const details = payload.details;
    if (typeof details === 'string')
        return details;
    if (Array.isArray(details))
        return details.filter(Boolean).join('\n');
    if (typeof details === 'object') {
        const parts = [];
        for (const value of Object.values(details)) {
            if (!value)
                continue;
            if (typeof value === 'string')
                parts.push(value);
            else if (Array.isArray(value))
                parts.push(value.filter(Boolean).join('\n'));
        }
        return parts.length ? parts.join('\n') : null;
    }
    return null;
}
const paging = usePaging({
    fetcher: async ({ limit, offset }) => {
        return await telemetry.fetchDevicesPaged({
            limit,
            offset,
            status: (filters.value.status || undefined),
            model: filters.value.model || undefined,
            IMEI_q: filters.value.imei || undefined
        });
    },
    syncToUrl: true,
    queryPrefix: 'telemetry'
});
const rows = computed(() => {
    let list = [...paging.data.value];
    // Apply sorting
    if (sortConfig.value.field) {
        list.sort((a, b) => {
            let aVal = '';
            let bVal = '';
            switch (sortConfig.value.field) {
                case 'imei':
                    aVal = a.IMEI;
                    bVal = b.IMEI;
                    break;
                case 'name':
                    aVal = a.name || '';
                    bVal = b.name || '';
                    break;
                case 'model':
                    aVal = a.model || '';
                    bVal = b.model || '';
                    break;
                case 'status':
                    aVal = statusLabel(a.status);
                    bVal = statusLabel(b.status);
                    break;
            }
            const compareResult = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return sortConfig.value.order === 'asc' ? compareResult : -compareResult;
        });
    }
    return list;
});
// Sorting function
function handleSort(field) {
    if (sortConfig.value.field === field) {
        sortConfig.value.order = sortConfig.value.order === 'asc' ? 'desc' : 'asc';
    }
    else {
        sortConfig.value.field = field;
        sortConfig.value.order = 'asc';
    }
}
function normStatus(status) {
    const s = String(status || '').toLowerCase().trim();
    if (s === 'available' || s === 'idle' || s === 'free')
        return 'available';
    if (s === 'maintenance' || s === 'maintain')
        return 'maintenance';
    if (s === 'disabled' || s === 'inactive')
        return 'disabled';
    if (s === 'in-use' || s === 'in_use' || s === 'used' || s === 'assigned' || s === 'bound')
        return 'in-use';
    if (s === 'deployed' || s === 'deploy')
        return 'deployed';
    return 'available';
}
function statusLabel(status) {
    const s = normStatus(status);
    const labelMap = {
        'available': '可用',
        'in-use': '使用中',
        'maintenance': '維護中',
        'disabled': '停用',
        'deployed': '已部署'
    };
    return labelMap[s] || status || '-';
}
function statusClass(status) {
    const s = normStatus(status);
    const map = {
        'available': 'bg-green-100 text-green-800 border-green-200',
        'in-use': 'bg-blue-100 text-blue-800 border-blue-200',
        'maintenance': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'disabled': 'bg-gray-100 text-gray-800 border-gray-200',
        'deployed': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return map[s] || 'bg-gray-100 text-gray-800 border-gray-200';
}
async function refreshData() {
    await paging.refresh();
}
function applyFilters() {
    paging.resetToFirstPage();
    paging.refresh();
    // sync to URL
    const q = { ...route.query };
    q['telemetry_status'] = filters.value.status || undefined;
    q['telemetry_model'] = filters.value.model || undefined;
    q['telemetry_imei'] = filters.value.imei || undefined;
    router.replace({ query: q });
}
// modal state
const showModal = ref(false);
const editingDevice = ref(null);
function openCreateModal() {
    editingDevice.value = null;
    showModal.value = true;
}
function openEditModal(d) {
    editingDevice.value = d;
    showModal.value = true;
}
function closeModal() {
    showModal.value = false;
}
async function submitModal(device, isEdit) {
    try {
        if (isEdit) {
            await telemetry.updateDevice(device.IMEI, { name: device.name, model: device.model, status: device.status });
        }
        else {
            await telemetry.createDevice(device);
            toasts.success(translate('telemetry.create.success', {
                label: deviceLabel(device),
                imei: device.IMEI
            }));
        }
        showModal.value = false;
        await paging.refresh();
    }
    catch (error) {
        if (!isEdit) {
            const payload = parseKoalaError(error);
            const detail = extractErrorDetail(payload) || (payload === null || payload === void 0 ? void 0 : payload.msg) || (payload === null || payload === void 0 ? void 0 : payload.message);
            const message = detail
                ? `${translate('telemetry.create.error.generic')}\n${detail}`
                : translate('telemetry.create.error.generic');
            toasts.error(message, translate('telemetry.create.error.title'));
        }
        console.error('[TelemetryDevices] Failed to submit device:', error);
    }
}
// watch filters from url (但不在初始化時觸發)
let isInitializing = true;
watch(() => [filters.value.status, filters.value.model, filters.value.imei], () => {
    if (!isInitializing) {
        applyFilters();
    }
}, { deep: true });
async function confirmDelete(d) {
    if (isDeleting(d.IMEI))
        return;
    if (!confirm(translate('telemetry.delete.confirm', { imei: d.IMEI })))
        return;
    setDeleting(d.IMEI, true);
    try {
        await telemetry.deleteDevice(d.IMEI);
        toasts.success(translate('telemetry.delete.success', {
            label: deviceLabel(d),
            imei: d.IMEI
        }));
        await paging.refresh();
    }
    catch (error) {
        const payload = parseKoalaError(error);
    const associationMessage = payload && payload.details && typeof payload.details.bike_association === 'string'
        ? payload.details.bike_association
        : undefined;
        if (payload && payload.code === 4000 && associationMessage) {
            const match = /bike\s+([A-Za-z0-9_-]+)/i.exec(associationMessage);
            const bikeId = (match === null || match === void 0 ? void 0 : match[1]) || '-';
            const message = translate('telemetry.delete.error.association', { bike: bikeId });
            toasts.error(`${message}\n${associationMessage}`, translate('telemetry.delete.error.title'));
        }
        else {
            toasts.error(translate('telemetry.delete.error.generic'), translate('telemetry.delete.error.title'));
        }
        console.error('[TelemetryDevices] Delete device failed:', error);
    }
    finally {
        setDeleting(d.IMEI, false);
    }
}
onMounted(async () => {
    console.log('[TelemetryDevices] Component mounted, starting initialization...');
    try {
        // restore from url
        const q = route.query;
        filters.value.status = String(q['telemetry_status'] || '');
        filters.value.model = String(q['telemetry_model'] || '');
        filters.value.imei = String(q['telemetry_imei'] || '');
        console.log('[TelemetryDevices] URL filters restored:', filters.value);
        // 同時載入狀態選項和分頁資料
        console.log('[TelemetryDevices] Loading status options and initial data...');
        await Promise.all([
            telemetry.fetchDeviceStatusOptions(),
            paging.refresh({
                status: (filters.value.status || undefined),
                model: filters.value.model || undefined,
                IMEI_q: filters.value.imei || undefined
            })
        ]);
        console.log('[TelemetryDevices] Initialization complete:', {
            statusOptions: telemetry.statusOptions,
            dataLength: paging.data.value.length,
            total: paging.total.value,
            loading: paging.loading.value
        });
        // 初始化完成，允許 watch 觸發
        isInitializing = false;
    }
    catch (error) {
        console.error('[TelemetryDevices] Error during initialization:', error);
        isInitializing = false;
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-2xl font-bold text-gray-900" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "mt-1 text-sm text-gray-700" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-3" },
});
const __VLS_0 = {}.Button;
/** @type {[typeof __VLS_components.Button, typeof __VLS_components.Button, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    variant: "outline",
    size: "sm",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    variant: "outline",
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (__VLS_ctx.refreshData)
};
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
    ...{ class: "i-ph-arrow-clockwise w-4 h-4 mr-2" },
});
var __VLS_3;
const __VLS_8 = {}.Button;
/** @type {[typeof __VLS_components.Button, typeof __VLS_components.Button, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    variant: "primary",
    size: "sm",
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    variant: "primary",
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onClick: (__VLS_ctx.openCreateModal)
};
__VLS_11.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
    ...{ class: "i-ph-plus w-4 h-4 mr-2" },
});
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "card p-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-4 gap-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "td-status",
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    id: "td-status",
    name: "status",
    value: (__VLS_ctx.filters.status),
    ...{ class: "input-base w-full" },
    'aria-label': "狀態",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [s] of __VLS_getVForSourceType((__VLS_ctx.statusOptions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (s),
        value: (s),
    });
    (__VLS_ctx.statusLabel(s));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "max-w-[14rem]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "td-model",
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "td-model",
    name: "model",
    ...{ class: "input-base w-full" },
    placeholder: "例如 TD-2024-IoT",
});
(__VLS_ctx.filters.model);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "max-w-[14rem]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "td-imei",
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "td-imei",
    name: "imei",
    ...{ class: "input-base w-full" },
    placeholder: "輸入 IMEI",
});
(__VLS_ctx.filters.imei);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-end" },
});
const __VLS_16 = {}.Button;
/** @type {[typeof __VLS_components.Button, typeof __VLS_components.Button, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    ...{ 'onClick': {} },
    ...{ class: "w-full md:w-auto" },
}));
const __VLS_18 = __VLS_17({
    ...{ 'onClick': {} },
    ...{ class: "w-full md:w-auto" },
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onClick: (__VLS_ctx.applyFilters)
};
__VLS_19.slots.default;
var __VLS_19;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "card overflow-hidden" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "overflow-x-auto" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
    ...{ class: "w-full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({
    ...{ class: "bg-gray-50" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
    ...{ class: "text-left text-xs font-semibold uppercase tracking-wider text-gray-600" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.handleSort('imei');
        } },
    ...{ class: "px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-1" },
});
if (__VLS_ctx.sortConfig.field === 'imei') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: (__VLS_ctx.sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down') },
        ...{ class: "w-3 h-3" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "i-ph-caret-up-down w-3 h-3 opacity-30" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.handleSort('name');
        } },
    ...{ class: "px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-1" },
});
if (__VLS_ctx.sortConfig.field === 'name') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: (__VLS_ctx.sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down') },
        ...{ class: "w-3 h-3" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "i-ph-caret-up-down w-3 h-3 opacity-30" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.handleSort('model');
        } },
    ...{ class: "px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-1" },
});
if (__VLS_ctx.sortConfig.field === 'model') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: (__VLS_ctx.sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down') },
        ...{ class: "w-3 h-3" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "i-ph-caret-up-down w-3 h-3 opacity-30" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.handleSort('status');
        } },
    ...{ class: "px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-1" },
});
if (__VLS_ctx.sortConfig.field === 'status') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: (__VLS_ctx.sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down') },
        ...{ class: "w-3 h-3" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "i-ph-caret-up-down w-3 h-3 opacity-30" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    ...{ class: "px-4 py-3 text-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({
    ...{ class: "bg-white divide-y divide-gray-200" },
});
for (const [d] of __VLS_getVForSourceType((__VLS_ctx.rows))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
        key: (d.IMEI),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "px-4 py-3 text-sm font-mono text-gray-900" },
    });
    (d.IMEI);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "px-4 py-3 text-sm text-gray-900" },
    });
    (d.name || '-');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "px-4 py-3 text-sm text-gray-900" },
    });
    (d.model || '-');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "px-4 py-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border" },
        ...{ class: (__VLS_ctx.statusClass(d.status)) },
    });
    (__VLS_ctx.statusLabel(d.status));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "px-4 py-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-2 justify-end" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.openEditModal(d);
            } },
        ...{ class: "inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500 transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "i-ph-pencil-simple w-3.5 h-3.5 mr-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ 'data-testid': "telemetry-delete-btn" },
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.confirmDelete(d);
            } },
        disabled: (__VLS_ctx.isDeleting(d.IMEI)),
        'aria-busy': (__VLS_ctx.isDeleting(d.IMEI)),
        ...{ class: "inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-red-500" },
        ...{ class: (__VLS_ctx.isDeleting(d.IMEI) ? 'opacity-60 cursor-not-allowed bg-red-50' : 'hover:bg-red-50') },
    });
    if (!__VLS_ctx.isDeleting(d.IMEI)) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-trash w-3.5 h-3.5 mr-1" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-spinner w-3.5 h-3.5 mr-1 animate-spin" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.isDeleting(d.IMEI) ? __VLS_ctx.translate('telemetry.delete.working') : __VLS_ctx.translate('telemetry.delete.action'));
}
if (!__VLS_ctx.rows.length && !__VLS_ctx.paging.loading.value) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center py-8 text-gray-600" },
    });
}
if (__VLS_ctx.paging.loading.value) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center py-8 text-gray-600" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i)({
        ...{ class: "i-ph-spinner animate-spin inline-block mr-2" },
    });
}
if (__VLS_ctx.paging.total.value > 0) {
    /** @type {[typeof PaginationBar, ]} */ ;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent(PaginationBar, new PaginationBar({
        ...{ 'onPageChange': {} },
        ...{ 'onLimitChange': {} },
        ...{ 'onPrev': {} },
        ...{ 'onNext': {} },
        currentPage: (__VLS_ctx.paging.currentPage.value),
        totalPages: (__VLS_ctx.paging.totalPages.value),
        total: (__VLS_ctx.paging.total.value),
        limit: (__VLS_ctx.paging.limit.value),
        offset: (__VLS_ctx.paging.offset.value),
        pageRange: (__VLS_ctx.paging.pageRange.value),
        hasNextPage: (__VLS_ctx.paging.hasNextPage.value),
        hasPrevPage: (__VLS_ctx.paging.hasPrevPage.value),
    }));
    const __VLS_25 = __VLS_24({
        ...{ 'onPageChange': {} },
        ...{ 'onLimitChange': {} },
        ...{ 'onPrev': {} },
        ...{ 'onNext': {} },
        currentPage: (__VLS_ctx.paging.currentPage.value),
        totalPages: (__VLS_ctx.paging.totalPages.value),
        total: (__VLS_ctx.paging.total.value),
        limit: (__VLS_ctx.paging.limit.value),
        offset: (__VLS_ctx.paging.offset.value),
        pageRange: (__VLS_ctx.paging.pageRange.value),
        hasNextPage: (__VLS_ctx.paging.hasNextPage.value),
        hasPrevPage: (__VLS_ctx.paging.hasPrevPage.value),
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    let __VLS_27;
    let __VLS_28;
    let __VLS_29;
    const __VLS_30 = {
        onPageChange: (__VLS_ctx.paging.goToPage)
    };
    const __VLS_31 = {
        onLimitChange: (__VLS_ctx.paging.changeLimit)
    };
    const __VLS_32 = {
        onPrev: (__VLS_ctx.paging.prevPage)
    };
    const __VLS_33 = {
        onNext: (__VLS_ctx.paging.nextPage)
    };
    var __VLS_26;
}
if (__VLS_ctx.showModal) {
    /** @type {[typeof TelemetryDeviceModal, ]} */ ;
    // @ts-ignore
    const __VLS_34 = __VLS_asFunctionalComponent(TelemetryDeviceModal, new TelemetryDeviceModal({
        ...{ 'onClose': {} },
        ...{ 'onSubmit': {} },
        device: (__VLS_ctx.editingDevice),
        statusOptions: (__VLS_ctx.statusOptions),
    }));
    const __VLS_35 = __VLS_34({
        ...{ 'onClose': {} },
        ...{ 'onSubmit': {} },
        device: (__VLS_ctx.editingDevice),
        statusOptions: (__VLS_ctx.statusOptions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_34));
    let __VLS_37;
    let __VLS_38;
    let __VLS_39;
    const __VLS_40 = {
        onClose: (__VLS_ctx.closeModal)
    };
    const __VLS_41 = {
        onSubmit: (__VLS_ctx.submitModal)
    };
    var __VLS_36;
}
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-arrow-clockwise']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-plus']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['input-base']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-[14rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['input-base']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-[14rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['input-base']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['md:w-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-caret-up-down']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-30']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-caret-up-down']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-30']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-caret-up-down']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-30']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-caret-up-down']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-30']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
/** @type {__VLS_StyleScopedClasses['divide-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-offset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-pencil-simple']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-red-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-700']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-red-50']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-offset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-trash']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Button: Button,
            PaginationBar: PaginationBar,
            TelemetryDeviceModal: TelemetryDeviceModal,
            filters: filters,
            sortConfig: sortConfig,
            statusOptions: statusOptions,
            paging: paging,
            rows: rows,
            handleSort: handleSort,
            statusLabel: statusLabel,
            statusClass: statusClass,
            translate: translate,
            isDeleting: isDeleting,
            refreshData: refreshData,
            applyFilters: applyFilters,
            showModal: showModal,
            editingDevice: editingDevice,
            openCreateModal: openCreateModal,
            openEditModal: openEditModal,
            closeModal: closeModal,
            submitModal: submitModal,
            confirmDelete: confirmDelete,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
