import { computed } from 'vue';
import VChart from 'vue-echarts';
/* 註冊 ECharts 元件 */
import { use } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);
const props = withDefaults(defineProps(), { labels: () => [], values: () => [], loading: false });
const option = computed(() => ({
    tooltip: { trigger: 'axis', formatter: (p) => `${p[0].axisValue}<br/>減碳 ${p[0].data} kg` },
    xAxis: { type: 'category', data: props.labels, axisLabel: { color: '#a1a1aa' } },
    yAxis: { name: 'kg', splitLine: { show: false }, axisLabel: { color: '#a1a1aa' } },
    series: [{
            type: 'bar', data: props.values, barWidth: '60%',
            itemStyle: { color: '#4ade80', borderRadius: [4, 4, 0, 0] }
        }],
    grid: { top: 20, bottom: 40, left: 50, right: 10 },
    backgroundColor: 'transparent',
    textStyle: { color: '#e5e7eb', fontFamily: 'Inter' }
}));
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({ labels: () => [], values: () => [], loading: false });
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "animate-pulse h-72 w-full rounded-xl bg-white/5" },
    });
}
else {
    const __VLS_0 = {}.VChart;
    /** @type {[typeof __VLS_components.VChart, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        option: (__VLS_ctx.option),
        autoresize: true,
        ...{ class: "h-72 w-full" },
    }));
    const __VLS_2 = __VLS_1({
        option: (__VLS_ctx.option),
        autoresize: true,
        ...{ class: "h-72 w-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_4 = {};
    var __VLS_3;
}
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['h-72']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-72']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VChart: VChart,
            option: option,
        };
    },
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
