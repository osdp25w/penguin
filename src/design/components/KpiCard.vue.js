import { computed } from 'vue';
import Card from './Card.vue';
const props = withDefaults(defineProps(), {
    unit: '',
    period: '上月',
    trend: 'neutral',
    color: 'blue',
    hover: false,
    format: 'number',
    precision: 0,
});
const formattedValue = computed(() => {
    if (typeof props.value === 'string')
        return props.value;
    const num = props.value;
    switch (props.format) {
        case 'currency':
            return new Intl.NumberFormat('zh-TW', {
                style: 'currency',
                currency: 'TWD',
                minimumFractionDigits: props.precision,
                maximumFractionDigits: props.precision,
            }).format(num);
        case 'percentage':
            return `${num.toFixed(props.precision)}%`;
        case 'number':
        default:
            if (num >= 1000000) {
                return `${(num / 1000000).toFixed(1)}M`;
            }
            else if (num >= 1000) {
                return `${(num / 1000).toFixed(1)}K`;
            }
            return num.toLocaleString('zh-TW', {
                minimumFractionDigits: props.precision,
                maximumFractionDigits: props.precision,
            });
    }
});
const cardClass = computed(() => {
    const colorClasses = {
        blue: 'border-l-4 border-l-blue-500',
        green: 'border-l-4 border-l-green-500',
        red: 'border-l-4 border-l-red-500',
        yellow: 'border-l-4 border-l-yellow-500',
        purple: 'border-l-4 border-l-purple-500',
    };
    return colorClasses[props.color];
});
const iconClass = computed(() => {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-100',
        green: 'text-green-600 bg-green-100',
        red: 'text-red-600 bg-red-100',
        yellow: 'text-yellow-600 bg-yellow-100',
        purple: 'text-purple-600 bg-purple-100',
    };
    return `p-2 rounded-lg ${colorClasses[props.color]}`;
});
const changeIcon = computed(() => {
    if (props.change === undefined)
        return null;
    if (props.change > 0) {
        return props.trend === 'down' ? 'i-ph-trend-down' : 'i-ph-trend-up';
    }
    else if (props.change < 0) {
        return props.trend === 'up' ? 'i-ph-trend-up' : 'i-ph-trend-down';
    }
    return 'i-ph-minus';
});
const changeIconClass = computed(() => {
    if (props.change === undefined)
        return '';
    if (props.change > 0) {
        return props.trend === 'down' ? 'text-red-500' : 'text-green-500';
    }
    else if (props.change < 0) {
        return props.trend === 'up' ? 'text-green-500' : 'text-red-500';
    }
    return 'text-gray-700';
});
const changeTextClass = computed(() => {
    if (props.change === undefined)
        return '';
    if (props.change > 0) {
        return props.trend === 'down' ? 'text-red-600' : 'text-green-600';
    }
    else if (props.change < 0) {
        return props.trend === 'up' ? 'text-green-600' : 'text-red-600';
    }
    return 'text-gray-600';
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    unit: '',
    period: '上月',
    trend: 'neutral',
    color: 'blue',
    hover: false,
    format: 'number',
    precision: 0,
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {[typeof Card, typeof Card, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(Card, new Card({
    variant: "default",
    padding: "md",
    hover: (__VLS_ctx.hover),
    ...{ class: (__VLS_ctx.cardClass) },
}));
const __VLS_1 = __VLS_0({
    variant: "default",
    padding: "md",
    hover: (__VLS_ctx.hover),
    ...{ class: (__VLS_ctx.cardClass) },
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-start justify-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-2 mb-2" },
});
if (__VLS_ctx.icon) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: (__VLS_ctx.iconClass) },
    });
    const __VLS_4 = ((__VLS_ctx.icon));
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        ...{ class: "w-5 h-5" },
    }));
    const __VLS_6 = __VLS_5({
        ...{ class: "w-5 h-5" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "text-sm font-medium text-gray-600" },
});
(__VLS_ctx.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-2xl font-bold text-gray-900" },
});
(__VLS_ctx.formattedValue);
if (__VLS_ctx.change !== undefined) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-1" },
    });
    if (__VLS_ctx.changeIcon) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i)({
            ...{ class: ([__VLS_ctx.changeIcon, __VLS_ctx.changeIconClass, 'w-4 h-4']) },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: (__VLS_ctx.changeTextClass) },
        ...{ class: "text-sm font-medium" },
    });
    (Math.abs(__VLS_ctx.change));
    (__VLS_ctx.unit);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-gray-700 font-normal ml-1" },
    });
    (__VLS_ctx.period);
}
if (__VLS_ctx.$slots.chart) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "ml-4 flex-shrink-0" },
    });
    var __VLS_8 = {};
}
if (__VLS_ctx.$slots.footer) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-4 pt-4 border-t border-gray-200" },
    });
    var __VLS_10 = {};
}
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['font-normal']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
// @ts-ignore
var __VLS_9 = __VLS_8, __VLS_11 = __VLS_10;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Card: Card,
            formattedValue: formattedValue,
            cardClass: cardClass,
            iconClass: iconClass,
            changeIcon: changeIcon,
            changeIconClass: changeIconClass,
            changeTextClass: changeTextClass,
        };
    },
    __typeProps: {},
    props: {},
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    props: {},
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
