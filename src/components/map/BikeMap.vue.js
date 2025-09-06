import { onMounted, onUnmounted, watch, ref, nextTick } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
const props = withDefaults(defineProps(), { bikes: () => [], height: '100%' });
/* ---------- Refs ---------- */
const mapEl = ref(null);
let map = null;
/* ---------- 花蓮市中心 ---------- */
const HUALIEN_CENTER = { lat: 23.977, lng: 121.605 };
/* ---------- 環境變數 ---------- */
const emapLayer = import.meta.env.VITE_EMAP_LAYER || 'EMAP';
const emapMatrixSet = import.meta.env.VITE_EMAP_MATRIXSET || 'GoogleMapsCompatible';
const wmtsUrl = `https://wmts.nlsc.gov.tw/wmts/${emapLayer}/default/${emapMatrixSet}/{z}/{y}/{x}`;
/* ---------- Init MapLibre Map ---------- */
const initMap = async () => {
    if (!mapEl.value)
        return;
    try {
        // 建立 MapLibre 地圖
        map = new maplibregl.Map({
            container: mapEl.value,
            style: {
                version: 8,
                sources: {},
                layers: []
            },
            center: [HUALIEN_CENTER.lng, HUALIEN_CENTER.lat], // MapLibre 用 [lng, lat]
            zoom: 14,
            attributionControl: true
        });
        // 等待地圖載入完成
        await new Promise((resolve, reject) => {
            map.on('load', resolve);
            map.on('error', reject);
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
        // 加入車輛圖層
        updateMarkers(props.bikes);
    }
    catch (err) {
        console.error('[MapLibre] BikeMap 初始化失敗:', err);
    }
};
/* ---------- Sync markers ---------- */
const updateMarkers = (bikes) => {
    if (!map)
        return;
    const geojson = {
        type: 'FeatureCollection',
        features: bikes.map((bike, idx) => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [bike.lon, bike.lat]
            },
            properties: {
                id: bike.id,
                index: idx + 1,
                soc: bike.soc || 0
            }
        }))
    };
    // 移除既有圖層
    if (map.getSource('bikes')) {
        map.removeLayer('bikes-layer');
        map.removeSource('bikes');
    }
    // 加入資料源
    map.addSource('bikes', {
        type: 'geojson',
        data: geojson
    });
    // 加入圓點圖層
    map.addLayer({
        id: 'bikes-layer',
        type: 'circle',
        source: 'bikes',
        paint: {
            'circle-radius': 12,
            'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'index'],
                1, '#4ade80',
                5, '#3b82f6',
                10, '#facc15',
                15, '#fb7185',
                20, '#a78bfa'
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 3
        }
    });
    // 加入標籤圖層
    map.addLayer({
        id: 'bikes-labels',
        type: 'symbol',
        source: 'bikes',
        layout: {
            'text-field': ['get', 'index'],
            'text-size': 14,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
        },
        paint: {
            'text-color': '#000000'
        }
    });
};
onMounted(async () => {
    await nextTick();
    await initMap();
});
onUnmounted(() => {
    map === null || map === void 0 ? void 0 : map.remove();
    map = null;
});
watch(() => props.bikes, updateMarkers, { deep: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({ bikes: () => [], height: '100%' });
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ style: ({ width: '100%', height: __VLS_ctx.height }) },
    ref: "mapEl",
});
/** @type {typeof __VLS_ctx.mapEl} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            mapEl: mapEl,
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
