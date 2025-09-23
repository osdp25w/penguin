import { useToasts } from '@/stores/toasts';
const toasts = useToasts();
const kindClass = (k) => ({
    'border-blue-200': k === 'info',
    'border-emerald-200': k === 'success',
    'border-amber-300': k === 'warning',
    'border-rose-300': k === 'error',
});
const iconClass = (k) => (k === 'success' ? 'i-ph-check-circle text-emerald-600' :
    k === 'warning' ? 'i-ph-warning text-amber-600' :
        k === 'error' ? 'i-ph-x-circle text-rose-600' : 'i-ph-info text-blue-600');
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "fixed top-20 right-4 z-50 space-y-2 w-80 max-w-[90vw] select-none" },
});
const __VLS_0 = {}.TransitionGroup;
/** @type {[typeof __VLS_components.TransitionGroup, typeof __VLS_components.TransitionGroup, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    name: "toast",
    tag: "div",
}));
const __VLS_2 = __VLS_1({
    name: "toast",
    tag: "div",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
for (const [t] of __VLS_getVForSourceType((__VLS_ctx.toasts.items))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (t.id),
        ...{ class: "rounded-lg shadow-lg border p-3 flex items-start gap-3 text-sm bg-white" },
        ...{ class: (__VLS_ctx.kindClass(t.kind)) },
        ...{ 'data-testid': `toast-${t.kind}` },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: (__VLS_ctx.iconClass(t.kind)) },
        ...{ class: "w-5 h-5" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-1" },
    });
    if (t.title) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "font-medium mb-0.5" },
        });
        (t.title);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-gray-700 whitespace-pre-line" },
    });
    (t.message);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.toasts.remove(t.id);
            } },
        ...{ class: "opacity-60 hover:opacity-100" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "i-ph-x w-4 h-4" },
    });
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['top-20']} */ ;
/** @type {__VLS_StyleScopedClasses['right-4']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-80']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-[90vw]']} */ ;
/** @type {__VLS_StyleScopedClasses['select-none']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['whitespace-pre-line']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-60']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:opacity-100']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-x']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            toasts: toasts,
            kindClass: kindClass,
            iconClass: iconClass,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
