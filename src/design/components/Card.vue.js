import { computed } from 'vue';
const props = withDefaults(defineProps(), {
    variant: 'default',
    padding: 'md',
    hover: false,
});
const cardClasses = computed(() => {
    const baseClasses = ['rounded-xl', 'transition-shadow', 'duration-200'];
    const variantClasses = {
        default: ['bg-white', 'shadow-base', 'border', 'border-gray-200'],
        elevated: ['bg-white', 'shadow-lg'],
        outlined: ['bg-white', 'border-2', 'border-gray-200'],
    };
    const paddingClasses = {
        none: [],
        sm: ['p-4'],
        md: ['p-6'],
        lg: ['p-8'],
    };
    const hoverClasses = props.hover ? ['hover:shadow-lg', 'cursor-pointer'] : [];
    return [
        ...baseClasses,
        ...variantClasses[props.variant],
        ...paddingClasses[props.padding],
        ...hoverClasses,
    ].join(' ');
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    variant: 'default',
    padding: 'md',
    hover: false,
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['card-content']} */ ;
/** @type {__VLS_StyleScopedClasses['card-content']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-content']} */ ;
/** @type {__VLS_StyleScopedClasses['card-content']} */ ;
/** @type {__VLS_StyleScopedClasses['card-footer']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: (__VLS_ctx.cardClasses) },
});
if (__VLS_ctx.$slots.header) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
        ...{ class: "card-header" },
    });
    var __VLS_0 = {};
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "card-content" },
});
var __VLS_2 = {};
if (__VLS_ctx.$slots.footer) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({
        ...{ class: "card-footer" },
    });
    var __VLS_4 = {};
}
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-content']} */ ;
/** @type {__VLS_StyleScopedClasses['card-footer']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0, __VLS_3 = __VLS_2, __VLS_5 = __VLS_4;
[__VLS_dollars.$attrs,];
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            cardClasses: cardClasses,
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
