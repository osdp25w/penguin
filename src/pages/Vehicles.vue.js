import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button } from '@/design/components';
import { useVehicles } from '@/stores/vehicles';
import { useSites } from '@/stores/sites';
import { usePaging } from '@/composables/usePaging';
import { useBikeMeta } from '@/stores/bikeMeta';
import { useTelemetry } from '@/stores/telemetry';
import VehicleDetailModal from '@/components/modals/VehicleDetailModal.vue';
import CreateVehicleModal from '@/components/modals/CreateVehicleModal.vue';
import VehicleBadges from '@/components/VehicleBadges.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import { useBikeErrors } from '@/stores/bikeErrors';
// Stores
const vehiclesStore = useVehicles();
const sitesStore = useSites();
const bikeMeta = useBikeMeta();
const telemetry = useTelemetry();
const route = useRoute();
const router = useRouter();
const bikeErrors = useBikeErrors();
// Reactive data
const sparklineRefs = ref({});
const selectedVehicle = ref(null);
const showCreateModal = ref(false);
const filters = ref({
    siteId: '',
    status: '',
    keyword: '',
    lowBattery: false
});
// Sorting configuration
const sortConfig = ref({
    field: '',
    order: 'asc'
});
// 分頁功能
const paging = usePaging({
    fetcher: async ({ limit, offset }) => {
        return await vehiclesStore.fetchVehiclesPaged({
            limit,
            offset,
            ...filters.value
        });
    },
    syncToUrl: true,
    queryPrefix: 'vehicles'
});
// Computed
const vehicles = computed(() => paging.data.value);
// 兼容不同 store 寫法：優先 list，退回 sites
const siteOptions = computed(() => { var _a, _b; return (_b = (_a = sitesStore.list) !== null && _a !== void 0 ? _a : sitesStore.sites) !== null && _b !== void 0 ? _b : []; });
// 分頁模式下，仍在前端套用一層狀態/關鍵字/低電量過濾，確保 UI 與期望一致
const filteredVehicles = computed(() => {
    let list = vehicles.value.slice();
    // 站點（若後端未正確套用，前端再次過濾）
    if (filters.value.siteId) {
        list = list.filter(v => String(v.siteId || '') === String(filters.value.siteId));
    }
    // 狀態過濾
    if (filters.value.status) {
        const s = String(filters.value.status);
        list = list.filter(v => v.status === s || getStatusText(v.status) === getStatusText(s));
    }
    // 低電量
    if (filters.value.lowBattery) {
        list = list.filter(v => { var _a, _b; return ((_b = (_a = v.batteryLevel) !== null && _a !== void 0 ? _a : v.batteryPct) !== null && _b !== void 0 ? _b : 100) < 20; });
    }
    // 關鍵字
    if (filters.value.keyword && filters.value.keyword.trim()) {
        const q = filters.value.keyword.trim().toLowerCase();
        list = list.filter(v => String(v.id).toLowerCase().includes(q) || String(v.name || v.model || '').toLowerCase().includes(q));
    }
    // Apply sorting
    if (sortConfig.value.field) {
        list.sort((a, b) => {
            let aVal = '';
            let bVal = '';
            switch (sortConfig.value.field) {
                case 'name':
                    aVal = a.name || a.model || 'E-Bike';
                    bVal = b.name || b.model || 'E-Bike';
                    break;
                case 'id':
                    aVal = a.id;
                    bVal = b.id;
                    break;
                case 'batteryLevel':
                    aVal = a.batteryLevel || a.batteryPct || 0;
                    bVal = b.batteryLevel || b.batteryPct || 0;
                    break;
                case 'status':
                    aVal = getStatusText(a.status);
                    bVal = getStatusText(b.status);
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
const stats = computed(() => {
    const total = paging.total.value;
    const available = vehicles.value.filter(v => v.status === 'available' || v.status === '可租借').length;
    const inUse = vehicles.value.filter(v => v.status === 'in-use' || v.status === '使用中').length;
    const needsAttention = vehicles.value.filter(v => {
        const battery = v.batteryLevel || v.batteryPct || 0;
        const hasIssues = [
            v.motorStatus,
            v.batteryStatus,
            v.controllerStatus,
            v.portStatus,
            v.mqttStatus
        ].some(status => status === 'error' || status === 'offline');
        const hasErrorLog = bikeErrors.hasCritical(String(v.id));
        return battery < 20 || hasIssues || hasErrorLog;
    }).length;
    return { total, available, inUse, needsAttention };
});
// Methods
const refreshData = async () => {
    console.log('刷新車輛資料...');
    try {
        await Promise.all([
            paging.refresh(),
            sitesStore.fetchSites()
        ]);
        console.log('車輛資料載入完成:', vehicles.value.length, '輛車');
    }
    catch (error) {
        console.error('載入車輛資料失敗:', error);
    }
};
// 當篩選條件改變時，重置到第一頁並重新載入
const applyFilters = () => {
    paging.resetToFirstPage();
    paging.refresh(filters.value);
};
const getSiteName = (siteId) => {
    const site = siteOptions.value.find((s) => s.id === siteId);
    return (site === null || site === void 0 ? void 0 : site.name) || '未知站點';
};
const getStatusText = (status) => {
    const statusMap = {
        'available': '可用',
        'in-use': '使用中',
        'maintenance': '維護中',
        'low-battery': '低電量'
    };
    return statusMap[status] || status;
};
const getStatusStyle = (status) => {
    const styleMap = {
        'available': 'bg-green-100 text-green-800',
        'in-use': 'bg-blue-100 text-blue-800',
        'maintenance': 'bg-yellow-100 text-yellow-800',
        'low-battery': 'bg-red-100 text-red-800'
    };
    return styleMap[status] || 'bg-gray-100 text-gray-800';
};
const getBatteryColorClass = (level) => {
    if (level > 60)
        return 'bg-green-500';
    if (level > 30)
        return 'bg-yellow-500';
    return 'bg-red-500';
};
const getComponentStatusClass = (status) => {
    const statusMap = {
        'normal': 'bg-green-100 text-green-800',
        'warning': 'bg-yellow-100 text-yellow-800',
        'error': 'bg-red-100 text-red-800',
        'offline': 'bg-gray-100 text-gray-800',
        'online': 'bg-green-100 text-green-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
};
const getComponentStatusText = (status) => {
    const statusMap = {
        'normal': '正常',
        'warning': '警告',
        'error': '異常',
        'offline': '離線',
        'online': '連線'
    };
    return statusMap[status] || status || '未知';
};
const selectVehicle = (vehicle) => {
    selectedVehicle.value = { ...vehicle };
};
const handleVehicleUpdated = (vehicle) => {
    selectedVehicle.value = { ...vehicle };
    paging.refresh();
};
const handleVehicleDeleted = async () => {
    selectedVehicle.value = null;
    await paging.refresh();
};
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-TW');
};
const drawSparkline = (canvas, data) => {
    if (!canvas || !data || data.length === 0)
        return;
    const ctx = canvas.getContext('2d');
    if (!ctx)
        return;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.clearRect(0, 0, width, height);
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    data.forEach((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        if (index === 0) {
            ctx.moveTo(x, y);
        }
        else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
};
const renderSparklines = async () => {
    await nextTick();
    filteredVehicles.value.forEach(vehicle => {
        const canvas = sparklineRefs.value[vehicle.id];
        if (canvas && vehicle.batteryTrend) {
            const data = vehicle.batteryTrend.map(t => t.v);
            drawSparkline(canvas, data);
        }
    });
};
const openCreateModal = () => {
    showCreateModal.value = true;
};
const handleCreateVehicle = async (vehicle) => {
    await vehiclesStore.createVehicle(vehicle);
    showCreateModal.value = false;
};
// 監聽篩選條件變化
watch(() => [filters.value.siteId, filters.value.status, filters.value.keyword, filters.value.lowBattery], () => {
    applyFilters();
    // 同步到 URL（不影響其他 query）
    const q = { ...route.query };
    q['vehicles_siteId'] = filters.value.siteId || undefined;
    q['vehicles_status'] = filters.value.status || undefined;
    q['vehicles_keyword'] = filters.value.keyword || undefined;
    q['vehicles_lowBattery'] = filters.value.lowBattery ? '1' : undefined;
    router.replace({ query: q });
}, { deep: true });
// Lifecycle
// 監聽過濾器變化，自動重新載入資料
watch(filters, async () => {
    // 重置到第一頁並重新載入
    await paging.reset();
}, { deep: true });
onMounted(async () => {
    // 從 URL 還原篩選條件
    const q = route.query;
    const qp = (k) => q[`vehicles_${k}`];
    filters.value.siteId = String(qp('siteId') || '');
    filters.value.status = String(qp('status') || '');
    filters.value.keyword = String(qp('keyword') || '');
    filters.value.lowBattery = qp('lowBattery') === '1';
    await Promise.all([
        sitesStore.fetchSites(),
        bikeMeta.fetchCategories(),
        bikeMeta.fetchSeries(),
        bikeMeta.fetchBikeStatusOptions(),
        telemetry.fetchAvailable()
        // bikeErrors.fetchCriticalUnread() - API endpoint doesn't exist
    ]);
    // 初始載入分頁資料
    await paging.refresh(filters.value);
    renderSparklines();
});
// Watch for filter changes to re-render sparklines
// computed(() => filteredVehicles.value.length).watch(() => {
//   nextTick(renderSparklines)
// })
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
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
    ...{ class: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-white rounded-lg border border-gray-200 p-4 shadow-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-sm font-medium text-gray-600" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-2xl font-bold text-gray-900" },
});
(__VLS_ctx.stats.total || 0);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-white rounded-lg border border-gray-200 p-4 shadow-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-sm font-medium text-gray-600" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-2xl font-bold text-green-600" },
});
(__VLS_ctx.stats.available);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-white rounded-lg border border-gray-200 p-4 shadow-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-sm font-medium text-gray-600" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-2xl font-bold text-blue-600" },
});
(__VLS_ctx.stats.inUse);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-white rounded-lg border border-gray-200 p-4 shadow-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-sm font-medium text-gray-600" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-2xl font-bold text-red-600" },
});
(__VLS_ctx.stats.needsAttention);
if (__VLS_ctx.vehiclesStore.usingMock) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rounded-lg border border-amber-300 bg-amber-50 text-amber-800 p-3 flex items-start gap-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "i-ph-info w-5 h-5 mt-0.5" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "card p-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-3 gap-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.filters.siteId),
    ...{ class: "input-base" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [site] of __VLS_getVForSourceType((__VLS_ctx.siteOptions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (site.id),
        value: (site.id),
    });
    (site.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.filters.status),
    ...{ class: "input-base" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "available",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "in-use",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "maintenance",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "flex items-center" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input, __VLS_intrinsicElements.input)({
    type: "checkbox",
    ...{ class: "rounded border-gray-300 text-brand-primary focus:ring-brand-primary focus:ring-offset-0" },
});
(__VLS_ctx.filters.lowBattery);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "ml-2 text-sm text-gray-700" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "relative md:max-w-[16rem] lg:max-w-[18rem]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input, __VLS_intrinsicElements.input)({
    value: (__VLS_ctx.filters.keyword),
    type: "text",
    placeholder: "輸入ID...",
    ...{ class: "input-base pl-9 w-full md:max-w-[16rem] lg:max-w-[18rem]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
    ...{ class: "i-ph-magnifying-glass absolute left-3 top-2.5 w-4 h-4 text-gray-600" },
});
if (__VLS_ctx.paging.loading.value) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center py-8" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "i-ph-spinner w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-gray-600" },
    });
}
else if (__VLS_ctx.paging.error.value) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center py-8" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "i-ph-warning-circle w-8 h-8 mx-auto text-red-400 mb-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-red-600 mb-4" },
    });
    (__VLS_ctx.paging.error.value);
    const __VLS_16 = {}.Button;
    /** @type {[typeof __VLS_components.Button, typeof __VLS_components.Button, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        ...{ 'onClick': {} },
    }));
    const __VLS_18 = __VLS_17({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    let __VLS_20;
    let __VLS_21;
    let __VLS_22;
    const __VLS_23 = {
        onClick: (__VLS_ctx.refreshData)
    };
    __VLS_19.slots.default;
    var __VLS_19;
}
else {
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
                if (!!(__VLS_ctx.paging.loading.value))
                    return;
                if (!!(__VLS_ctx.paging.error.value))
                    return;
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
                if (!!(__VLS_ctx.paging.loading.value))
                    return;
                if (!!(__VLS_ctx.paging.error.value))
                    return;
                __VLS_ctx.handleSort('id');
            } },
        ...{ class: "px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-1" },
    });
    if (__VLS_ctx.sortConfig.field === 'id') {
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
                if (!!(__VLS_ctx.paging.loading.value))
                    return;
                if (!!(__VLS_ctx.paging.error.value))
                    return;
                __VLS_ctx.handleSort('batteryLevel');
            } },
        ...{ class: "px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-1" },
    });
    if (__VLS_ctx.sortConfig.field === 'batteryLevel') {
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
                if (!!(__VLS_ctx.paging.loading.value))
                    return;
                if (!!(__VLS_ctx.paging.error.value))
                    return;
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({
        ...{ class: "bg-white divide-y divide-gray-200" },
    });
    for (const [vehicle] of __VLS_getVForSourceType((__VLS_ctx.filteredVehicles))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.paging.loading.value))
                        return;
                    if (!!(__VLS_ctx.paging.error.value))
                        return;
                    __VLS_ctx.selectVehicle(vehicle);
                } },
            key: (vehicle.id),
            ...{ class: "hover:bg-gray-50 cursor-pointer" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-4 py-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-sm font-medium text-gray-900" },
        });
        (vehicle.name || vehicle.model || 'E-Bike');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-4 py-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-sm font-medium text-gray-900" },
        });
        (vehicle.id);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-4 py-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center gap-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "text-sm font-medium text-gray-900" },
        });
        (vehicle.batteryLevel || vehicle.batteryPct || 0);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "w-16 bg-gray-200 rounded-full h-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "h-2 rounded-full" },
            ...{ class: (__VLS_ctx.getBatteryColorClass(vehicle.batteryLevel || vehicle.batteryPct || 0)) },
            ...{ style: ({ width: `${vehicle.batteryLevel || vehicle.batteryPct || 0}%` }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-4 py-4" },
        });
        /** @type {[typeof VehicleBadges, ]} */ ;
        // @ts-ignore
        const __VLS_24 = __VLS_asFunctionalComponent(VehicleBadges, new VehicleBadges({
            status: (vehicle.status),
            batteryLevel: (vehicle.batteryLevel || vehicle.batteryPct || 0),
            mqttStatus: (vehicle.mqttStatus),
            hasError: (__VLS_ctx.bikeErrors.hasCritical(String(vehicle.id))),
        }));
        const __VLS_25 = __VLS_24({
            status: (vehicle.status),
            batteryLevel: (vehicle.batteryLevel || vehicle.batteryPct || 0),
            mqttStatus: (vehicle.mqttStatus),
            hasError: (__VLS_ctx.bikeErrors.hasCritical(String(vehicle.id))),
        }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    }
    if (__VLS_ctx.filteredVehicles.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-center py-8" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-bicycle w-12 h-12 mx-auto text-gray-400 mb-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            ...{ class: "text-lg font-medium text-gray-900 mb-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-gray-500" },
        });
    }
}
if (__VLS_ctx.paging.total.value > 0) {
    /** @type {[typeof PaginationBar, ]} */ ;
    // @ts-ignore
    const __VLS_27 = __VLS_asFunctionalComponent(PaginationBar, new PaginationBar({
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
    const __VLS_28 = __VLS_27({
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
    }, ...__VLS_functionalComponentArgsRest(__VLS_27));
    let __VLS_30;
    let __VLS_31;
    let __VLS_32;
    const __VLS_33 = {
        onPageChange: (__VLS_ctx.paging.goToPage)
    };
    const __VLS_34 = {
        onLimitChange: (__VLS_ctx.paging.changeLimit)
    };
    const __VLS_35 = {
        onPrev: (__VLS_ctx.paging.prevPage)
    };
    const __VLS_36 = {
        onNext: (__VLS_ctx.paging.nextPage)
    };
    var __VLS_29;
}
if (__VLS_ctx.selectedVehicle) {
    /** @type {[typeof VehicleDetailModal, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(VehicleDetailModal, new VehicleDetailModal({
        ...{ 'onClose': {} },
        ...{ 'onUpdated': {} },
        ...{ 'onDeleted': {} },
        vehicle: (__VLS_ctx.selectedVehicle),
    }));
    const __VLS_38 = __VLS_37({
        ...{ 'onClose': {} },
        ...{ 'onUpdated': {} },
        ...{ 'onDeleted': {} },
        vehicle: (__VLS_ctx.selectedVehicle),
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    let __VLS_40;
    let __VLS_41;
    let __VLS_42;
    const __VLS_43 = {
        onClose: (...[$event]) => {
            if (!(__VLS_ctx.selectedVehicle))
                return;
            __VLS_ctx.selectedVehicle = null;
        }
    };
    const __VLS_44 = {
        onUpdated: (__VLS_ctx.handleVehicleUpdated)
    };
    const __VLS_45 = {
        onDeleted: (__VLS_ctx.handleVehicleDeleted)
    };
    var __VLS_39;
}
if (__VLS_ctx.showCreateModal) {
    /** @type {[typeof CreateVehicleModal, ]} */ ;
    // @ts-ignore
    const __VLS_46 = __VLS_asFunctionalComponent(CreateVehicleModal, new CreateVehicleModal({
        ...{ 'onClose': {} },
        ...{ 'onCreated': {} },
        sites: (__VLS_ctx.siteOptions),
    }));
    const __VLS_47 = __VLS_46({
        ...{ 'onClose': {} },
        ...{ 'onCreated': {} },
        sites: (__VLS_ctx.siteOptions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_46));
    let __VLS_49;
    let __VLS_50;
    let __VLS_51;
    const __VLS_52 = {
        onClose: (...[$event]) => {
            if (!(__VLS_ctx.showCreateModal))
                return;
            __VLS_ctx.showCreateModal = false;
        }
    };
    const __VLS_53 = {
        onCreated: (__VLS_ctx.handleCreateVehicle)
    };
    var __VLS_48;
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
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-amber-300']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-amber-50']} */ ;
/** @type {__VLS_StyleScopedClasses['text-amber-800']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-info']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['input-base']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['input-base']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-brand-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-brand-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-offset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['md:max-w-[16rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:max-w-[18rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['input-base']} */ ;
/** @type {__VLS_StyleScopedClasses['pl-9']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['md:max-w-[16rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:max-w-[18rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-magnifying-glass']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['left-3']} */ ;
/** @type {__VLS_StyleScopedClasses['top-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-warning-circle']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
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
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
/** @type {__VLS_StyleScopedClasses['divide-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['w-16']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-bicycle']} */ ;
/** @type {__VLS_StyleScopedClasses['w-12']} */ ;
/** @type {__VLS_StyleScopedClasses['h-12']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Button: Button,
            VehicleDetailModal: VehicleDetailModal,
            CreateVehicleModal: CreateVehicleModal,
            VehicleBadges: VehicleBadges,
            PaginationBar: PaginationBar,
            vehiclesStore: vehiclesStore,
            bikeErrors: bikeErrors,
            selectedVehicle: selectedVehicle,
            showCreateModal: showCreateModal,
            filters: filters,
            sortConfig: sortConfig,
            paging: paging,
            siteOptions: siteOptions,
            filteredVehicles: filteredVehicles,
            handleSort: handleSort,
            stats: stats,
            refreshData: refreshData,
            getBatteryColorClass: getBatteryColorClass,
            selectVehicle: selectVehicle,
            handleVehicleUpdated: handleVehicleUpdated,
            handleVehicleDeleted: handleVehicleDeleted,
            openCreateModal: openCreateModal,
            handleCreateVehicle: handleCreateVehicle,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
