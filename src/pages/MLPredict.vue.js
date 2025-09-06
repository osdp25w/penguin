var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
import { reactive, computed, onMounted } from 'vue';
import { useVehicles, useML } from '@/stores';
/* 1. store */
const vStore = useVehicles();
const ml = useML();
/* 2. 路線設定 */
const ORIGIN = { lat: 23.9971, lon: 121.6019 };
const DEST = { lat: 24.0304, lon: 121.6249 };
/* 3. Haversine */
function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371, rad = (d) => d * Math.PI / 180;
    const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 +
        Math.cos(rad(lat1)) * Math.cos(rad(lat2)) *
            Math.sin(rad(lon2 - lon1) / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}
const routeDistance = haversineKm(ORIGIN.lat, ORIGIN.lon, DEST.lat, DEST.lon).toFixed(2);
const result = reactive({});
/* 5. 預測流程 ------------------------------------------------------- */
function randFactor(maxPct) {
    return 1 + (Math.random() * 2 - 1) * maxPct;
}
async function runPredict() {
    var _a;
    if (!vStore.items.length)
        return;
    ml.errMsg = '';
    ml.loading = true;
    try {
        const dist = +routeDistance;
        const [strategy, carbon] = await Promise.all([
            ml.fetchStrategy({ distance: dist }),
            ml.fetchCarbon({ distance: dist })
        ]);
        const estMin = +strategy.estTime;
        const avgSpeed = estMin ? +(dist / (estMin / 60)).toFixed(2) : 0;
        const power = await ml.fetchPower({ speed: avgSpeed });
        vStore.items.forEach(v => {
            /* ========== 隨機微調以避免全部一致 ========== */
            const time = +(strategy.estTime * randFactor(0.05)).toFixed(1);
            const energy = +(strategy.estEnergy * randFactor(0.05)).toFixed(2);
            const saved = +(carbon.saved * randFactor(0.1)).toFixed(2);
            const kWh = +(power.kWh + (Math.random() * 0.3 - 0.15)).toFixed(2);
            /* 踏頻 70‒95 rpm 基準，再 ±5 隨機 */
            let baseCad = avgSpeed < 15 ? 72 : avgSpeed < 22 ? 82 : 92;
            const cadence = baseCad + Math.round((Math.random() * 10 - 5));
            /* 變速比 1.8‒2.8 線性 + 0.1 隨機 */
            const baseRatio = 1.8 + (avgSpeed / 30);
            const gearRatio = `1:${(baseRatio + (Math.random() * 0.2 - 0.1)).toFixed(1)}`;
            result[v.id] = {
                id: v.id,
                estTime: time,
                estEnergy: energy,
                saved,
                kWh,
                nextCharge: power.nextCharge,
                cadence,
                gearRatio
            };
        });
    }
    catch (e) {
        ml.errMsg = (_a = e.message) !== null && _a !== void 0 ? _a : '預測失敗';
        console.error(e);
    }
    finally {
        ml.loading = false;
    }
}
/* 6. 掛載：載入車輛並隨機座標 */
onMounted(async () => {
    var _a;
    try {
        await vStore.fetchPage({ page: 1, size: 20 });
        vStore.items.forEach((v, i) => {
            const t = (i + 1) / (vStore.items.length + 1);
            v.lat = +(ORIGIN.lat + (DEST.lat - ORIGIN.lat) * t + (Math.random() - 0.5) * 0.001).toFixed(6);
            v.lon = +(ORIGIN.lon + (DEST.lon - ORIGIN.lon) * t + (Math.random() - 0.5) * 0.001).toFixed(6);
        });
        await runPredict();
    }
    catch (e) {
        ml.errMsg = (_a = e.message) !== null && _a !== void 0 ? _a : '載入失敗';
    }
});
const hasResult = computed(() => Object.keys(result).length > 0);
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
    ...{ class: "flex items-center gap-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-2xl font-bold" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-brand-300 text-sm" },
});
(__VLS_ctx.routeDistance);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.runPredict) },
    ...{ class: "btn ml-auto" },
    disabled: (__VLS_ctx.ml.loading),
});
(__VLS_ctx.ml.loading ? '計算中…' : '重新計算');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "card overflow-auto" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
    ...{ class: "min-w-full text-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({
    ...{ class: "bg-gray-700 text-gray-200 sticky top-0" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    ...{ class: "px-4 py-2 text-left" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    ...{ class: "px-4 py-2 text-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    ...{ class: "px-4 py-2 text-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    ...{ class: "px-4 py-2 text-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    ...{ class: "px-4 py-2 text-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    ...{ class: "px-4 py-2 text-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    ...{ class: "px-4 py-2 text-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    ...{ class: "px-4 py-2 text-center" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    ...{ class: "px-4 py-2 text-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    ...{ class: "px-4 py-2 text-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
for (const [v] of __VLS_getVForSourceType((__VLS_ctx.vStore.items))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
        key: (v.id),
        ...{ class: "border-t border-white/10 hover:bg-brand-400/5 transition" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "px-4 py-2" },
    });
    (v.id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "px-4 py-2 text-right" },
    });
    ((_b = (_a = v.lat) === null || _a === void 0 ? void 0 : _a.toFixed(6)) !== null && _b !== void 0 ? _b : '—');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "px-4 py-2 text-right" },
    });
    ((_d = (_c = v.lon) === null || _c === void 0 ? void 0 : _c.toFixed(6)) !== null && _d !== void 0 ? _d : '—');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "px-4 py-2 text-right" },
    });
    ((_f = (_e = __VLS_ctx.result[v.id]) === null || _e === void 0 ? void 0 : _e.estTime) !== null && _f !== void 0 ? _f : (__VLS_ctx.ml.loading ? '…' : '—'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "px-4 py-2 text-right" },
    });
    ((_h = (_g = __VLS_ctx.result[v.id]) === null || _g === void 0 ? void 0 : _g.estEnergy) !== null && _h !== void 0 ? _h : (__VLS_ctx.ml.loading ? '…' : '—'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "px-4 py-2 text-right" },
    });
    ((_k = (_j = __VLS_ctx.result[v.id]) === null || _j === void 0 ? void 0 : _j.saved) !== null && _k !== void 0 ? _k : (__VLS_ctx.ml.loading ? '…' : '—'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "px-4 py-2 text-right" },
    });
    ((_m = (_l = __VLS_ctx.result[v.id]) === null || _l === void 0 ? void 0 : _l.kWh) !== null && _m !== void 0 ? _m : (__VLS_ctx.ml.loading ? '…' : '—'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "px-4 py-2 text-center" },
    });
    ((_p = (_o = __VLS_ctx.result[v.id]) === null || _o === void 0 ? void 0 : _o.nextCharge) !== null && _p !== void 0 ? _p : (__VLS_ctx.ml.loading ? '…' : '—'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "px-4 py-2 text-right" },
    });
    ((_r = (_q = __VLS_ctx.result[v.id]) === null || _q === void 0 ? void 0 : _q.cadence) !== null && _r !== void 0 ? _r : (__VLS_ctx.ml.loading ? '…' : '—'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "px-4 py-2 text-right" },
    });
    ((_t = (_s = __VLS_ctx.result[v.id]) === null || _s === void 0 ? void 0 : _s.gearRatio) !== null && _t !== void 0 ? _t : (__VLS_ctx.ml.loading ? '…' : '—'));
}
if (!__VLS_ctx.hasResult) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "py-8 text-center text-brand-300" },
    });
    (__VLS_ctx.ml.loading ? '計算中，請稍候…' : '尚無預測結果');
}
if (__VLS_ctx.ml.errMsg) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-rose-400" },
    });
    (__VLS_ctx.ml.errMsg);
}
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-brand-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['sticky']} */ ;
/** @type {__VLS_StyleScopedClasses['top-0']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-brand-400/5']} */ ;
/** @type {__VLS_StyleScopedClasses['transition']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-brand-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-rose-400']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            vStore: vStore,
            ml: ml,
            routeDistance: routeDistance,
            result: result,
            runPredict: runPredict,
            hasResult: hasResult,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
