import { ref, computed, watch, nextTick } from 'vue';
const props = defineProps();
const emit = defineEmits();
// 組件狀態
const isExpanded = ref(false);
const searchQuery = ref('');
const selectedVehicles = ref([...props.modelValue]);
const quickFilter = ref('all');
// 快速過濾選項
const quickFilters = [
    { key: 'all', label: '全部', activeClass: 'bg-indigo-100 text-indigo-800' },
    { key: 'available', label: '可租借', activeClass: 'bg-green-100 text-green-800' },
    { key: 'in-use', label: '使用中', activeClass: 'bg-blue-100 text-blue-800' },
    { key: 'low-battery', label: '低電量', activeClass: 'bg-red-100 text-red-800' },
    { key: 'offline', label: '離線', activeClass: 'bg-gray-100 text-gray-800' }
];
// 計算屬性 - 根據快速過濾篩選車輛
const filteredVehicles = computed(() => {
    let vehicles = props.availableVehicles;
    if (quickFilter.value !== 'all') {
        vehicles = vehicles.filter(vehicle => {
            switch (quickFilter.value) {
                case 'available':
                    return vehicle.status === '可租借' || vehicle.status === 'available';
                case 'in-use':
                    return vehicle.status === '使用中' || vehicle.status === 'in-use' || vehicle.status === 'rented';
                case 'low-battery':
                    return vehicle.status === '低電量' || vehicle.status === 'low-battery' || vehicle.batteryPct < 20;
                case 'offline':
                    return vehicle.status === '離線' || vehicle.status === 'offline' || vehicle.status === 'maintenance';
                default:
                    return true;
            }
        });
    }
    return vehicles;
});
// 計算屬性 - 根據搜索關鍵字進一步篩選
const filteredDisplayVehicles = computed(() => {
    if (!searchQuery.value.trim()) {
        return filteredVehicles.value;
    }
    const query = searchQuery.value.toLowerCase();
    return filteredVehicles.value.filter(vehicle => vehicle.id.toLowerCase().includes(query));
});
// 輔助函數
function toggleExpanded() {
    isExpanded.value = !isExpanded.value;
}
function getStatusText(status) {
    const statusMap = {
        '可租借': '可租借',
        '使用中': '使用中',
        '離線': '離線',
        '維修': '維修',
        '低電量': '低電量',
        'available': '可租借',
        'in-use': '使用中',
        'rented': '使用中',
        'maintenance': '維修',
        'charging': '充電中',
        'low-battery': '低電量'
    };
    return statusMap[status] || status;
}
function getStatusClass(status) {
    const classMap = {
        '可租借': 'bg-green-100 text-green-800',
        '使用中': 'bg-blue-100 text-blue-800',
        '離線': 'bg-gray-100 text-gray-800',
        '維修': 'bg-yellow-100 text-yellow-800',
        '低電量': 'bg-red-100 text-red-800',
        'available': 'bg-green-100 text-green-800',
        'in-use': 'bg-blue-100 text-blue-800',
        'rented': 'bg-blue-100 text-blue-800',
        'maintenance': 'bg-yellow-100 text-yellow-800',
        'charging': 'bg-cyan-100 text-cyan-800',
        'low-battery': 'bg-red-100 text-red-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
}
function getStatusColor(status) {
    const colorMap = {
        '可租借': '#10b981',
        '使用中': '#3b82f6',
        '離線': '#6b7280',
        '維修': '#f59e0b',
        '低電量': '#ef4444',
        'available': '#10b981',
        'in-use': '#3b82f6',
        'rented': '#8b5cf6',
        'maintenance': '#f59e0b',
        'charging': '#06b6d4',
        'low-battery': '#ef4444'
    };
    return colorMap[status] || '#6b7280';
}
// 防止循環更新的標誌
let isUpdatingInternally = false;
// 監聽選擇變化並發射事件
watch(selectedVehicles, (newValue) => {
    if (!isUpdatingInternally) {
        emit('update:modelValue', newValue);
    }
}, { deep: true });
// 監聽外部變化
watch(() => props.modelValue, (newValue) => {
    isUpdatingInternally = true;
    selectedVehicles.value = [...newValue];
    nextTick(() => {
        isUpdatingInternally = false;
    });
});
// 監聽快速過濾變化，自動更新選中的車輛
watch(quickFilter, () => {
    isUpdatingInternally = true;
    // 根據當前過濾條件更新選中車輛
    selectedVehicles.value = filteredVehicles.value.map(v => v.id);
    nextTick(() => {
        isUpdatingInternally = false;
    });
});
// 初始化時選中所有車輛
watch(() => props.availableVehicles, (newVehicles) => {
    if (newVehicles.length > 0 && selectedVehicles.value.length === 0) {
        isUpdatingInternally = true;
        selectedVehicles.value = newVehicles.map(v => v.id);
        nextTick(() => {
            isUpdatingInternally = false;
        });
    }
}, { immediate: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.toggleExpanded) },
    ...{ class: "flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 rounded px-1 py-1 transition-colors" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "text-sm font-semibold text-gray-900" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
    ...{ class: (__VLS_ctx.isExpanded ? 'i-ph-caret-up' : 'i-ph-caret-down') },
    ...{ class: "w-4 h-4 text-gray-500" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-3" },
});
__VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.isExpanded) }, null, null);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-wrap gap-1.5" },
});
for (const [filter] of __VLS_getVForSourceType((__VLS_ctx.quickFilters))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.quickFilter = filter.key;
            } },
        key: (filter.key),
        ...{ class: (__VLS_ctx.quickFilter === filter.key ? filter.activeClass : 'bg-gray-100 text-gray-600 hover:bg-gray-200') },
        ...{ class: "px-2 py-1 rounded-full text-xs font-medium transition-colors" },
    });
    (filter.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "relative" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input, __VLS_intrinsicElements.input)({
    value: (__VLS_ctx.searchQuery),
    type: "text",
    placeholder: "搜索車輛編號...",
    ...{ class: "w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
    ...{ class: "i-ph-magnifying-glass absolute left-2.5 top-2.5 w-3 h-3 text-gray-400" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "max-h-40 overflow-y-auto space-y-1" },
});
for (const [vehicle] of __VLS_getVForSourceType((__VLS_ctx.filteredDisplayVehicles))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        key: (vehicle.id),
        ...{ class: "flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer text-xs" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input, __VLS_intrinsicElements.input)({
        value: (vehicle.id),
        type: "checkbox",
        ...{ class: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" },
    });
    (__VLS_ctx.selectedVehicles);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "w-3 h-3 rounded-full" },
        ...{ style: ({ backgroundColor: __VLS_ctx.getStatusColor(vehicle.status) }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "font-medium text-black" },
    });
    (vehicle.id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: (__VLS_ctx.getStatusClass(vehicle.status)) },
        ...{ class: "px-1 py-0.5 rounded text-xs" },
    });
    (__VLS_ctx.getStatusText(vehicle.status));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-gray-500 text-xs ml-auto" },
    });
    (vehicle.batteryPct);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pt-2 border-t border-gray-200 text-xs text-gray-600" },
});
(__VLS_ctx.selectedVehicles.length);
(__VLS_ctx.filteredVehicles.length);
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['pl-8']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-magnifying-glass']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['left-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['top-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-40']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-black']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            isExpanded: isExpanded,
            searchQuery: searchQuery,
            selectedVehicles: selectedVehicles,
            quickFilter: quickFilter,
            quickFilters: quickFilters,
            filteredVehicles: filteredVehicles,
            filteredDisplayVehicles: filteredDisplayVehicles,
            toggleExpanded: toggleExpanded,
            getStatusText: getStatusText,
            getStatusClass: getStatusClass,
            getStatusColor: getStatusColor,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
