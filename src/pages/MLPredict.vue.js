import { reactive, computed, onMounted, ref } from 'vue';
import { useVehicles, useML } from '@/stores';
import { predictCadenceFromModel, predictGearRateFromModel, predictBatteryRisk } from '@/ml/runners';
import { getAllModelPaths, setModelPaths } from '@/ml/paths';
export default await (async () => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    /* 1. store */
    const vStore = useVehicles();
    const ml = useML();
    const usingRealData = ref(false);
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
    const routeDistance = ref(haversineKm(ORIGIN.lat, ORIGIN.lon, DEST.lat, DEST.lon));
    const distKm = ref(+routeDistance.value.toFixed(2));
    // user controls
    const pref01 = ref(0.3); // 0 舒適, 1 挑戰
    const terrain = ref(0.3); // 0 平地, 1 山路
    const wind01 = ref(0.5); // 0 順風, 1 逆風
    const result = reactive({});
    const telemetry = reactive({ value: null });
    // 車輛選擇（多選）
    const selectedIds = ref([]);
    const search = ref('');
    // Sorting configuration for results table
    const sortConfig = ref({
        field: '',
        order: 'asc'
    });
    const allVehicles = computed(() => { var _a; return (((_a = vStore.vehicles) === null || _a === void 0 ? void 0 : _a.length) ? vStore.vehicles : vStore.items); });
    const safeVehicles = computed(() => (Array.isArray(allVehicles.value) ? allVehicles.value : []).filter((v) => v && v.id));
    // 測試資料（當 store 無資料時使用）
    const localDummies = ref([]);
    const viewVehicles = computed(() => (safeVehicles.value.length ? safeVehicles.value : localDummies.value));
    const filteredOptions = computed(() => {
        const q = search.value.trim().toLowerCase();
        if (!q)
            return viewVehicles.value;
        return viewVehicles.value.filter((v) => String(v.id).toLowerCase().includes(q) ||
            String(v.name || '').toLowerCase().includes(q));
    });
    const selectedRowsUnsorted = computed(() => viewVehicles.value.filter((v) => v && v.id && selectedIds.value.includes(String(v.id))));
    // Apply sorting to selected rows
    const selectedRows = computed(() => {
        let list = [...selectedRowsUnsorted.value];
        if (sortConfig.value.field) {
            list.sort((a, b) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                let aVal = '';
                let bVal = '';
                switch (sortConfig.value.field) {
                    case 'vehicle':
                        aVal = a.name || a.id || '';
                        bVal = b.name || b.id || '';
                        break;
                    case 'status':
                        aVal = a.status || '';
                        bVal = b.status || '';
                        break;
                    case 'health':
                        const aBattery = (_a = ml.batteries) === null || _a === void 0 ? void 0 : _a.find((bat) => (bat === null || bat === void 0 ? void 0 : bat.id) === String(a === null || a === void 0 ? void 0 : a.id));
                        const bBattery = (_b = ml.batteries) === null || _b === void 0 ? void 0 : _b.find((bat) => (bat === null || bat === void 0 ? void 0 : bat.id) === String(b === null || b === void 0 ? void 0 : b.id));
                        aVal = (aBattery === null || aBattery === void 0 ? void 0 : aBattery.health) || 0;
                        bVal = (bBattery === null || bBattery === void 0 ? void 0 : bBattery.health) || 0;
                        break;
                    case 'risk':
                        const aBatteryRisk = (_c = ml.batteries) === null || _c === void 0 ? void 0 : _c.find((bat) => (bat === null || bat === void 0 ? void 0 : bat.id) === String(a === null || a === void 0 ? void 0 : a.id));
                        const bBatteryRisk = (_d = ml.batteries) === null || _d === void 0 ? void 0 : _d.find((bat) => (bat === null || bat === void 0 ? void 0 : bat.id) === String(b === null || b === void 0 ? void 0 : b.id));
                        aVal = (aBatteryRisk === null || aBatteryRisk === void 0 ? void 0 : aBatteryRisk.faultP) || 0;
                        bVal = (bBatteryRisk === null || bBatteryRisk === void 0 ? void 0 : bBatteryRisk.faultP) || 0;
                        break;
                    case 'charge':
                        aVal = ((_e = result[String(a.id)]) === null || _e === void 0 ? void 0 : _e.nextCharge) || '';
                        bVal = ((_f = result[String(b.id)]) === null || _f === void 0 ? void 0 : _f.nextCharge) || '';
                        break;
                    case 'cadence':
                        aVal = a.status === 'in-use' ? (((_g = result[String(a.id)]) === null || _g === void 0 ? void 0 : _g.cadence) || 0) : 0;
                        bVal = b.status === 'in-use' ? (((_h = result[String(b.id)]) === null || _h === void 0 ? void 0 : _h.cadence) || 0) : 0;
                        break;
                    case 'gearRatio':
                        aVal = a.status === 'in-use' ? (((_j = result[String(a.id)]) === null || _j === void 0 ? void 0 : _j.gearRatio) || '') : '';
                        bVal = b.status === 'in-use' ? (((_k = result[String(b.id)]) === null || _k === void 0 ? void 0 : _k.gearRatio) || '') : '';
                        break;
                }
                const compareResult = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                return sortConfig.value.order === 'asc' ? compareResult : -compareResult;
            });
        }
        return list;
    });
    // Sorting function
    function handleSort(field) {
        if (sortConfig.value.field === field) {
            sortConfig.value.order = sortConfig.value.order === 'asc' ? 'desc' : 'asc';
        }
        else {
            sortConfig.value.field = field;
            sortConfig.value.order = 'asc';
        }
    }
    /* 5. 預測流程 ------------------------------------------------------- */
    // 決定論噪聲工具：以字串產生穩定 0..1 值
    function hashStr(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    } return h >>> 0; }
    function noise01(key) { return (hashStr(key) % 1000) / 1000; }
    function detFactor(key, maxPct) { return 1 + ((noise01(key) * 2 - 1) * maxPct); }
    function noiseRange(key, min, max) { return min + noise01(key) * (max - min); }
    function shortId(id) {
        if (id == null)
            return '—';
        const s = String(id);
        if (s.length <= 12)
            return s;
        return `${s.slice(0, 6)}…${s.slice(-4)}`;
    }
    async function runPredict() {
        var _a;
        if (!selectedIds.value.length)
            return;
        ml.errMsg = '';
        ml.loading = true;
        try {
            const dist = +distKm.value;
            const [strategy, carbon] = await Promise.all([
                ml.fetchStrategy({ distance: dist, preference01: pref01.value, terrain01: terrain.value, wind01: wind01.value }),
                ml.fetchCarbon({ distance: dist })
            ]);
            const estMin = Number(strategy.estTime);
            const estEnergyVal = Number(strategy.estEnergy);
            const carbonSavedVal = Number(carbon.saved);
            const avgSpeed = estMin ? +(dist / (estMin / 60)).toFixed(2) : 0;
            const power = await ml.fetchPower({ speed: avgSpeed });
            // Try optional cadence/gear models per vehicle (use pasted telemetry if provided)
            const rows = selectedRows.value;
            if (!rows.length) {
                throw new Error('請先選擇有效車輛');
            }
            // 先以第一台車嘗試模型以暖機，再逐台計算（避免每次都 cold-start）
            const warmupTel = telemetry.value || telemetryFromVehicle(rows[0]) || undefined;
            await predictCadenceFromModel(warmupTel);
            await predictGearRateFromModel(warmupTel);
            // 清空舊結果
            for (const k of Object.keys(result))
                delete result[k];
            for (const v of rows) {
                if (!v || !v.id)
                    return;
                /* ========== 決定論微調，避免全部一致（同車同參數輸出恆定） ========== */
                const vid = String(v.id);
                const time = +(estMin * detFactor(vid + ':time', 0.05)).toFixed(1);
                const energy = +(estEnergyVal * detFactor(vid + ':energy', 0.05)).toFixed(2);
                const saved = +(carbonSavedVal * detFactor(vid + ':saved', 0.10)).toFixed(2);
                // 以每台車的即時速度（若有）微調耗能（決定論）
                const vSpeed = typeof v.vehicleSpeed === 'number' ? v.vehicleSpeed : (typeof v.speedKph === 'number' ? v.speedKph : avgSpeed);
                const speedMul = avgSpeed ? Math.max(0.5, Math.min(1.5, (vSpeed / avgSpeed) ** 2)) : 1;
                const kWhBase = power.kWh * speedMul;
                const kWhNoise = noiseRange(vid + ':kwh', -0.15, 0.15);
                const kWh = +(kWhBase + kWhNoise).toFixed(2);
                /* 踏頻：若有模型，採用模型輸出，否則 70‒95 rpm 基準 ±5 */
                const tel = telemetry.value || telemetryFromVehicle(v) || undefined;
                const cadV = await predictCadenceFromModel(tel);
                let cadence = cadV !== null && cadV !== void 0 ? cadV : ((vSpeed < 15 ? 72 : vSpeed < 22 ? 82 : 92) + Math.round((Math.random() * 10 - 5)));
                /* 變速比：若有模型，採用模型輸出 (四捨五入至 0.1)，否則 1.8‒2.8 線性 + 0.1 隨機 */
                const gearV = await predictGearRateFromModel(tel);
                const baseRatio = gearV !== null && gearV !== void 0 ? gearV : (1.8 + (vSpeed / 30) + (Math.random() * 0.2 - 0.1));
                const gearRatio = `1:${(+baseRatio).toFixed(1)}`;
                const key = String(v.id);
                result[key] = {
                    id: key,
                    estTime: time,
                    estEnergy: energy,
                    saved,
                    kWh,
                    nextCharge: power.nextCharge,
                    cadence,
                    gearRatio
                };
            }
            // battery risk：針對每台車序列推論（避免 ONNX session 衝突）
            console.log('[ML] Starting battery risk prediction for', rows.length, 'vehicles');
            const risks = [];
            for (const v of rows) {
                const tel = telemetry.value || telemetryFromVehicle(v) || undefined;
                console.log('[ML] Predicting battery risk for vehicle:', v.id, 'with telemetry:', !!tel);
                try {
                    const out = await predictBatteryRisk([String(v.id)], tel);
                    console.log('[ML] Battery risk result for', v.id, ':', out);
                    risks.push(out && out.length > 0 ? out[0] : null);
                }
                catch (err) {
                    console.error('[ML] Battery risk prediction error for', v.id, ':', err);
                    risks.push(null);
                }
            }
            // 寫回 store（包含所有結果，即使是 null）
            const validRisks = risks.filter((risk) => risk && risk.id).map((risk) => ({
                id: String(risk.id),
                health: Number(risk.health) || 0,
                faultP: Number(risk.faultP) || 0,
                capacity: risk.capacity != null ? Number(risk.capacity) : null
            }));
            console.log('[ML] Final battery analysis results:', validRisks);
            console.log('[ML] Selected IDs:', selectedIds.value);
            ml.batteries = validRisks;
        }
        catch (e) {
            ml.errMsg = (_a = e.message) !== null && _a !== void 0 ? _a : '預測失敗';
            console.error(e);
        }
        finally {
            ml.loading = false;
        }
    }
    // 重新整理資料函數
    const refreshData = async () => {
        try {
            // 優先從後端載入即時車輛資料
            const { data, total } = await vStore.fetchVehiclesPaged({ limit: 48, offset: 0 });
            if (Array.isArray(data) && data.length) {
                ;
                vStore.vehicles = data;
                vStore.total = total;
                vStore.page = 1;
                vStore.pageSize = 48;
                usingRealData.value = true;
                console.log('[ML] 已載入真實車輛資料:', data.length, '台');
            }
            else {
                throw new Error('無真實資料');
            }
        }
        catch (err) {
            console.warn('[ML] 載入真實資料失敗，使用示範資料:', err);
            await vStore.fetchPage({ page: 1, size: 20 });
            usingRealData.value = false;
        }
    };
    /* 6. 掛載：載入車輛並隨機座標 */
    onMounted(async () => {
        var _a;
        try {
            await refreshData();
            // 若無資料，建立 8 筆示範車輛
            if (!safeVehicles.value.length) {
                const count = 8;
                const arr = [];
                for (let i = 0; i < count; i++) {
                    const id = `DEMO-${String(i + 1).padStart(3, '0')}`;
                    const t = (i + 1) / (count + 1);
                    const lat = +(ORIGIN.lat + (DEST.lat - ORIGIN.lat) * t).toFixed(6);
                    const lon = +(ORIGIN.lon + (DEST.lon - ORIGIN.lon) * t).toFixed(6);
                    const soc = Math.round(noiseRange(id + ':soc', 40, 85));
                    const spd = Math.round(noiseRange(id + ':speed', 0, 22));
                    arr.push({ id, name: `示範車輛-${i + 1}`, lat, lon, batteryPct: soc, batteryLevel: soc, status: soc > 20 ? '可租借' : '低電量', speedKph: spd });
                }
                localDummies.value = arr;
            }
            // 為目前資料加上座標（若未定，使用決定論位置）
            const denom = (viewVehicles.value.length || 1) + 1;
            viewVehicles.value.forEach((v, i) => {
                if (typeof v.lat !== 'number' || typeof v.lon !== 'number') {
                    const t = (i + 1) / denom;
                    v.lat = +(ORIGIN.lat + (DEST.lat - ORIGIN.lat) * t).toFixed(6);
                    v.lon = +(ORIGIN.lon + (DEST.lon - ORIGIN.lon) * t).toFixed(6);
                }
            });
            // 預設勾選第一台車（若可用）
            if (viewVehicles.value.length)
                selectedIds.value = [String(viewVehicles.value[0].id)];
        }
        catch (e) {
            ml.errMsg = (_a = e.message) !== null && _a !== void 0 ? _a : '載入失敗';
        }
    });
    const hasResult = computed(() => Object.keys(result).length > 0);
    // 將現有車輛快照轉為 Telemetry 物件（缺值用隨機）
    function telemetryFromVehicle(v) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const vid = String(v.id);
        const rawSoc = (_c = (_b = (_a = v.batteryLevel) !== null && _a !== void 0 ? _a : v.batteryPct) !== null && _b !== void 0 ? _b : v.soc) !== null && _c !== void 0 ? _c : noiseRange(vid + ':soc', 35, 90);
        const voltage = (_e = (_d = v.voltage) !== null && _d !== void 0 ? _d : v.packVoltage) !== null && _e !== void 0 ? _e : (typeof v.mv10 === 'number' ? v.mv10 / 10 : undefined);
        const ctrlTemp = (_h = (_g = (_f = v.controllerTemp) !== null && _f !== void 0 ? _f : v.motorTemp) !== null && _g !== void 0 ? _g : v.temperature) !== null && _h !== void 0 ? _h : noiseRange(vid + ':ct', 28, 42);
        const speed = (_k = (_j = v.vehicleSpeed) !== null && _j !== void 0 ? _j : v.speedKph) !== null && _k !== void 0 ? _k : noiseRange(vid + ':speed', 0, 22);
        const lat = typeof v.lat === 'number' ? Math.round(v.lat * 1e6) : 0;
        const lon = typeof v.lon === 'number' ? Math.round(v.lon * 1e6) : 0;
        const mv10 = Math.round((voltage !== null && voltage !== void 0 ? voltage : noiseRange(vid + ':mv10', 50, 54)) * 10);
        const soc = Math.round(rawSoc);
        const vs = Math.round(speed);
        const ct = Math.round(ctrlTemp);
        return {
            ID: String(v.id),
            MSG: {
                VS: vs,
                SO: soc,
                LA: lat,
                LG: lon,
                MV: mv10,
                CT: ct,
                AL: 1,
                CA: 0,
                PT: 0,
                GQ: 23
            }
        };
    }
    // 模型設定（UI 狀態）
    const ui = reactive({
        powerPath: getAllModelPaths().power,
        batteryPath: getAllModelPaths().battery,
        status: '未載入'
    });
    const powerOptions = [
        { label: '內建 power.onnx', value: '/models/power.onnx' },
        { label: 'range.onnx', value: '/models/range.onnx' }
    ];
    const batteryOptions = [
        { label: '容量模型 (battery_capacity.onnx)', value: '/models/battery_capacity.onnx' },
        { label: '風險模型 (battery_risk.onnx)', value: '/models/battery_risk.onnx' },
        { label: 'soh_rf.onnx', value: '/models/soh_rf.onnx' },
        { label: 'iforest.onnx', value: '/models/iforest.onnx' }
    ];
    function applyModelPaths() {
        const partial = {};
        if (ui.powerPath)
            partial.power = ui.powerPath;
        if (ui.batteryPath)
            partial.battery = ui.batteryPath;
        setModelPaths(partial);
        ui.status = '已套用，推論時載入';
    }
    async function testLoad() {
        try {
            applyModelPaths();
            // 試跑一次最小輸入以驗證 ORT 可載入
            await Promise.all([
                // 以現有流程觸發 power/ battery 兩組模型
                ml.fetchPower({ speed: 18 }),
                ml.fetchBatteryRisk(['DEMO-000'])
            ]);
            ui.status = 'ONNX 已載入';
        }
        catch (e) {
            ui.status = '載入失敗：' + ((e === null || e === void 0 ? void 0 : e.message) || 'unknown');
        }
    }
    debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "min-h-screen bg-gray-50 p-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mx-auto max-w-6xl space-y-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bg-white rounded-lg shadow p-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-between" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
        ...{ class: "text-2xl font-bold text-gray-900" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "mt-1 text-sm text-gray-600" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "px-3 py-1.5 rounded-md text-xs font-medium" },
        ...{ class: (__VLS_ctx.usingRealData ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200') },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: (__VLS_ctx.usingRealData ? 'i-ph-database' : 'i-ph-test-tube') },
        ...{ class: "w-4 h-4 inline-block mr-1" },
    });
    (__VLS_ctx.usingRealData ? '真實資料' : '示範資料');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.refreshData) },
        ...{ class: "px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" },
        disabled: (__VLS_ctx.vStore.loading),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "w-4 h-4" },
        ...{ class: (__VLS_ctx.vStore.loading ? 'i-ph-spinner animate-spin' : 'i-ph-arrow-clockwise') },
    });
    (__VLS_ctx.vStore.loading ? '載入中...' : '重新整理');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bg-white rounded-lg shadow p-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-between mb-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ class: "text-lg font-semibold text-gray-900" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm text-gray-600 mt-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm font-medium text-blue-600" },
    });
    (__VLS_ctx.selectedIds.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-3 mb-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative max-w-md" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "i-ph-magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "text",
        value: (__VLS_ctx.search),
        placeholder: "搜尋車輛 ID 或名稱...",
        ...{ class: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectedIds = __VLS_ctx.filteredOptions.map((v) => String(v && v.id)).filter(Boolean);
            } },
        ...{ class: "px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "i-ph-check-square w-4 h-4 inline-block mr-1" },
    });
    (__VLS_ctx.filteredOptions.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectedIds = [];
            } },
        ...{ class: "px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "i-ph-x-square w-4 h-4 inline-block mr-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "ml-auto text-sm text-gray-500" },
    });
    (__VLS_ctx.viewVehicles.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto" },
    });
    for (const [v, idx] of __VLS_getVForSourceType((__VLS_ctx.filteredOptions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: ((v && v.id) || idx),
            ...{ class: "border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors" },
            ...{ class: (__VLS_ctx.selectedIds.includes(String(v === null || v === void 0 ? void 0 : v.id)) ? 'bg-blue-50 border-blue-300' : 'bg-white') },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "flex items-center gap-3 cursor-pointer" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "checkbox",
            value: (String((v && v.id) || '')),
            ...{ class: "h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" },
        });
        (__VLS_ctx.selectedIds);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex-1 min-w-0" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center gap-2 mb-1" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600" },
        });
        (String((v === null || v === void 0 ? void 0 : v.name) || (v === null || v === void 0 ? void 0 : v.id) || 'E')[0].toUpperCase());
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "font-medium text-sm text-gray-900 truncate" },
        });
        ((v && v.name) || 'E-Bike');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-xs text-gray-500 font-mono" },
        });
        (__VLS_ctx.shortId(v && v.id));
        if ((v === null || v === void 0 ? void 0 : v.batteryLevel) || (v === null || v === void 0 ? void 0 : v.batteryPct)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "text-xs text-gray-600 mt-1" },
            });
            (Math.round((v === null || v === void 0 ? void 0 : v.batteryLevel) || (v === null || v === void 0 ? void 0 : v.batteryPct) || 0));
        }
        if (v === null || v === void 0 ? void 0 : v.vehicleSpeed) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "text-xs text-gray-600" },
            });
            (v.vehicleSpeed);
        }
    }
    if (__VLS_ctx.selectedIds.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-center py-8 text-gray-500" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-bicycle w-12 h-12 mx-auto text-gray-300 mb-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-6 flex justify-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.runPredict) },
        disabled: (__VLS_ctx.ml.loading || __VLS_ctx.selectedIds.length === 0),
        ...{ class: "px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2" },
    });
    if (__VLS_ctx.ml.loading) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-spinner w-5 h-5 animate-spin" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-play w-5 h-5" },
        });
    }
    (__VLS_ctx.ml.loading ? '計算中...' : (__VLS_ctx.hasResult ? '重新計算' : '開始預測'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bg-white rounded-lg shadow overflow-hidden" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "px-6 py-4 border-b border-gray-200" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-between" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ class: "text-lg font-semibold text-gray-900" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm text-gray-600 mt-1" },
    });
    if (__VLS_ctx.hasResult) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-sm text-gray-600" },
        });
        (__VLS_ctx.selectedRows.length);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "overflow-x-auto" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
        ...{ class: "min-w-full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({
        ...{ class: "bg-gray-50" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
        ...{ class: "text-left text-xs font-semibold uppercase tracking-wider text-gray-600" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleSort('vehicle');
            } },
        ...{ class: "px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-1" },
    });
    if (__VLS_ctx.sortConfig.field === 'vehicle') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: (__VLS_ctx.sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down') },
            ...{ class: "w-3 h-3" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-caret-up-down w-3 h-3 opacity-30" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleSort('status');
            } },
        ...{ class: "px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-1" },
    });
    if (__VLS_ctx.sortConfig.field === 'status') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: (__VLS_ctx.sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down') },
            ...{ class: "w-3 h-3" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-caret-up-down w-3 h-3 opacity-30" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleSort('health');
            } },
        ...{ class: "px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-1" },
    });
    if (__VLS_ctx.sortConfig.field === 'health') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: (__VLS_ctx.sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down') },
            ...{ class: "w-3 h-3" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-caret-up-down w-3 h-3 opacity-30" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleSort('risk');
            } },
        ...{ class: "px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-1" },
    });
    if (__VLS_ctx.sortConfig.field === 'risk') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: (__VLS_ctx.sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down') },
            ...{ class: "w-3 h-3" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-caret-up-down w-3 h-3 opacity-30" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleSort('charge');
            } },
        ...{ class: "px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-1" },
    });
    if (__VLS_ctx.sortConfig.field === 'charge') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: (__VLS_ctx.sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down') },
            ...{ class: "w-3 h-3" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-caret-up-down w-3 h-3 opacity-30" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleSort('cadence');
            } },
        ...{ class: "px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-1" },
    });
    if (__VLS_ctx.sortConfig.field === 'cadence') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: (__VLS_ctx.sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down') },
            ...{ class: "w-3 h-3" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-caret-up-down w-3 h-3 opacity-30" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleSort('gearRatio');
            } },
        ...{ class: "px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-1" },
    });
    if (__VLS_ctx.sortConfig.field === 'gearRatio') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: (__VLS_ctx.sortConfig.order === 'asc' ? 'i-ph-caret-up' : 'i-ph-caret-down') },
            ...{ class: "w-3 h-3" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-caret-up-down w-3 h-3 opacity-30" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({
        ...{ class: "bg-white divide-y divide-gray-200" },
    });
    for (const [v, idx] of __VLS_getVForSourceType((__VLS_ctx.selectedRows))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
            key: ((v && v.id) || idx),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-6 py-4 whitespace-nowrap" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600" },
        });
        (String((v === null || v === void 0 ? void 0 : v.name) || (v === null || v === void 0 ? void 0 : v.id) || 'E')[0].toUpperCase());
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "ml-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-sm font-medium text-gray-900" },
        });
        ((v && v.name) || 'E-Bike');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-sm text-gray-500 font-mono" },
        });
        ((v && v.id) || '—');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-6 py-4 whitespace-nowrap" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "inline-flex px-2 py-1 text-xs font-semibold rounded-full" },
            ...{ class: ((v === null || v === void 0 ? void 0 : v.status) === 'in-use' ? 'bg-blue-100 text-blue-800' :
                    (v === null || v === void 0 ? void 0 : v.status) === 'available' ? 'bg-green-100 text-green-800' :
                        (v === null || v === void 0 ? void 0 : v.status) === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800') },
        });
        ((v === null || v === void 0 ? void 0 : v.status) === 'in-use' ? '使用中' :
            (v === null || v === void 0 ? void 0 : v.status) === 'available' ? '可用' :
                (v === null || v === void 0 ? void 0 : v.status) === 'maintenance' ? '維護中' : (v === null || v === void 0 ? void 0 : v.status) || '未知');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-6 py-4 whitespace-nowrap" },
        });
        if ((_a = __VLS_ctx.ml.batteries) === null || _a === void 0 ? void 0 : _a.find(b => (b === null || b === void 0 ? void 0 : b.id) === String(v === null || v === void 0 ? void 0 : v.id))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-center" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "w-16 bg-gray-200 rounded-full h-2 mr-2" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "h-2 rounded-full transition-all" },
                ...{ class: (Number((_b = __VLS_ctx.ml.batteries.find(b => (b === null || b === void 0 ? void 0 : b.id) === String(v === null || v === void 0 ? void 0 : v.id))) === null || _b === void 0 ? void 0 : _b.health) >= 80 ? 'bg-green-500' :
                        Number((_c = __VLS_ctx.ml.batteries.find(b => (b === null || b === void 0 ? void 0 : b.id) === String(v === null || v === void 0 ? void 0 : v.id))) === null || _c === void 0 ? void 0 : _c.health) >= 60 ? 'bg-yellow-500' : 'bg-red-500') },
                ...{ style: ({ width: `${Math.max(0, Math.min(100, Number((_d = __VLS_ctx.ml.batteries.find(b => (b === null || b === void 0 ? void 0 : b.id) === String(v === null || v === void 0 ? void 0 : v.id))) === null || _d === void 0 ? void 0 : _d.health) || 0))}%` }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "text-sm font-medium text-gray-900" },
            });
            (Number(((_e = __VLS_ctx.ml.batteries.find(b => (b === null || b === void 0 ? void 0 : b.id) === String(v === null || v === void 0 ? void 0 : v.id))) === null || _e === void 0 ? void 0 : _e.health) || 0).toFixed(1));
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "text-sm text-gray-500" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-6 py-4 whitespace-nowrap" },
        });
        if ((_f = __VLS_ctx.ml.batteries) === null || _f === void 0 ? void 0 : _f.find(b => (b === null || b === void 0 ? void 0 : b.id) === String(v === null || v === void 0 ? void 0 : v.id))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "inline-flex px-2 py-1 text-xs font-semibold rounded-full" },
                ...{ class: (Number(((_g = __VLS_ctx.ml.batteries.find(b => (b === null || b === void 0 ? void 0 : b.id) === String(v === null || v === void 0 ? void 0 : v.id))) === null || _g === void 0 ? void 0 : _g.faultP) || 0) < 0.1 ? 'bg-green-100 text-green-800' :
                        Number(((_h = __VLS_ctx.ml.batteries.find(b => (b === null || b === void 0 ? void 0 : b.id) === String(v === null || v === void 0 ? void 0 : v.id))) === null || _h === void 0 ? void 0 : _h.faultP) || 0) < 0.3 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800') },
            });
            ((Number(((_j = __VLS_ctx.ml.batteries.find(b => (b === null || b === void 0 ? void 0 : b.id) === String(v === null || v === void 0 ? void 0 : v.id))) === null || _j === void 0 ? void 0 : _j.faultP) || 0) * 100).toFixed(1));
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "text-sm text-gray-500" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-6 py-4 whitespace-nowrap" },
        });
        if (v && ((_k = __VLS_ctx.result[String(v.id)]) === null || _k === void 0 ? void 0 : _k.nextCharge)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "inline-flex px-2 py-1 text-xs font-semibold rounded-full" },
                ...{ class: (__VLS_ctx.result[String(v.id)].nextCharge === '立即充電' ? 'bg-red-100 text-red-800' :
                        __VLS_ctx.result[String(v.id)].nextCharge === '建議充電' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800') },
            });
            (__VLS_ctx.result[String(v.id)].nextCharge);
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "text-sm text-gray-500" },
            });
            (__VLS_ctx.ml.loading ? '...' : '—');
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium" },
        });
        if ((v === null || v === void 0 ? void 0 : v.status) === 'in-use') {
            (v && ((_l = __VLS_ctx.result[String(v.id)]) === null || _l === void 0 ? void 0 : _l.cadence) != null ? Number(__VLS_ctx.result[String(v.id)].cadence).toFixed(2) : (__VLS_ctx.ml.loading ? '...' : '—'));
            if (v && ((_m = __VLS_ctx.result[String(v.id)]) === null || _m === void 0 ? void 0 : _m.cadence) != null) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "text-xs text-gray-500" },
                });
            }
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "text-sm text-gray-400" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium" },
        });
        if ((v === null || v === void 0 ? void 0 : v.status) === 'in-use') {
            ((_p = (v && ((_o = __VLS_ctx.result[String(v.id)]) === null || _o === void 0 ? void 0 : _o.gearRatio))) !== null && _p !== void 0 ? _p : (__VLS_ctx.ml.loading ? '...' : '—'));
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "text-sm text-gray-400" },
            });
        }
    }
    if (!__VLS_ctx.hasResult) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "py-12 text-center" },
        });
        if (__VLS_ctx.ml.loading) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex flex-col items-center gap-3 text-gray-600" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
                ...{ class: "i-ph-spinner w-8 h-8 animate-spin text-blue-600" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "text-gray-500" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
                ...{ class: "i-ph-chart-line w-12 h-12 mx-auto mb-3 text-gray-300" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-sm text-gray-400 mt-1" },
            });
        }
    }
    if (__VLS_ctx.ml.errMsg) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "bg-red-50 border border-red-200 rounded-lg p-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center gap-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-warning-circle w-6 h-6 text-red-500" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            ...{ class: "font-medium text-red-900" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm text-red-700 mt-1" },
        });
        (__VLS_ctx.ml.errMsg);
    }
    /** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-6xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
    /** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['i-ph-magnifying-glass']} */ ;
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['left-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
    /** @type {__VLS_StyleScopedClasses['transform']} */ ;
    /** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['pl-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['i-ph-check-square']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
    /** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['i-ph-x-square']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
    /** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['xl:grid-cols-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-h-96']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:border-blue-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['i-ph-bicycle']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-blue-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:bg-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['i-ph-spinner']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
    /** @type {__VLS_StyleScopedClasses['i-ph-play']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['i-ph-caret-up-down']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-30']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['i-ph-caret-up-down']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-30']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['i-ph-caret-up-down']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-30']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['i-ph-caret-up-down']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-30']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['i-ph-caret-up-down']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-30']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['i-ph-caret-up-down']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-30']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['i-ph-caret-up-down']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-30']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['i-ph-spinner']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['i-ph-chart-line']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-red-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-red-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['i-ph-warning-circle']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-900']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    var __VLS_dollars;
    const __VLS_self = (await import('vue')).defineComponent({
        setup() {
            return {
                vStore: vStore,
                ml: ml,
                usingRealData: usingRealData,
                result: result,
                selectedIds: selectedIds,
                search: search,
                sortConfig: sortConfig,
                viewVehicles: viewVehicles,
                filteredOptions: filteredOptions,
                selectedRows: selectedRows,
                handleSort: handleSort,
                shortId: shortId,
                runPredict: runPredict,
                refreshData: refreshData,
                hasResult: hasResult,
            };
        },
        methods: {
            onPasteTelemetry(raw) {
                try {
                    const obj = JSON.parse(raw);
                    this.telemetry.value = obj;
                }
                catch (_a) {
                    this.telemetry.value = null;
                }
            }
        }
    });
    return (await import('vue')).defineComponent({
        setup() {
            return {};
        },
        methods: {
            onPasteTelemetry(raw) {
                try {
                    const obj = JSON.parse(raw);
                    this.telemetry.value = obj;
                }
                catch (_a) {
                    this.telemetry.value = null;
                }
            }
        }
    });
})(); /* PartiallyEnd: #4569/main.vue */
