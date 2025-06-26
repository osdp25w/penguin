import { reactive } from 'vue';
import KpiCard from '@/components/kpi/KpiCard.vue';
import { Bike, CircleOff, Map, Leaf } from 'lucide-vue-next';
/* 假資料 — 之後可接 pinia/msw */
const summary = reactive({
    online: 42,
    offline: 8,
    distance: 128,
    carbon: 9.6
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "fixed inset-0 -z-20 overflow-hidden bg-slate-950" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "absolute inset-0 bg-[url('/_data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 fill=%22white%22 opacity=%220.12%22><circle cx=%225%22 cy=%225%22 r=%221%22/><circle cx=%2250%22 cy=%2250%22 r=%221%22/><circle cx=%2295%22 cy=%2295%22 r=%221%22/></svg>')] bg-[length:200px_200px]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "absolute -top-1/3 -left-1/4 w-[180%] h-[180%] rotate-45 bg-gradient-to-tr from-indigo-600/5 via-fuchsia-600/10 to-teal-500/5" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "relative mx-auto max-w-screen-2xl px-10 py-10 space-y-10" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "grid grid-cols-4 gap-8 h-[20vh]" },
});
/** @type {[typeof KpiCard, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(KpiCard, new KpiCard({
    label: "上線車輛",
    value: (__VLS_ctx.summary.online),
    icon: (__VLS_ctx.Bike),
    gradient: "from-emerald-400/90 to-emerald-600",
    glow: "bg-emerald-400/40",
}));
const __VLS_1 = __VLS_0({
    label: "上線車輛",
    value: (__VLS_ctx.summary.online),
    icon: (__VLS_ctx.Bike),
    gradient: "from-emerald-400/90 to-emerald-600",
    glow: "bg-emerald-400/40",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
/** @type {[typeof KpiCard, ]} */ ;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent(KpiCard, new KpiCard({
    label: "離線車輛",
    value: (__VLS_ctx.summary.offline),
    icon: (__VLS_ctx.CircleOff),
    gradient: "from-rose-400/90 to-rose-600",
    glow: "bg-rose-400/40",
}));
const __VLS_4 = __VLS_3({
    label: "離線車輛",
    value: (__VLS_ctx.summary.offline),
    icon: (__VLS_ctx.CircleOff),
    gradient: "from-rose-400/90 to-rose-600",
    glow: "bg-rose-400/40",
}, ...__VLS_functionalComponentArgsRest(__VLS_3));
/** @type {[typeof KpiCard, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(KpiCard, new KpiCard({
    label: "今日總里程",
    value: (__VLS_ctx.summary.distance),
    unit: "km",
    icon: (Map),
    gradient: "from-indigo-400/90 to-indigo-600",
    glow: "bg-indigo-400/40",
}));
const __VLS_7 = __VLS_6({
    label: "今日總里程",
    value: (__VLS_ctx.summary.distance),
    unit: "km",
    icon: (Map),
    gradient: "from-indigo-400/90 to-indigo-600",
    glow: "bg-indigo-400/40",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
/** @type {[typeof KpiCard, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(KpiCard, new KpiCard({
    label: "今日減碳",
    value: (__VLS_ctx.summary.carbon),
    unit: "kg",
    icon: (__VLS_ctx.Leaf),
    gradient: "from-teal-400/90 to-teal-600",
    glow: "bg-teal-400/40",
}));
const __VLS_10 = __VLS_9({
    label: "今日減碳",
    value: (__VLS_ctx.summary.carbon),
    unit: "kg",
    icon: (__VLS_ctx.Leaf),
    gradient: "from-teal-400/90 to-teal-600",
    glow: "bg-teal-400/40",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "grid grid-cols-7 gap-8 h-[45vh]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "col-span-5 glass flex flex-col items-center justify-center text-slate-300" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-2xl tracking-wider mb-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-sm opacity-70" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "col-span-2 glass flex flex-col items-center justify-center text-slate-300" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-2xl tracking-wider mb-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-sm opacity-70" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "h-[35vh] glass flex flex-col items-center justify-center text-slate-300" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-2xl tracking-wider mb-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-sm opacity-70" },
});
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['-z-20']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-950']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[url(\'/_data:image/svg+xml;utf8,<svg']} */ ;
/** @type {__VLS_StyleScopedClasses['xmlns=%22http://www.w3.org/2000/svg%22']} */ ;
/** @type {__VLS_StyleScopedClasses['width=%22100%22']} */ ;
/** @type {__VLS_StyleScopedClasses['height=%22100%22']} */ ;
/** @type {__VLS_StyleScopedClasses['fill=%22white%22']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity=%220.12%22><circle']} */ ;
/** @type {__VLS_StyleScopedClasses['cx=%225%22']} */ ;
/** @type {__VLS_StyleScopedClasses['cy=%225%22']} */ ;
/** @type {__VLS_StyleScopedClasses['r=%221%22/><circle']} */ ;
/** @type {__VLS_StyleScopedClasses['cx=%2250%22']} */ ;
/** @type {__VLS_StyleScopedClasses['cy=%2250%22']} */ ;
/** @type {__VLS_StyleScopedClasses['r=%221%22/><circle']} */ ;
/** @type {__VLS_StyleScopedClasses['cx=%2295%22']} */ ;
/** @type {__VLS_StyleScopedClasses['cy=%2295%22']} */ ;
/** @type {__VLS_StyleScopedClasses['r=%221%22/></svg>\')]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[length:200px_200px]']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['-top-1/3']} */ ;
/** @type {__VLS_StyleScopedClasses['-left-1/4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-[180%]']} */ ;
/** @type {__VLS_StyleScopedClasses['h-[180%]']} */ ;
/** @type {__VLS_StyleScopedClasses['rotate-45']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-tr']} */ ;
/** @type {__VLS_StyleScopedClasses['from-indigo-600/5']} */ ;
/** @type {__VLS_StyleScopedClasses['via-fuchsia-600/10']} */ ;
/** @type {__VLS_StyleScopedClasses['to-teal-500/5']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-screen-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['px-10']} */ ;
/** @type {__VLS_StyleScopedClasses['py-10']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-10']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-[20vh]']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-7']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-[45vh]']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-5']} */ ;
/** @type {__VLS_StyleScopedClasses['glass']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-70']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['glass']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-70']} */ ;
/** @type {__VLS_StyleScopedClasses['h-[35vh]']} */ ;
/** @type {__VLS_StyleScopedClasses['glass']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-70']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            KpiCard: KpiCard,
            Bike: Bike,
            CircleOff: CircleOff,
            Leaf: Leaf,
            summary: summary,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
