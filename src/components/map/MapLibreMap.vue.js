var _a;
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { MapIcon } from 'lucide-vue-next';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
const props = defineProps();
const emit = defineEmits();
// 響應式狀態
const mapContainer = ref();
const loading = ref(true);
const error = ref(null);
let map = null;
// 環境變數
const mapCenter = ((_a = import.meta.env.VITE_MAP_CENTER) === null || _a === void 0 ? void 0 : _a.split(',').map(Number)) || [23.8, 121.6];
const mapZoom = Number(import.meta.env.VITE_MAP_ZOOM) || 10;
const emapLayer = import.meta.env.VITE_EMAP_LAYER || 'EMAP';
const emapMatrixSet = import.meta.env.VITE_EMAP_MATRIXSET || 'GoogleMapsCompatible';
// WMTS URL
const wmtsUrl = `https://wmts.nlsc.gov.tw/wmts/${emapLayer}/default/${emapMatrixSet}/{z}/{y}/{x}`;
async function initializeMap() {
    if (!mapContainer.value)
        return;
    loading.value = true;
    error.value = null;
    try {
        // 建立 MapLibre 地圖
        map = new maplibregl.Map({
            container: mapContainer.value,
            style: {
                version: 8,
                sources: {},
                layers: []
            },
            center: [mapCenter[1], mapCenter[0]], // MapLibre 用 [lng, lat]
            zoom: mapZoom,
            attributionControl: true
        });
        // 等待地圖載入完成
        await new Promise((resolve, reject) => {
            map.on('load', resolve);
            map.on('error', reject);
            // 5秒超時
            setTimeout(() => reject(new Error('地圖載入超時')), 5000);
        });
        // 加入 NLSC EMAP 圖層
        map.addSource('emap', {
            type: 'raster',
            tiles: [wmtsUrl],
            tileSize: 256,
            attribution: '© 內政部國土測繪中心（NLSC）'
        });
        map.addLayer({
            id: 'emap',
            type: 'raster',
            source: 'emap'
        });
        // 加入站點圖層
        addSitesLayer();
        // 綁定點擊事件
        map.on('click', 'sites-layer', handleSiteClick);
        map.on('mouseenter', 'sites-layer', () => {
            if (map)
                map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'sites-layer', () => {
            if (map)
                map.getCanvas().style.cursor = '';
        });
        loading.value = false;
    }
    catch (err) {
        console.error('[MapLibre] 初始化失敗:', err);
        error.value = err instanceof Error ? err.message : '未知錯誤';
        loading.value = false;
    }
}
function addSitesLayer() {
    if (!map)
        return;
    const geojson = {
        type: 'FeatureCollection',
        features: props.sites.map(site => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [site.location.lng, site.location.lat]
            },
            properties: {
                id: site.id,
                name: site.name,
                status: site.status,
                brand: site.brand,
                vehicleCount: site.vehicleCount,
                availableCount: site.availableCount
            }
        }))
    };
    // 移除既有圖層
    if (map.getSource('sites')) {
        map.removeLayer('sites-layer');
        map.removeSource('sites');
    }
    // 加入資料源
    map.addSource('sites', {
        type: 'geojson',
        data: geojson
    });
    // 加入圓點圖層
    map.addLayer({
        id: 'sites-layer',
        type: 'circle',
        source: 'sites',
        paint: {
            'circle-radius': 8,
            'circle-color': [
                'match',
                ['get', 'status'],
                'active', '#10b981',
                'maintenance', '#f59e0b',
                'offline', '#ef4444',
                '#6b7280'
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2
        }
    });
}
function handleSiteClick(e) {
    var _a, _b;
    const feature = (_a = e.features) === null || _a === void 0 ? void 0 : _a[0];
    if ((_b = feature === null || feature === void 0 ? void 0 : feature.properties) === null || _b === void 0 ? void 0 : _b.id) {
        emit('select', feature.properties.id);
    }
}
// 監聽站點資料變化
watch(() => props.sites, () => {
    if (map) {
        addSitesLayer();
    }
}, { deep: true });
// 生命週期
onMounted(async () => {
    await nextTick();
    await initializeMap();
});
onUnmounted(() => {
    map === null || map === void 0 ? void 0 : map.remove();
    map = null;
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "mapContainer",
    ...{ class: "w-full h-full relative" },
});
/** @type {typeof __VLS_ctx.mapContainer} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-10" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm text-gray-600 dark:text-gray-400" },
    });
}
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-10" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center p-4" },
    });
    const __VLS_0 = {}.MapIcon;
    /** @type {[typeof __VLS_components.MapIcon, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ class: "mx-auto h-12 w-12 text-red-400 mb-2" },
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "mx-auto h-12 w-12 text-red-400 mb-2" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-medium text-gray-900 dark:text-white mb-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-gray-600 dark:text-gray-400 text-sm" },
    });
    (__VLS_ctx.error);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.initializeMap) },
        ...{ class: "mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600" },
    });
}
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['h-12']} */ ;
/** @type {__VLS_StyleScopedClasses['w-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-blue-600']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            MapIcon: MapIcon,
            mapContainer: mapContainer,
            loading: loading,
            error: error,
            initializeMap: initializeMap,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
