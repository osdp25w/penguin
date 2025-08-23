import { reactive, ref, onMounted } from 'vue';
import { Button, Card, KpiCard, EmptyState } from '@/design/components';
import SocTrend from '@/components/charts/SocTrend.vue';
import CarbonBar from '@/components/charts/CarbonBar.vue';
// Reactive data
const selectedPeriod = ref('today');
const isLoading = ref(false);
const socLoading = ref(false);
const carbonLoading = ref(false);
const summary = reactive({
    online: 42,
    offline: 8,
    distance: 128.5,
    carbon: 9.6
});
// Chart data
const socLabels = ['00h', '02h', '04h', '06h', '08h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];
const socValues = [92, 90, 87, 84, 80, 75, 70, 65, 60, 55, 50, 45];
const carbonLabels = ['06-20', '06-21', '06-22', '06-23', '06-24', '06-25', '06-26'];
const carbonValues = [9.6, 10.2, 8.7, 11.3, 9.9, 12.1, 10.4];
// Recent alerts mock data
const recentAlerts = reactive([
    {
        id: 1,
        type: 'warning',
        message: '站點 A01 電池電量不足',
        time: '2 分鐘前'
    },
    {
        id: 2,
        type: 'error',
        message: '車輛 BK001 GPS 信號異常',
        time: '5 分鐘前'
    },
    {
        id: 3,
        type: 'info',
        message: '系統維護已完成',
        time: '15 分鐘前'
    }
]);
// System status mock data
const systemStatus = reactive([
    {
        name: 'API 服務',
        description: '資料處理與同步',
        status: 'healthy'
    },
    {
        name: 'GPS 追蹤',
        description: '車輛位置監控',
        status: 'healthy'
    },
    {
        name: '電池監測',
        description: '電池狀態監控',
        status: 'warning'
    },
    {
        name: '資料庫',
        description: '資料儲存服務',
        status: 'healthy'
    }
]);
// Methods
const refreshData = async () => {
    isLoading.value = true;
    socLoading.value = true;
    carbonLoading.value = true;
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    isLoading.value = false;
    socLoading.value = false;
    carbonLoading.value = false;
};
const updateData = () => {
    // Update data based on selected period
    console.log('更新資料期間:', selectedPeriod.value);
    // In real app, fetch data from API based on period
};
// Helper methods for status indicators
const getAlertIcon = (type) => {
    const icons = {
        warning: 'i-ph:warning',
        error: 'i-ph:x-circle',
        info: 'i-ph:info'
    };
    return icons[type] || 'i-ph:info';
};
const getAlertIconClass = (type) => {
    const classes = {
        warning: 'p-2 rounded-lg bg-yellow-100 text-yellow-600',
        error: 'p-2 rounded-lg bg-red-100 text-red-600',
        info: 'p-2 rounded-lg bg-blue-100 text-blue-600'
    };
    return classes[type] || classes.info;
};
const getStatusIcon = (status) => {
    const icons = {
        healthy: 'i-ph:check-circle',
        warning: 'i-ph:warning',
        error: 'i-ph:x-circle'
    };
    return icons[status] || 'i-ph:check-circle';
};
const getStatusIconClass = (status) => {
    const classes = {
        healthy: 'p-2 rounded-lg bg-green-100 text-green-600',
        warning: 'p-2 rounded-lg bg-yellow-100 text-yellow-600',
        error: 'p-2 rounded-lg bg-red-100 text-red-600'
    };
    return classes[status] || classes.healthy;
};
const getStatusBadgeClass = (status) => {
    const classes = {
        healthy: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-red-100 text-red-800'
    };
    return classes[status] || classes.healthy;
};
const getStatusText = (status) => {
    const texts = {
        healthy: '正常',
        warning: '警告',
        error: '異常'
    };
    return texts[status] || '正常';
};
onMounted(() => {
    // Initial data load
    updateData();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-3xl font-bold text-gray-900" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-gray-600 mt-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    ...{ onChange: (__VLS_ctx.updateData) },
    value: (__VLS_ctx.selectedPeriod),
    ...{ class: "input-base w-32" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "today",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "week",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "month",
});
const __VLS_0 = {}.Button;
/** @type {[typeof __VLS_components.Button, typeof __VLS_components.Button, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    variant: "primary",
    disabled: (__VLS_ctx.isLoading),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    variant: "primary",
    disabled: (__VLS_ctx.isLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (__VLS_ctx.refreshData)
};
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
    ...{ class: "i-ph:arrow-clockwise" },
    ...{ class: "w-4 h-4" },
});
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6" },
});
const __VLS_8 = {}.KpiCard;
/** @type {[typeof __VLS_components.KpiCard, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    title: "上線車輛",
    value: (__VLS_ctx.summary.online),
    unit: "台",
    change: (5.2),
    trend: "up",
    period: "昨日",
    icon: "i-ph:bicycle",
    color: "green",
}));
const __VLS_10 = __VLS_9({
    title: "上線車輛",
    value: (__VLS_ctx.summary.online),
    unit: "台",
    change: (5.2),
    trend: "up",
    period: "昨日",
    icon: "i-ph:bicycle",
    color: "green",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
const __VLS_12 = {}.KpiCard;
/** @type {[typeof __VLS_components.KpiCard, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    title: "離線車輛",
    value: (__VLS_ctx.summary.offline),
    unit: "台",
    change: (-2.1),
    trend: "down",
    period: "昨日",
    icon: "i-ph:warning-circle",
    color: "red",
}));
const __VLS_14 = __VLS_13({
    title: "離線車輛",
    value: (__VLS_ctx.summary.offline),
    unit: "台",
    change: (-2.1),
    trend: "down",
    period: "昨日",
    icon: "i-ph:warning-circle",
    color: "red",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
const __VLS_16 = {}.KpiCard;
/** @type {[typeof __VLS_components.KpiCard, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    title: "今日總里程",
    value: (__VLS_ctx.summary.distance),
    unit: "公里",
    change: (12.8),
    trend: "up",
    period: "昨日",
    icon: "i-ph:map-pin",
    color: "blue",
    format: "number",
    precision: (1),
}));
const __VLS_18 = __VLS_17({
    title: "今日總里程",
    value: (__VLS_ctx.summary.distance),
    unit: "公里",
    change: (12.8),
    trend: "up",
    period: "昨日",
    icon: "i-ph:map-pin",
    color: "blue",
    format: "number",
    precision: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const __VLS_20 = {}.KpiCard;
/** @type {[typeof __VLS_components.KpiCard, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    title: "減碳效益",
    value: (__VLS_ctx.summary.carbon),
    unit: "kg CO₂",
    change: (8.5),
    trend: "up",
    period: "昨日",
    icon: "i-ph:leaf",
    color: "green",
    format: "number",
    precision: (1),
}));
const __VLS_22 = __VLS_21({
    title: "減碳效益",
    value: (__VLS_ctx.summary.carbon),
    unit: "kg CO₂",
    change: (8.5),
    trend: "up",
    period: "昨日",
    icon: "i-ph:leaf",
    color: "green",
    format: "number",
    precision: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 xl:grid-cols-3 gap-6" },
});
const __VLS_24 = {}.Card;
/** @type {[typeof __VLS_components.Card, typeof __VLS_components.Card, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    ...{ class: "xl:col-span-2" },
    padding: "md",
}));
const __VLS_26 = __VLS_25({
    ...{ class: "xl:col-span-2" },
    padding: "md",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_27.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-between" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-semibold text-gray-900" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "w-3 h-3 bg-blue-500 rounded-full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm text-gray-600" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "h-80" },
});
if (!__VLS_ctx.socLoading) {
    /** @type {[typeof SocTrend, ]} */ ;
    // @ts-ignore
    const __VLS_28 = __VLS_asFunctionalComponent(SocTrend, new SocTrend({
        labels: (__VLS_ctx.socLabels),
        values: (__VLS_ctx.socValues),
        ...{ class: "w-full h-full" },
    }));
    const __VLS_29 = __VLS_28({
        labels: (__VLS_ctx.socLabels),
        values: (__VLS_ctx.socValues),
        ...{ class: "w-full h-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_28));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-center h-full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" },
    });
}
var __VLS_27;
const __VLS_31 = {}.Card;
/** @type {[typeof __VLS_components.Card, typeof __VLS_components.Card, ]} */ ;
// @ts-ignore
const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
    padding: "md",
}));
const __VLS_33 = __VLS_32({
    padding: "md",
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
__VLS_34.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_34.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-semibold text-gray-900" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "h-80" },
});
if (!__VLS_ctx.carbonLoading) {
    /** @type {[typeof CarbonBar, ]} */ ;
    // @ts-ignore
    const __VLS_35 = __VLS_asFunctionalComponent(CarbonBar, new CarbonBar({
        labels: (__VLS_ctx.carbonLabels),
        values: (__VLS_ctx.carbonValues),
        ...{ class: "w-full h-full" },
    }));
    const __VLS_36 = __VLS_35({
        labels: (__VLS_ctx.carbonLabels),
        values: (__VLS_ctx.carbonValues),
        ...{ class: "w-full h-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_35));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-center h-full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" },
    });
}
var __VLS_34;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 xl:grid-cols-2 gap-6" },
});
const __VLS_38 = {}.Card;
/** @type {[typeof __VLS_components.Card, typeof __VLS_components.Card, ]} */ ;
// @ts-ignore
const __VLS_39 = __VLS_asFunctionalComponent(__VLS_38, new __VLS_38({
    padding: "md",
}));
const __VLS_40 = __VLS_39({
    padding: "md",
}, ...__VLS_functionalComponentArgsRest(__VLS_39));
__VLS_41.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_41.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-between" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-semibold text-gray-900" },
    });
    const __VLS_42 = {}.Button;
    /** @type {[typeof __VLS_components.Button, typeof __VLS_components.Button, ]} */ ;
    // @ts-ignore
    const __VLS_43 = __VLS_asFunctionalComponent(__VLS_42, new __VLS_42({
        variant: "ghost",
        size: "sm",
    }));
    const __VLS_44 = __VLS_43({
        variant: "ghost",
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_43));
    __VLS_45.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "i-ph:arrow-right" },
        ...{ class: "w-4 h-4" },
    });
    var __VLS_45;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-3" },
});
for (const [alert] of __VLS_getVForSourceType((__VLS_ctx.recentAlerts))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (alert.id),
        ...{ class: "flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors duration-200" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: (__VLS_ctx.getAlertIconClass(alert.type)) },
    });
    const __VLS_46 = ((__VLS_ctx.getAlertIcon(alert.type)));
    // @ts-ignore
    const __VLS_47 = __VLS_asFunctionalComponent(__VLS_46, new __VLS_46({
        ...{ class: "w-4 h-4" },
    }));
    const __VLS_48 = __VLS_47({
        ...{ class: "w-4 h-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_47));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-1 min-w-0" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm font-medium text-gray-900" },
    });
    (alert.message);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-xs text-gray-500 mt-1" },
    });
    (alert.time);
}
if (__VLS_ctx.recentAlerts.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "py-8" },
    });
    const __VLS_50 = {}.EmptyState;
    /** @type {[typeof __VLS_components.EmptyState, ]} */ ;
    // @ts-ignore
    const __VLS_51 = __VLS_asFunctionalComponent(__VLS_50, new __VLS_50({
        title: "目前沒有警報",
        description: "系統運作正常，沒有需要注意的警報",
        icon: "i-ph:check-circle",
        variant: "default",
    }));
    const __VLS_52 = __VLS_51({
        title: "目前沒有警報",
        description: "系統運作正常，沒有需要注意的警報",
        icon: "i-ph:check-circle",
        variant: "default",
    }, ...__VLS_functionalComponentArgsRest(__VLS_51));
}
var __VLS_41;
const __VLS_54 = {}.Card;
/** @type {[typeof __VLS_components.Card, typeof __VLS_components.Card, ]} */ ;
// @ts-ignore
const __VLS_55 = __VLS_asFunctionalComponent(__VLS_54, new __VLS_54({
    padding: "md",
}));
const __VLS_56 = __VLS_55({
    padding: "md",
}, ...__VLS_functionalComponentArgsRest(__VLS_55));
__VLS_57.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_57.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-semibold text-gray-900" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-4" },
});
for (const [status] of __VLS_getVForSourceType((__VLS_ctx.systemStatus))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (status.name),
        ...{ class: "flex items-center justify-between p-3 rounded-lg bg-gray-50" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: (__VLS_ctx.getStatusIconClass(status.status)) },
    });
    const __VLS_58 = ((__VLS_ctx.getStatusIcon(status.status)));
    // @ts-ignore
    const __VLS_59 = __VLS_asFunctionalComponent(__VLS_58, new __VLS_58({
        ...{ class: "w-4 h-4" },
    }));
    const __VLS_60 = __VLS_59({
        ...{ class: "w-4 h-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_59));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm font-medium text-gray-900" },
    });
    (status.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-xs text-gray-500" },
    });
    (status.description);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: (__VLS_ctx.getStatusBadgeClass(status.status)) },
        ...{ class: "px-2 py-1 text-xs font-medium rounded-full" },
    });
    (__VLS_ctx.getStatusText(status.status));
}
var __VLS_57;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['input-base']} */ ;
/** @type {__VLS_StyleScopedClasses['w-32']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph:arrow-clockwise']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['h-80']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-brand-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['h-80']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-brand-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph:arrow-right']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Button: Button,
            Card: Card,
            KpiCard: KpiCard,
            EmptyState: EmptyState,
            SocTrend: SocTrend,
            CarbonBar: CarbonBar,
            selectedPeriod: selectedPeriod,
            isLoading: isLoading,
            socLoading: socLoading,
            carbonLoading: carbonLoading,
            summary: summary,
            socLabels: socLabels,
            socValues: socValues,
            carbonLabels: carbonLabels,
            carbonValues: carbonValues,
            recentAlerts: recentAlerts,
            systemStatus: systemStatus,
            refreshData: refreshData,
            updateData: updateData,
            getAlertIcon: getAlertIcon,
            getAlertIconClass: getAlertIconClass,
            getStatusIcon: getStatusIcon,
            getStatusIconClass: getStatusIconClass,
            getStatusBadgeClass: getStatusBadgeClass,
            getStatusText: getStatusText,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
