import { computed } from 'vue';
import VChart from 'vue-echarts';
/* 註冊 ECharts 元件 */
import { use } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);
const props = withDefaults(defineProps(), { labels: () => [], values: () => [], loading: false, granularity: 'day' });
const option = computed(() => {
    const granularityLabels = {
        hour: '小時',
        day: '日',
        month: '月',
        year: '年'
    };
    const xAxisConfig = {
        type: 'category',
        data: props.labels,
        axisLabel: {
            color: '#a1a1aa',
            rotate: props.granularity === 'hour' ? 0 : 45,
            formatter: (value) => {
                if (props.granularity === 'day' && value.includes('-')) {
                    return value.split('-').slice(1).join('/');
                }
                return value;
            }
        }
    };
    return {
        tooltip: {
            trigger: 'axis',
            formatter: (params) => {
                const param = params[0];
                const unit = props.granularity === 'hour' ? '小時' : '日';
                return `${param.axisValue}<br/>減碳量: ${param.data} kg CO₂`;
            }
        },
        xAxis: xAxisConfig,
        yAxis: {
            name: 'kg CO₂',
            nameTextStyle: { color: '#a1a1aa' },
            splitLine: { show: false },
            axisLabel: { color: '#a1a1aa' }
        },
        series: [{
                type: 'bar',
                data: props.values,
                barWidth: props.values.length > 15 ? '80%' : '60%',
                itemStyle: {
                    color: '#4ade80',
                    borderRadius: [4, 4, 0, 0]
                }
            }],
        grid: { top: 30, bottom: 50, left: 60, right: 20 },
        backgroundColor: 'transparent',
        textStyle: { color: '#e5e7eb', fontFamily: 'Inter' }
    };
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({ labels: () => [], values: () => [], loading: false, granularity: 'day' });
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
