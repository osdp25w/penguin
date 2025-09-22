var _a, _b, _c;
import { onMounted, computed } from 'vue';
import { useBatteries, useML } from '@/stores';
/* ───────────── 取資料 ───────────── */
const batStore = useBatteries();
const mlStore = useML();
onMounted(async () => {
    await batStore.fetchAll();
    await mlStore.fetchBatteryRisk([], batStore.items);
});
/**
 * 將故障機率 (faultP) 併入電池清單
 * ▲ 依「同索引」對應，只是 demo 需求，正式專案應以 id 對映
 */
const rows = computed(() => batStore.items.map((b, i) => {
    var _a, _b;
    return ({
        ...b,
        faultP: (_b = (_a = mlStore.batteries[i]) === null || _a === void 0 ? void 0 : _a.faultP) !== null && _b !== void 0 ? _b : 0
    });
}));
/* ───────────── 長條圖 ───────────── */
import { use } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
use([BarChart, GridComponent, TooltipComponent, TitleComponent, CanvasRenderer]);
const chartOption = computed(() => ({
    tooltip: { trigger: 'axis' },
    xAxis: {
        type: 'category',
        data: rows.value.map(r => `車 ${r.vehicleId}`),
        axisLabel: { rotate: 35 }
    },
    yAxis: { min: 0, max: 100, name: '%', splitLine: { show: false } },
    series: [
        {
            type: 'bar',
            data: rows.value.map(r => { var _a; return (_a = r.health) !== null && _a !== void 0 ? _a : 0; }),
            barWidth: '60%',
            itemStyle: { borderRadius: [4, 4, 0, 0], color: '#4ade80' }
        }
    ],
    textStyle: { color: '#d1d5db', fontFamily: 'Inter' },
    backgroundColor: 'transparent'
}));
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "flex items-center justify-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-2xl font-bold" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (async () => { await __VLS_ctx.batStore.fetchAll(); await __VLS_ctx.mlStore.fetchBatteryRisk([], __VLS_ctx.batStore.items); }) },
    ...{ class: "btn i-ph-arrow-clockwise text-sm" },
    disabled: (__VLS_ctx.batStore.isLoading || __VLS_ctx.mlStore.loading),
});
if (__VLS_ctx.rows.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "overflow-x-auto" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
        ...{ class: "min-w-full text-sm" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({
        ...{ class: "bg-gray-700 text-gray-200" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ class: "px-3 py-2 text-left" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ class: "px-3 py-2 text-right" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ class: "px-3 py-2 text-right" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
    for (const [r] of __VLS_getVForSourceType((__VLS_ctx.rows))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
            key: (r.id),
            ...{ class: "border-b border-gray-700" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-3 py-2" },
        });
        (r.vehicleId);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-3 py-2 text-right" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ([
                    ((_a = r.health) !== null && _a !== void 0 ? _a : 0) >= 80
                        ? 'text-green-400'
                        : ((_b = r.health) !== null && _b !== void 0 ? _b : 0) >= 60
                            ? 'text-yellow-400'
                            : 'text-rose-400'
                ]) },
        });
        ((_c = r.health) !== null && _c !== void 0 ? _c : 0);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-3 py-2 text-right" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ([
                    r.faultP > 0.3
                        ? 'text-rose-400'
                        : r.faultP > 0.15
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                ]) },
        });
        ((r.faultP * 100).toFixed(0));
    }
}
if (__VLS_ctx.rows.length) {
    const __VLS_0 = {}.VChart;
    /** @type {[typeof __VLS_components.VChart, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        option: (__VLS_ctx.chartOption),
        autoresize: true,
        ...{ class: "h-72 w-full" },
    }));
    const __VLS_2 = __VLS_1({
        option: (__VLS_ctx.chartOption),
        autoresize: true,
        ...{ class: "h-72 w-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
}
if (__VLS_ctx.batStore.isLoading || __VLS_ctx.mlStore.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-gray-600" },
    });
}
if (__VLS_ctx.batStore.errMsg || __VLS_ctx.mlStore.errMsg) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-rose-400" },
    });
    (__VLS_ctx.batStore.errMsg || __VLS_ctx.mlStore.errMsg);
}
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-arrow-clockwise']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['h-72']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-rose-400']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            batStore: batStore,
            mlStore: mlStore,
            rows: rows,
            VChart: VChart,
            chartOption: chartOption,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
