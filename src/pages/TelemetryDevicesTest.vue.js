import { ref, computed, onMounted, onErrorCaptured } from 'vue';
import { DEFAULT_TELEMETRY_STATUS_OPTIONS, useTelemetry } from '@/stores/telemetry';
import { usePaging } from '@/composables/usePaging';
console.log('[TelemetryDevicesTest] Component loading...');
onErrorCaptured((err, instance, info) => {
    console.error('[TelemetryDevicesTest] Error:', err, instance, info);
    return false;
});
const telemetry = useTelemetry();
const loading = ref(true);
const data = ref([]);
const paging = usePaging({
    fetcher: async ({ limit, offset }) => {
        console.log('[TelemetryDevicesTest] Fetcher called with:', { limit, offset });
        try {
            return await telemetry.fetchDevicesPaged({ limit, offset });
        }
        catch (error) {
            console.error('[TelemetryDevicesTest] Fetcher error:', error);
            return { data: [], total: 0 };
        }
    }
});
const statusOptions = computed(() => {
    console.log('[TelemetryDevicesTest] StatusOptions computed:', telemetry.statusOptions);
    const options = telemetry.statusOptions || [];
    return options.length > 0 ? options : DEFAULT_TELEMETRY_STATUS_OPTIONS;
});
const telemetryStoreStatus = computed(() => {
    return telemetry ? '✅ Telemetry store 載入成功' : '❌ Telemetry store 載入失敗';
});
const pagingStatus = computed(() => {
    return paging ? '✅ Paging composable 載入成功' : '❌ Paging composable 載入失敗';
});
onMounted(async () => {
    console.log('[TelemetryDevicesTest] Component mounted');
    try {
        loading.value = true;
        console.log('[TelemetryDevicesTest] Fetching status options...');
        await telemetry.fetchDeviceStatusOptions();
        console.log('[TelemetryDevicesTest] Refreshing paging...');
        await paging.refresh();
        data.value = paging.data.value;
        console.log('[TelemetryDevicesTest] Data loaded:', data.value);
    }
    catch (error) {
        console.error('[TelemetryDevicesTest] Mount error:', error);
    }
    finally {
        loading.value = false;
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "p-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-2xl font-bold mb-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "mb-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-blue-50 p-4 rounded mb-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "font-semibold mb-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
    ...{ class: "space-y-1 text-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
(__VLS_ctx.telemetryStoreStatus);
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
(__VLS_ctx.pagingStatus);
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
(__VLS_ctx.statusOptions.length);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-gray-50 p-4 rounded" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "font-semibold mb-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
    ...{ class: "text-xs" },
});
(JSON.stringify({ loading: __VLS_ctx.loading, data: __VLS_ctx.data.slice(0, 2) }, null, 2));
/** @type {__VLS_StyleScopedClasses['p-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            loading: loading,
            data: data,
            statusOptions: statusOptions,
            telemetryStoreStatus: telemetryStoreStatus,
            pagingStatus: pagingStatus,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
