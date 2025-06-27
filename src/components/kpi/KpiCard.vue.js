import { computed } from 'vue';
const props = defineProps();
/* 允許父層不傳時有預設值 */
const gradientClasses = computed(() => { var _a; return ((_a = props.gradient) !== null && _a !== void 0 ? _a : 'from-indigo-400 from-opacity-90 to-indigo-600').split(' '); });
const glowClasses = computed(() => { var _a; return ((_a = props.glow) !== null && _a !== void 0 ? _a : 'bg-indigo-400 bg-opacity-30').split(' '); });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: ([
            /* 外框 ― 玻璃卡 + 霓虹柔光 ----------------------------------- */
            'relative rounded-2xl p-5 flex items-center gap-4 shadow',
            __VLS_ctx.glowClasses, /* e.g. bg-emerald-400 bg-opacity-30 */
            'before:absolute before:inset-0 before:-z-10 before:rounded-2xl',
            'before:bg-gradient-to-br', /* 霓虹漸層 ↓ */
            __VLS_ctx.gradientClasses /* e.g. from-emerald-400 from-opacity-90 to-emerald-600 */
        ]) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid place-content-center h-12 w-12 rounded-lg text-white bg-primary-500/80" },
});
const __VLS_0 = ((__VLS_ctx.icon));
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "h-6 w-6" },
}));
const __VLS_2 = __VLS_1({
    ...{ class: "h-6 w-6" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-sm text-gray-400" },
});
(__VLS_ctx.label);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-2xl font-bold leading-tight" },
});
(__VLS_ctx.value);
if (__VLS_ctx.unit) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-base font-medium text-gray-400" },
    });
    (__VLS_ctx.unit);
}
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow']} */ ;
/** @type {__VLS_StyleScopedClasses['before:absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['before:inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['before:-z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['before:rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['before:bg-gradient-to-br']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['place-content-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-12']} */ ;
/** @type {__VLS_StyleScopedClasses['w-12']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary-500/80']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['leading-tight']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            gradientClasses: gradientClasses,
            glowClasses: glowClasses,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
