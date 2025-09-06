import { ref, computed } from 'vue';
import BikeMap from '@/components/map/BikeMap.vue';
/* ---------- Demo：隨機 20 台車，散佈在中心 800m 內 ---------- */
const CENTER = { lat: 23.977, lon: 121.605 };
const RADIUS_METERS = 800;
/** 將公尺轉成緯度差／經度差（簡化球體地球模型） */
const metersToLat = (m) => m / 111320;
const metersToLon = (m, lat) => m / (111320 * Math.cos((lat * Math.PI) / 180));
function randomPointNear(center, radiusM) {
    const r = Math.random() * radiusM;
    const θ = Math.random() * 2 * Math.PI;
    const dx = r * Math.cos(θ);
    const dy = r * Math.sin(θ);
    return {
        lat: center.lat + metersToLat(dy),
        lon: center.lon + metersToLon(dx, center.lat)
    };
}
const demoBikes = ref(Array.from({ length: 20 }).map((_, i) => {
    const p = randomPointNear(CENTER, RADIUS_METERS);
    return { id: `demo-${i + 1}`, lat: p.lat, lon: p.lon };
}));
/* ---------- 將 demo 資料餵進地圖 ---------- */
const bikeMarkers = computed(() => demoBikes.value);
/* 若未來接上真實 API，替換 bikeMarkers 即可 */
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "h-[calc(100vh-3.5rem)] p-4 flex flex-col gap-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-xl font-bold" },
});
/** @type {[typeof BikeMap, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(BikeMap, new BikeMap({
    bikes: (__VLS_ctx.bikeMarkers),
    ...{ class: "flex-1 rounded-lg overflow-hidden" },
}));
const __VLS_1 = __VLS_0({
    bikes: (__VLS_ctx.bikeMarkers),
    ...{ class: "flex-1 rounded-lg overflow-hidden" },
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
/** @type {__VLS_StyleScopedClasses['h-[calc(100vh-3.5rem)]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            BikeMap: BikeMap,
            bikeMarkers: bikeMarkers,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
