import { reactive, ref, onMounted } from 'vue';
import { Button, Card, KpiCard } from '@/design/components';
import SocTrend from '@/components/charts/SocTrend.vue';
import CarbonBar from '@/components/charts/CarbonBar.vue';
// Reactive data
const startDate = ref(getDefaultStartDate());
const endDate = ref(getDefaultEndDate());
const isLoading = ref(false);
const socLoading = ref(false);
const carbonLoading = ref(false);
// Helper functions for default dates
function getDefaultStartDate() {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    return lastWeek.toISOString().split('T')[0];
}
function getDefaultEndDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}
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
    // Update data based on selected date range
    console.log('更新資料日期範圍:', {
        startDate: startDate.value,
        endDate: endDate.value
    });
    // Validate date range
    if (startDate.value && endDate.value) {
        const start = new Date(startDate.value);
        const end = new Date(endDate.value);
        if (start > end) {
            alert('起始日期不能晚於結束日期');
            return;
        }
        // Calculate days difference
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        console.log('日期範圍天數:', diffDays);
        // In real app, fetch data from API based on date range
        // Example API call: fetchData({ startDate: startDate.value, endDate: endDate.value })
    }
};
const exportData = () => {
    // Validate date range before export
    if (!startDate.value || !endDate.value) {
        alert('請選擇完整的日期範圍');
        return;
    }
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    if (start > end) {
        alert('起始日期不能晚於結束日期');
        return;
    }
    // Prepare export data
    const exportData = {
        dateRange: {
            startDate: startDate.value,
            endDate: endDate.value
        },
        kpi: {
            onlineVehicles: summary.online,
            offlineVehicles: summary.offline,
            totalDistance: summary.distance,
            carbonSaved: summary.carbon
        },
        chartData: {
            socTrend: {
                labels: socLabels,
                values: socValues
            },
            carbonReduction: {
                labels: carbonLabels,
                values: carbonValues
            }
        },
        exportTime: new Date().toISOString(),
        exportedBy: 'system'
    };
    // Create and download CSV file
    const csvContent = generateCSVContent(exportData);
    downloadCSV(csvContent, `system-overview-${startDate.value}-to-${endDate.value}.csv`);
    console.log('匯出資料:', exportData);
};
const generateCSVContent = (data) => {
    const lines = [];
    // Header
    lines.push('系統總覽報表');
    lines.push(`匯出時間：${new Date(data.exportTime).toLocaleString('zh-TW')}`);
    lines.push(`日期範圍：${data.dateRange.startDate} 至 ${data.dateRange.endDate}`);
    lines.push('');
    // KPI Data
    lines.push('KPI 指標');
    lines.push('指標名稱,數值,單位');
    lines.push(`上線車輛,${data.kpi.onlineVehicles},台`);
    lines.push(`離線車輛,${data.kpi.offlineVehicles},台`);
    lines.push(`今日總里程,${data.kpi.totalDistance},公里`);
    lines.push(`減碳效益,${data.kpi.carbonSaved},kg CO₂`);
    lines.push('');
    // SoC Trend Data
    lines.push('電池狀態趨勢');
    lines.push('時間,平均 SoC (%)');
    data.chartData.socTrend.labels.forEach((label, index) => {
        lines.push(`${label},${data.chartData.socTrend.values[index]}`);
    });
    lines.push('');
    // Carbon Reduction Data
    lines.push('減碳量統計');
    lines.push('日期,減碳量 (kg CO₂)');
    data.chartData.carbonReduction.labels.forEach((label, index) => {
        lines.push(`${label},${data.chartData.carbonReduction.values[index]}`);
    });
    return lines.join('\n');
};
const downloadCSV = (content, filename) => {
    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};
// Cleanup: Removed unused helper methods for disabled alert and status sections
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "text-sm font-medium text-gray-700" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (__VLS_ctx.updateData) },
    type: "date",
    ...{ class: "input-base w-36" },
});
(__VLS_ctx.startDate);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "text-sm font-medium text-gray-700" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (__VLS_ctx.updateData) },
    type: "date",
    ...{ class: "input-base w-36" },
});
(__VLS_ctx.endDate);
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.i)({
    ...{ class: "i-ph-arrow-clockwise w-4 h-4" },
});
var __VLS_3;
const __VLS_8 = {}.Button;
/** @type {[typeof __VLS_components.Button, typeof __VLS_components.Button, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    variant: "ghost",
    disabled: (__VLS_ctx.isLoading),
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    variant: "ghost",
    disabled: (__VLS_ctx.isLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onClick: (__VLS_ctx.exportData)
};
__VLS_11.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.i)({
    ...{ class: "i-ph-download w-4 h-4" },
});
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6" },
});
const __VLS_16 = {}.KpiCard;
/** @type {[typeof __VLS_components.KpiCard, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    title: "上線車輛",
    value: (__VLS_ctx.summary.online),
    unit: "台",
    change: (5.2),
    trend: "up",
    period: "昨日",
    icon: "i-ph-bicycle",
    color: "green",
}));
const __VLS_18 = __VLS_17({
    title: "上線車輛",
    value: (__VLS_ctx.summary.online),
    unit: "台",
    change: (5.2),
    trend: "up",
    period: "昨日",
    icon: "i-ph-bicycle",
    color: "green",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const __VLS_20 = {}.KpiCard;
/** @type {[typeof __VLS_components.KpiCard, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    title: "離線車輛",
    value: (__VLS_ctx.summary.offline),
    unit: "台",
    change: (-2.1),
    trend: "down",
    period: "昨日",
    icon: "i-ph-warning-circle",
    color: "red",
}));
const __VLS_22 = __VLS_21({
    title: "離線車輛",
    value: (__VLS_ctx.summary.offline),
    unit: "台",
    change: (-2.1),
    trend: "down",
    period: "昨日",
    icon: "i-ph-warning-circle",
    color: "red",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
const __VLS_24 = {}.KpiCard;
/** @type {[typeof __VLS_components.KpiCard, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    title: "今日總里程",
    value: (__VLS_ctx.summary.distance),
    unit: "公里",
    change: (12.8),
    trend: "up",
    period: "昨日",
    icon: "i-ph-map-pin",
    color: "blue",
    format: "number",
    precision: (1),
}));
const __VLS_26 = __VLS_25({
    title: "今日總里程",
    value: (__VLS_ctx.summary.distance),
    unit: "公里",
    change: (12.8),
    trend: "up",
    period: "昨日",
    icon: "i-ph-map-pin",
    color: "blue",
    format: "number",
    precision: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
const __VLS_28 = {}.KpiCard;
/** @type {[typeof __VLS_components.KpiCard, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    title: "減碳效益",
    value: (__VLS_ctx.summary.carbon),
    unit: "kg CO₂",
    change: (8.5),
    trend: "up",
    period: "昨日",
    icon: "i-ph-tree",
    color: "green",
    format: "number",
    precision: (1),
}));
const __VLS_30 = __VLS_29({
    title: "減碳效益",
    value: (__VLS_ctx.summary.carbon),
    unit: "kg CO₂",
    change: (8.5),
    trend: "up",
    period: "昨日",
    icon: "i-ph-tree",
    color: "green",
    format: "number",
    precision: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 xl:grid-cols-3 gap-6" },
});
const __VLS_32 = {}.Card;
/** @type {[typeof __VLS_components.Card, typeof __VLS_components.Card, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    ...{ class: "xl:col-span-2" },
    padding: "md",
}));
const __VLS_34 = __VLS_33({
    ...{ class: "xl:col-span-2" },
    padding: "md",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_35.slots;
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
    const __VLS_36 = __VLS_asFunctionalComponent(SocTrend, new SocTrend({
        labels: (__VLS_ctx.socLabels),
        values: (__VLS_ctx.socValues),
        ...{ class: "w-full h-full" },
    }));
    const __VLS_37 = __VLS_36({
        labels: (__VLS_ctx.socLabels),
        values: (__VLS_ctx.socValues),
        ...{ class: "w-full h-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-center h-full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" },
    });
}
var __VLS_35;
const __VLS_39 = {}.Card;
/** @type {[typeof __VLS_components.Card, typeof __VLS_components.Card, ]} */ ;
// @ts-ignore
const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
    padding: "md",
}));
const __VLS_41 = __VLS_40({
    padding: "md",
}, ...__VLS_functionalComponentArgsRest(__VLS_40));
__VLS_42.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_42.slots;
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
    const __VLS_43 = __VLS_asFunctionalComponent(CarbonBar, new CarbonBar({
        labels: (__VLS_ctx.carbonLabels),
        values: (__VLS_ctx.carbonValues),
        ...{ class: "w-full h-full" },
    }));
    const __VLS_44 = __VLS_43({
        labels: (__VLS_ctx.carbonLabels),
        values: (__VLS_ctx.carbonValues),
        ...{ class: "w-full h-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_43));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-center h-full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" },
    });
}
var __VLS_42;
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
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['input-base']} */ ;
/** @type {__VLS_StyleScopedClasses['w-36']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['input-base']} */ ;
/** @type {__VLS_StyleScopedClasses['w-36']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-arrow-clockwise']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-download']} */ ;
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
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Button: Button,
            Card: Card,
            KpiCard: KpiCard,
            SocTrend: SocTrend,
            CarbonBar: CarbonBar,
            startDate: startDate,
            endDate: endDate,
            isLoading: isLoading,
            socLoading: socLoading,
            carbonLoading: carbonLoading,
            summary: summary,
            socLabels: socLabels,
            socValues: socValues,
            carbonLabels: carbonLabels,
            carbonValues: carbonValues,
            refreshData: refreshData,
            updateData: updateData,
            exportData: exportData,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
