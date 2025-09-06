import { computed } from 'vue';
const props = defineProps();
/* 預設漸層（indigo 系）與柔光 */
const gradientClasses = computed(() => { var _a; return ((_a = props.gradient) !== null && _a !== void 0 ? _a : 'from-indigo-400/90 to-indigo-600').split(' '); });
const glowClasses = computed(() => { var _a; return ((_a = props.glow) !== null && _a !== void 0 ? _a : 'bg-indigo-400/30').split(' '); });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: ([
            /* ── 外框：玻璃卡 + 霓虹柔光 ─────────────────────────────── */
            'relative rounded-2xl p-6 flex items-center gap-5 shadow',
            __VLS_ctx.glowClasses, /* 霓虹柔光背景（淡色）   */
            'before:absolute before:inset-0 before:-z-10 before:rounded-2xl',
            'before:bg-gradient-to-br', /* 霓虹漸層 ↓            */
            __VLS_ctx.gradientClasses /* 主要漸層（亮色→深色） */
        ]) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid place-content-center h-14 w-14 rounded-lg bg-white/20" },
});
const __VLS_0 = ((__VLS_ctx.icon));
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "h-7 w-7 text-white" },
}));
const __VLS_2 = __VLS_1({
    ...{ class: "h-7 w-7 text-white" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col leading-snug" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-base font-medium text-gray-700" },
});
(__VLS_ctx.label);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-3xl font-extrabold text-gray-900" },
});
(__VLS_ctx.value);
if (__VLS_ctx.unit) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "ml-1 text-lg font-semibold text-gray-600" },
    });
    (__VLS_ctx.unit);
}
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow']} */ ;
/** @type {__VLS_StyleScopedClasses['before:absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['before:inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['before:-z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['before:rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['before:bg-gradient-to-br']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['place-content-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-14']} */ ;
/** @type {__VLS_StyleScopedClasses['w-14']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white/20']} */ ;
/** @type {__VLS_StyleScopedClasses['h-7']} */ ;
/** @type {__VLS_StyleScopedClasses['w-7']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['leading-snug']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
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
