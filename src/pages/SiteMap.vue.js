import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { use } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useSites } from '@/stores/sites';
import { useVehicles } from '@/stores/vehicles';
import { useBikeMeta } from '@/stores/bikeMeta';
import { useAlerts } from '@/stores/alerts';
import { useReturns } from '@/stores/returns';
import { useRentals } from '@/stores/rentals';
import MapLibreMap from '@/components/map/MapLibreMap.vue';
import RentDialog from '@/components/rent/RentDialog.vue';
import RentSuccessDialog from '@/components/rent/RentSuccessDialog.vue';
import SimpleReturnDialog from '@/components/returns/SimpleReturnDialog.vue';
import VehicleTraceFilter from '@/components/filters/VehicleTraceFilter.vue';
import VehicleFilter from '@/components/filters/VehicleFilter.vue';
import { useAuth } from '@/stores/auth';
import { http } from '@/lib/api';
// ECharts 註冊
use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);
// Stores
const sitesStore = useSites();
const vehiclesStore = useVehicles();
const bikeMeta = useBikeMeta();
const alertsStore = useAlerts();
const returnsStore = useReturns();
const rentalsStore = useRentals();
const auth = useAuth();
// 權限控制
const canViewHistory = computed(() => {
    var _a;
    const role = (_a = auth.user) === null || _a === void 0 ? void 0 : _a.roleId;
    return role === 'admin' || role === 'staff';
});
// 監聽權限變化，如果沒有權限查看歷史，自動切換到即時模式
watch(canViewHistory, (hasPermission) => {
    if (!hasPermission && displayMode.value === 'history') {
        displayMode.value = 'realtime';
    }
});
// 響應式狀態
const showSetupGuide = ref(false);
const showSeedGuide = ref(false);
const showReturnModal = ref(false);
const showRentModal = ref(false);
const recentReturns = ref([]);
// 新的響應式狀態
const selectedDomain = ref('huali');
const displayMode = ref('realtime');
const selectedItem = ref(null);
const highlightedVehicle = ref(null);
const searchQuery = ref('');
const defaultEndTime = formatDateToLocalHour(new Date());
const defaultStartTime = formatDateToLocalHour(new Date(Date.now() - 24 * 60 * 60 * 1000));
const timeRange = ref({
    start: defaultStartTime,
    end: defaultEndTime
});
const hourOptions = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const startDate = computed({
    get: () => extractDatePart(timeRange.value.start),
    set: (value) => {
        updateTimeRange('start', value, extractHourPart(timeRange.value.start));
    }
});
const startHour = computed({
    get: () => extractHourPart(timeRange.value.start),
    set: (value) => {
        updateTimeRange('start', extractDatePart(timeRange.value.start), value);
    }
});
const endDate = computed({
    get: () => extractDatePart(timeRange.value.end),
    set: (value) => {
        updateTimeRange('end', value, extractHourPart(timeRange.value.end));
    }
});
const endHour = computed({
    get: () => extractHourPart(timeRange.value.end),
    set: (value) => {
        updateTimeRange('end', extractDatePart(timeRange.value.end), value);
    }
});
const selectedVehicle = ref(null);
// 軌跡過濾相關狀態
const selectedTraceVehicles = ref([]);
const filteredVehicleTraces = ref({});
// 即時車輛過濾相關狀態
const selectedRealtimeVehicles = ref([]);
// 區分「未套用選擇（顯示全部）」與「已套用選擇但為空（顯示無資料）」
const selectionApplied = ref(false);
const realtimeVehicles = ref([]);
const showRentDialog = ref(false);
const selectedVehicleForRent = ref(null);
const showReturnDialog = ref(false);
const selectedReturnVehicle = ref(null);
// 成功通知相關
const showSuccessNotification = ref(false);
const successMessage = ref('');
const showRentSuccessDialog = ref(false);
const currentRental = ref(null);
const routeTraceMeta = ref({});
const historyLoading = ref(false);
const historyError = ref(null);
const historyPagination = ref({
    count: 0,
    next: null,
    previous: null
});
let historyRequestToken = 0;
const seedMockEnabled = computed(() => import.meta.env.VITE_SEED_MOCK === '1');
function formatDateToLocalHour(date) {
    const localDate = new Date(date.getTime());
    localDate.setMinutes(0, 0, 0);
    const year = localDate.getFullYear();
    const month = `${localDate.getMonth() + 1}`.padStart(2, '0');
    const day = `${localDate.getDate()}`.padStart(2, '0');
    const hour = `${localDate.getHours()}`.padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:00`;
}
function extractDatePart(value) {
    if (!value || !value.includes('T'))
        return (value === null || value === void 0 ? void 0 : value.slice(0, 10)) || '';
    return value.split('T')[0];
}
function extractHourPart(value) {
    if (!value || !value.includes('T'))
        return '00';
    const timeSegment = value.split('T')[1] || '00:00';
    return timeSegment.slice(0, 2);
}
function normalizeHour(value) {
    const parsed = Number.parseInt(value !== null && value !== void 0 ? value : '', 10);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed < 24) {
        return String(parsed).padStart(2, '0');
    }
    return '00';
}
function composeLocalIso(date, hour) {
    const safeDate = date || '';
    if (!safeDate)
        return '';
    const normalizedHour = normalizeHour(hour);
    return `${safeDate}T${normalizedHour}:00`;
}
function updateTimeRange(edge, date, hour) {
    if (!date) {
        return;
    }
    const nextValue = composeLocalIso(date, hour);
    if (!nextValue) {
        return;
    }
    timeRange.value = {
        ...timeRange.value,
        [edge]: nextValue
    };
}
function toUtcIso(value) {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed.toISOString();
}
function formatRouteTime(iso) {
    if (!iso) {
        return '時間未知';
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return '時間未知';
    }
    return date.toLocaleString('zh-TW', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}
function formatDistance(meters) {
    if (typeof meters !== 'number' || Number.isNaN(meters)) {
        return '—';
    }
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
}
// 已移除 mock 車輛資料，改用真實 API 資料 (realtimeVehicles)
// 軌跡資料將從真實 API 載入，暫時設為空
/*
const mockVehicleTraces = computed(() => ({
  'BIKE001': [
    // 花蓮火車站 → 東大門夜市 → 返回
    { lat: 23.9917, lon: 121.6014, timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() }, // 1小時前出發
    { lat: 23.9870, lon: 121.6035, timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString() },
    { lat: 23.9820, lon: 121.6050, timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString() },
    { lat: 23.9750, lon: 121.6060, timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString() }, // 到達夜市
    { lat: 23.9800, lon: 121.6040, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { lat: 23.9880, lon: 121.6025, timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { lat: 23.9917, lon: 121.6014, timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() }  // 返回火車站
  ],
  'BIKE002': [
    // 東大門夜市 → 花蓮港 → 海洋公園
    { lat: 23.9750, lon: 121.6060, timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString() }, // 1.5小時前出發
    { lat: 23.9745, lon: 121.6100, timestamp: new Date(Date.now() - 80 * 60 * 1000).toISOString() },
    { lat: 23.9740, lon: 121.6150, timestamp: new Date(Date.now() - 70 * 60 * 1000).toISOString() },
    { lat: 23.9739, lon: 121.6175, timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() }, // 到達花蓮港
    { lat: 23.9500, lon: 121.6170, timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
    { lat: 23.9200, lon: 121.6172, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { lat: 23.8979, lon: 121.6172, timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() }   // 到達海洋公園
  ],
  'BIKE003': [
    // 花蓮港 → 縣政府 → 美崙山公園
    { lat: 23.9739, lon: 121.6175, timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString() }, // 2小時前出發
    { lat: 23.9750, lon: 121.6120, timestamp: new Date(Date.now() - 100 * 60 * 1000).toISOString() },
    { lat: 23.9800, lon: 121.6080, timestamp: new Date(Date.now() - 80 * 60 * 1000).toISOString() },
    { lat: 23.9847, lon: 121.6064, timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() },  // 到達縣政府
    { lat: 23.9800, lon: 121.6050, timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
    { lat: 23.9730, lon: 121.6035, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { lat: 23.9709, lon: 121.6028, timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() }   // 到達美崙山公園
  ],
  'BIKE004': [
    // 海洋公園沿海岸移動
    { lat: 23.8979, lon: 121.6172, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() }, // 30分鐘前
    { lat: 23.8990, lon: 121.6175, timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
    { lat: 23.9000, lon: 121.6170, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { lat: 23.8985, lon: 121.6173, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
    { lat: 23.8979, lon: 121.6172, timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString() }   // 返回原點
  ],
  'BIKE005': [
    // 縣政府周邊移動
    { lat: 23.9847, lon: 121.6064, timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() }, // 45分鐘前
    { lat: 23.9850, lon: 121.6070, timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
    { lat: 23.9845, lon: 121.6060, timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString() },
    { lat: 23.9847, lon: 121.6064, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() }  // 停在縣政府
  ],
  'BIKE006': [
    // 中華紙漿 → 火車站 → 松園別館
    { lat: 23.9739, lon: 121.5994, timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString() }, // 1.25小時前
    { lat: 23.9800, lon: 121.6000, timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    { lat: 23.9880, lon: 121.6010, timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    { lat: 23.9917, lon: 121.6014, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() }, // 經過火車站
    { lat: 23.9850, lon: 121.6050, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
    { lat: 23.9853, lon: 121.6097, timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() }   // 到達松園別館
  ],
  'BIKE007': [
    // 美崙山公園 → 慈濟醫院 → 曼波海灘
    { lat: 23.9709, lon: 121.6028, timestamp: new Date(Date.now() - 100 * 60 * 1000).toISOString() }, // 100分鐘前
    { lat: 23.9750, lon: 121.6010, timestamp: new Date(Date.now() - 80 * 60 * 1000).toISOString() },
    { lat: 23.9780, lon: 121.6000, timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    { lat: 23.9786, lon: 121.5996, timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString() }, // 到達慈濟醫院
    { lat: 23.9760, lon: 121.6050, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { lat: 23.9750, lon: 121.6120, timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { lat: 23.9750, lon: 121.6150, timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString() }   // 到達曼波海灘
  ],
  'BIKE008': [
    // 慈濟醫院 → 創意文化園區 → 火車站
    { lat: 23.9786, lon: 121.5996, timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() }, // 1小時前
    { lat: 23.9750, lon: 121.6020, timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    { lat: 23.9720, lon: 121.6060, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { lat: 23.9715, lon: 121.6080, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() }, // 到達文化園區
    { lat: 23.9850, lon: 121.6050, timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { lat: 23.9917, lon: 121.6014, timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString() }   // 到達火車站
  ],
  'BIKE009': [
    // 市公所 → 東大門夜市 → 文化園區
    { lat: 23.9847, lon: 121.6064, timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString() },
    { lat: 23.9800, lon: 121.6060, timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
    { lat: 23.9750, lon: 121.6060, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() }, // 夜市
    { lat: 23.9720, lon: 121.6070, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { lat: 23.9715, lon: 121.6080, timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString() }  // 文化園區
  ],
  'BIKE010': [
    // 松園別館沿海移動
    { lat: 23.9853, lon: 121.6097, timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString() },
    { lat: 23.9850, lon: 121.6120, timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
    { lat: 23.9855, lon: 121.6110, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
    { lat: 23.9853, lon: 121.6097, timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString() }
  ],
  'BIKE011': [
    // 曼波海灘沿海岸線
    { lat: 23.9750, lon: 121.6150, timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
    { lat: 23.9745, lon: 121.6155, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
    { lat: 23.9755, lon: 121.6145, timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
    { lat: 23.9750, lon: 121.6150, timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString() }
  ],
  'BIKE012': [
    // 創意文化園區內移動
    { lat: 23.9715, lon: 121.6080, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { lat: 23.9720, lon: 121.6085, timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
    { lat: 23.9710, lon: 121.6075, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { lat: 23.9715, lon: 121.6080, timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString() }
  ]
}))
*/
// 計算車輛分布的中心點和最佳縮放級別
const mapCenter = computed(() => {
    if (displayMode.value === 'history') {
        const tracesData = filteredVehicleTraces.value || {};
        const traces = selectedTraceVehicles.value.length
            ? selectedTraceVehicles.value.map(id => tracesData[id]).filter(Boolean)
            : Object.values(tracesData);
        const points = traces.flat().filter(point => typeof (point === null || point === void 0 ? void 0 : point.lat) === 'number' && typeof (point === null || point === void 0 ? void 0 : point.lon) === 'number');
        if (points.length > 0) {
            const lats = points.map(point => point.lat);
            const lngs = points.map(point => point.lon);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            const centerLat = (minLat + maxLat) / 2;
            const centerLng = (minLng + maxLng) / 2;
            const latDiff = maxLat - minLat;
            const lngDiff = maxLng - minLng;
            const maxDiff = Math.max(latDiff, lngDiff);
            let zoom = 13;
            if (maxDiff > 0.1)
                zoom = 10;
            else if (maxDiff > 0.05)
                zoom = 11;
            else if (maxDiff > 0.02)
                zoom = 12;
            else if (maxDiff > 0.01)
                zoom = 13;
            else
                zoom = 14;
            return { lat: centerLat, lng: centerLng, zoom };
        }
    }
    const vehicles = realtimeVehicles.value;
    if (vehicles.length === 0) {
        return { lat: 23.9739, lng: 121.6014, zoom: 12 };
    }
    const lats = vehicles.map((v) => { var _a; return v.lat || ((_a = v.location) === null || _a === void 0 ? void 0 : _a.lat); }).filter(Boolean);
    const lngs = vehicles.map((v) => { var _a; return v.lon || ((_a = v.location) === null || _a === void 0 ? void 0 : _a.lng); }).filter(Boolean);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    let zoom = 13;
    if (maxDiff > 0.1)
        zoom = 10;
    else if (maxDiff > 0.05)
        zoom = 11;
    else if (maxDiff > 0.02)
        zoom = 12;
    else if (maxDiff > 0.01)
        zoom = 13;
    else
        zoom = 14;
    return {
        lat: centerLat,
        lng: centerLng,
        zoom
    };
});
// 軌跡過濾相關計算屬性
const availableTraceVehicles = computed(() => {
    const traces = filteredVehicleTraces.value || {};
    const vehicleColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return Object.entries(traces).map(([vehicleId, trace], index) => {
        var _a;
        return ({
            id: vehicleId,
            label: (_a = routeTraceMeta.value[vehicleId]) === null || _a === void 0 ? void 0 : _a.label,
            color: vehicleColors[index % vehicleColors.length],
            pointCount: trace.length
        });
    });
});
const filteredTraces = computed(() => {
    const traces = filteredVehicleTraces.value || {};
    if (selectedTraceVehicles.value.length === 0) {
        return traces;
    }
    const filtered = {};
    selectedTraceVehicles.value.forEach(vehicleId => {
        if (traces[vehicleId]) {
            filtered[vehicleId] = traces[vehicleId];
        }
    });
    return filtered;
});
const historyRoutes = computed(() => {
    return Object.entries(filteredTraces.value)
        .map(([traceId, trace]) => {
        var _a, _b, _c, _d;
        return ({
            id: traceId,
            label: ((_a = routeTraceMeta.value[traceId]) === null || _a === void 0 ? void 0 : _a.label) || traceId,
            createdAt: (_b = routeTraceMeta.value[traceId]) === null || _b === void 0 ? void 0 : _b.createdAt,
            distanceMeters: (_c = routeTraceMeta.value[traceId]) === null || _c === void 0 ? void 0 : _c.distanceMeters,
            averageConfidence: (_d = routeTraceMeta.value[traceId]) === null || _d === void 0 ? void 0 : _d.averageConfidence,
            pointCount: trace.length
        });
    })
        .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
    });
});
// 即時車輛過濾邏輯
const filteredRealtimeVehicles = computed(() => {
    var _a, _b, _c, _d;
    let list = realtimeVehicles.value;
    // 權限濾除：member 不顯示使用中
    const role = (_a = auth.user) === null || _a === void 0 ? void 0 : _a.roleId;
    if (role !== 'admin' && role !== 'staff') {
        const currentUserId = (_b = auth.user) === null || _b === void 0 ? void 0 : _b.id;
        const currentUserEmail = ((_d = (_c = auth.user) === null || _c === void 0 ? void 0 : _c.email) === null || _d === void 0 ? void 0 : _d.toLowerCase()) || '';
        list = list.filter((v) => {
            const status = v.status || '';
            if (status === '使用中' || status === 'in-use') {
                const member = v.currentMember || {};
                const memberId = member.id != null ? String(member.id) : null;
                const memberEmail = (member.email || member.memberEmail || '').toLowerCase();
                if (memberId && currentUserId && memberId === String(currentUserId))
                    return true;
                if (memberEmail && currentUserEmail && memberEmail === currentUserEmail)
                    return true;
                return false;
            }
            return true;
        });
    }
    // （移除頁面級狀態過濾，統一由右側 VehicleFilter 控制）
    // 搜尋過濾（上方搜尋框）
    if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter(v => String(v.id).toLowerCase().includes(q) || String(v.name || '').toLowerCase().includes(q));
    }
    // 清單選取（右側 VehicleFilter）
    if (selectionApplied.value) {
        if (selectedRealtimeVehicles.value.length === 0) {
            return []; // 明確「全部取消選擇」時顯示空
        }
        const picked = new Set(selectedRealtimeVehicles.value.map(String));
        list = list.filter(v => picked.has(String(v.id)));
    }
    return list;
});
// 供右側 VehicleFilter 顯示的候選清單（受上方搜尋與角色限制影響）
const availableVehiclesForFilter = computed(() => {
    var _a, _b, _c, _d;
    let list = realtimeVehicles.value;
    // 角色限制：member 不顯示使用中（但保留自己的租借中車輛）
    const role = (_a = auth.user) === null || _a === void 0 ? void 0 : _a.roleId;
    if (role !== 'admin' && role !== 'staff') {
        const currentUserId = (_b = auth.user) === null || _b === void 0 ? void 0 : _b.id;
        const currentUserEmail = ((_d = (_c = auth.user) === null || _c === void 0 ? void 0 : _c.email) === null || _d === void 0 ? void 0 : _d.toLowerCase()) || '';
        list = list.filter(v => {
            if (v.status === '使用中' || v.status === 'in-use') {
                const member = v.currentMember || {};
                const memberId = member.id != null ? String(member.id) : null;
                const memberEmail = (member.email || member.memberEmail || '').toLowerCase();
                if (memberId && currentUserId && memberId === String(currentUserId))
                    return true;
                if (memberEmail && currentUserEmail && memberEmail === currentUserEmail)
                    return true;
                return false;
            }
            return true;
        });
    }
    // 上方搜尋框
    if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter(v => String(v.id).toLowerCase().includes(q) || String(v.name || '').toLowerCase().includes(q));
    }
    return list;
});
// 監聽右側清單的變化以標記 selectionApplied
watch(selectedRealtimeVehicles, () => {
    selectionApplied.value = true;
});
watch(timeRange, () => {
    if (displayMode.value === 'history') {
        loadHistoryTrajectories();
    }
}, { deep: true });
watch(selectedDomain, () => {
    if (displayMode.value === 'history') {
        loadHistoryTrajectories();
    }
});
// 計算屬性
const totalVehicles = computed(() => {
    if (displayMode.value === 'realtime') {
        return realtimeVehicles.value.length;
    }
    return sitesStore.filteredSites.reduce((sum, site) => sum + site.vehicleCount, 0);
});
const availableVehicles = computed(() => {
    if (displayMode.value === 'realtime') {
        return realtimeVehicles.value.filter((v) => v.status === 'available' || v.status === '可租借').length;
    }
    return sitesStore.filteredSites.reduce((sum, site) => sum + site.availableCount, 0);
});
const siteVehicles = computed(() => {
    if (!sitesStore.selected)
        return [];
    return vehiclesStore.getVehiclesBySite(sitesStore.selected.id);
});
const recentAlerts = computed(() => {
    if (!sitesStore.selected)
        return [];
    return alertsStore.getRecentAlertsBySite(sitesStore.selected.id, 5);
});
// 圖表配置
const chartTheme = 'light';
const chartOption = computed(() => ({
    grid: { top: 20, right: 20, bottom: 20, left: 40 },
    xAxis: {
        type: 'category',
        data: ['華麗轉身', '順其自然'],
        axisLine: { show: false },
        axisTick: { show: false }
    },
    yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f3f4f6' } }
    },
    series: [{
            data: [
                sitesStore.filteredSites.filter(s => s.brand === 'huali').length,
                sitesStore.filteredSites.filter(s => s.brand === 'shunqi').length
            ],
            type: 'bar',
            itemStyle: { color: '#6366f1' },
            barWidth: '40%'
        }]
}));
// 工具函式
function getStatusBadgeClass(status) {
    const statusClasses = {
        '可租借': 'bg-green-100 text-green-800',
        '使用中': 'bg-blue-100 text-blue-800',
        '離線': 'bg-gray-100 text-gray-800',
        '維修': 'bg-yellow-100 text-yellow-800',
        '低電量': 'bg-red-100 text-red-800',
        // 兼容舊狀態
        'available': 'bg-green-100 text-green-800',
        'in-use': 'bg-blue-100 text-blue-800',
        'rented': 'bg-purple-100 text-purple-800',
        'maintenance': 'bg-yellow-100 text-yellow-800',
        'charging': 'bg-cyan-100 text-cyan-800',
        'low-battery': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
}
function getRelativeTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1)
        return '剛剛';
    if (diffMins < 60)
        return `${diffMins}分鐘前`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
        return `${diffHours}小時前`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}天前`;
}
function selectVehicle(vehicle) {
    selectedItem.value = vehicle;
    highlightedVehicle.value = vehicle.id;
    // TODO: 高亮地圖上的車輛位置並居中
}
function focusTrace(traceId) {
    const traces = filteredVehicleTraces.value || {};
    if (!traces[traceId]) {
        return;
    }
    // 如果當前只選中了這個 traceId，則取消選取（顯示全部）
    if (selectedTraceVehicles.value.length === 1 && selectedTraceVehicles.value[0] === traceId) {
        // 恢復顯示所有軌跡
        selectedTraceVehicles.value = Object.keys(traces);
    }
    else {
        // 否則只選中這個 traceId
        selectedTraceVehicles.value = [traceId];
        // 計算該路線的中心點並縮放地圖
        const tracePoints = traces[traceId];
        if (tracePoints && tracePoints.length > 0) {
            const validPoints = tracePoints.filter(point => typeof (point === null || point === void 0 ? void 0 : point.lat) === 'number' && typeof (point === null || point === void 0 ? void 0 : point.lon) === 'number');
            if (validPoints.length > 0) {
                const lats = validPoints.map(p => p.lat);
                const lngs = validPoints.map(p => p.lon);
                const minLat = Math.min(...lats);
                const maxLat = Math.max(...lats);
                const minLng = Math.min(...lngs);
                const maxLng = Math.max(...lngs);
                // 計算適當的縮放級別
                const latDiff = maxLat - minLat;
                const lngDiff = maxLng - minLng;
                const maxDiff = Math.max(latDiff, lngDiff);
                let zoom = 14;
                if (maxDiff > 0.1)
                    zoom = 11;
                else if (maxDiff > 0.05)
                    zoom = 12;
                else if (maxDiff > 0.02)
                    zoom = 13;
                else if (maxDiff > 0.01)
                    zoom = 14;
                else
                    zoom = 15;
                // 觸發地圖中心更新
                selectedItem.value = {
                    type: 'trace',
                    id: traceId,
                    center: {
                        lat: (minLat + maxLat) / 2,
                        lng: (minLng + maxLng) / 2,
                        zoom: zoom
                    }
                };
            }
        }
    }
}
function getStatusText(status) {
    const texts = {
        '可租借': '可租借',
        '使用中': '使用中',
        '離線': '離線',
        '維修': '維修中',
        '低電量': '低電量',
        // 兼容舊狀態
        active: '正常運行',
        maintenance: '維修中',
        offline: '離線',
        available: '可用',
        rented: '租借中',
        charging: '充電中'
    };
    return texts[status] || status;
}
function getBrandText(brand) {
    return brand === 'huali' ? '華麗轉身' : '順騎自然';
}
function getAlertColor(severity) {
    const colors = {
        info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
        error: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
        critical: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
    };
    return colors[severity] || colors.info;
}
function getBatteryColor(level) {
    if (level > 70)
        return '#10b981'; // green
    if (level > 30)
        return '#f59e0b'; // yellow
    return '#ef4444'; // red
}
function formatTime(dateString) {
    return new Date(dateString).toLocaleString('zh-TW');
}
async function handleDomainChange() {
    // 根據選擇的場域篩選資料
    console.log('場域切換至:', selectedDomain.value);
    // TODO: 根據場域更新地圖上的車輛標記
    await loadVehiclesByDomain();
}
async function handleDisplayModeChange() {
    console.log('顯示模式切換至:', displayMode.value);
    if (displayMode.value === 'history') {
        // 載入歷史軌跡資料
        await loadHistoryTrajectories();
    }
    else {
        // 載入即時位置資料
        await loadRealtimePositions();
    }
}
async function loadVehiclesByDomain() {
    // 根據選擇的場域載入車輛資料
    try {
        console.log(`載入場域 ${selectedDomain.value} 的車輛資料`);
        // TODO: 呼叫 API 載入特定場域的車輛資料
    }
    catch (error) {
        console.error('載入車輛資料失敗:', error);
    }
}
async function loadHistoryTrajectories() {
    var _a;
    const requestId = ++historyRequestToken;
    historyLoading.value = true;
    historyError.value = null;
    try {
        const startIso = toUtcIso(timeRange.value.start);
        const endIso = toUtcIso(timeRange.value.end);
        let effectiveStart = startIso;
        let effectiveEnd = endIso;
        if (effectiveStart && effectiveEnd) {
            const startDate = new Date(effectiveStart);
            const endDate = new Date(effectiveEnd);
            if (startDate > endDate) {
                effectiveStart = endIso;
                effectiveEnd = startIso;
            }
        }
        const params = new URLSearchParams({ limit: '20' });
        if (effectiveStart)
            params.set('created_at__gte', effectiveStart);
        if (effectiveEnd)
            params.set('created_at__lte', effectiveEnd);
        if (selectedDomain.value)
            params.set('domain', selectedDomain.value);
        const query = params.toString();
        const response = await http.get(`/api/statistic/routes/${query ? `?${query}` : ''}`);
        const dataSection = (_a = response === null || response === void 0 ? void 0 : response.data) !== null && _a !== void 0 ? _a : {};
        let entries = [];
        if (Array.isArray(dataSection === null || dataSection === void 0 ? void 0 : dataSection.results)) {
            entries = dataSection.results;
        }
        else if (Array.isArray(dataSection)) {
            entries = dataSection;
        }
        else if (Array.isArray(response === null || response === void 0 ? void 0 : response.results)) {
            entries = response.results;
        }
        const traces = {};
        const meta = {};
        entries.forEach((entry, memberIndex) => {
            var _a;
            const member = (entry === null || entry === void 0 ? void 0 : entry.member) || {};
            const memberId = (_a = member === null || member === void 0 ? void 0 : member.id) !== null && _a !== void 0 ? _a : memberIndex + 1;
            const memberName = (member === null || member === void 0 ? void 0 : member.full_name) || `會員 #${memberId}`;
            const routes = Array.isArray(entry === null || entry === void 0 ? void 0 : entry.routes) ? entry.routes : [];
            routes.forEach((route, routeIndex) => {
                var _a;
                const routeIdPart = (route === null || route === void 0 ? void 0 : route.id) != null ? String(route.id) : `${routeIndex + 1}`;
                const traceId = `member-${memberId}-route-${routeIdPart}`;
                const coordinates = Array.isArray((_a = route === null || route === void 0 ? void 0 : route.geometry) === null || _a === void 0 ? void 0 : _a.coordinates) ? route.geometry.coordinates : [];
                const points = coordinates
                    .map((coord) => {
                    if (!Array.isArray(coord) || coord.length < 2)
                        return null;
                    const [lon, lat] = coord;
                    if (typeof lat !== 'number' || typeof lon !== 'number')
                        return null;
                    return {
                        lat,
                        lon,
                        timestamp: (route === null || route === void 0 ? void 0 : route.created_at) || endIso || startIso || new Date().toISOString()
                    };
                })
                    .filter((point) => Boolean(point));
                if (points.length < 2)
                    return;
                traces[traceId] = points;
                meta[traceId] = {
                    label: `${memberName} · #${routeIdPart}`,
                    createdAt: route === null || route === void 0 ? void 0 : route.created_at,
                    distanceMeters: route === null || route === void 0 ? void 0 : route.distance_meters,
                    averageConfidence: route === null || route === void 0 ? void 0 : route.average_confidence,
                    memberName
                };
            });
        });
        if (requestId === historyRequestToken) {
            const rawCount = dataSection === null || dataSection === void 0 ? void 0 : dataSection.count;
            const parsedCount = typeof rawCount === 'number'
                ? rawCount
                : (typeof rawCount === 'string' && rawCount.trim() !== '' ? Number(rawCount) : null);
            const count = typeof parsedCount === 'number' && Number.isFinite(parsedCount)
                ? parsedCount
                : entries.length;
            const next = typeof (dataSection === null || dataSection === void 0 ? void 0 : dataSection.next) === 'string' ? dataSection.next : null;
            const previous = typeof (dataSection === null || dataSection === void 0 ? void 0 : dataSection.previous) === 'string' ? dataSection.previous : null;
            historyPagination.value = { count, next, previous };
            filteredVehicleTraces.value = traces;
            routeTraceMeta.value = meta;
            selectedTraceVehicles.value = Object.keys(traces);
        }
    }
    catch (error) {
        console.error('載入軌跡資料失敗:', error);
        if (requestId === historyRequestToken) {
            historyError.value = error instanceof Error ? error.message : String(error);
            filteredVehicleTraces.value = {};
            routeTraceMeta.value = {};
            selectedTraceVehicles.value = [];
            historyPagination.value = { count: 0, next: null, previous: null };
        }
    }
    finally {
        if (requestId === historyRequestToken) {
            historyLoading.value = false;
        }
    }
}
async function loadRealtimePositions() {
    try {
        const { data } = await vehiclesStore.fetchVehiclesPaged({ limit: 200, offset: 0 });
        realtimeVehicles.value = data;
    }
    catch (error) {
        console.error('載入即時位置失敗:', error);
        realtimeVehicles.value = [];
    }
}
function handleMapSelect(id) {
    if (displayMode.value === 'realtime') {
        // 選擇車輛
        const vehicle = realtimeVehicles.value.find((v) => v.id === id);
        if (vehicle) {
            selectedItem.value = vehicle;
        }
    }
    else {
        // 選擇站點
        const site = sitesStore.list.find(s => s.id === id);
        if (site) {
            sitesStore.selected = site;
            selectedItem.value = site;
        }
    }
}
async function handleRentSuccess(rentRecord) {
    // 記錄租借成功
    console.log('車輛租借成功:', rentRecord);
    // 設置租借資訊並顯示成功對話框
    currentRental.value = rentRecord;
    showRentDialog.value = false;
    showRentSuccessDialog.value = true;
    // 重新載入相關資料
    if (displayMode.value === 'realtime') {
        // 即時模式：重新載入即時位置資料
        await loadRealtimePositions();
    }
    else if (sitesStore.selected) {
        // 站點模式：重新載入站點車輛資料
        await Promise.all([
            sitesStore.fetchSites(),
            vehiclesStore.fetchBySite(sitesStore.selected.id)
        ]);
    }
    console.log('[SiteMap] Vehicle data refreshed after successful rental');
}
// 租借相關函數
const LOW_BATTERY_THRESHOLD = 20;
function isLowBattery(vehicle) {
    if (!vehicle)
        return false;
    if (vehicle.status === '低電量' || vehicle.status === 'low-battery')
        return true;
    if (typeof vehicle.batteryPct === 'number') {
        return vehicle.batteryPct < LOW_BATTERY_THRESHOLD;
    }
    return false;
}
function canRentVehicle(vehicle) {
    if (!vehicle)
        return false;
    const blockedStatuses = ['使用中', 'in-use', '租借中', 'rented', '維修', 'maintenance'];
    return !blockedStatuses.includes(vehicle.status);
}
function canReturnVehicle(vehicle) {
    if (!vehicle)
        return false;
    return vehicle.status === '使用中' || vehicle.status === 'in-use';
}
function getRentButtonTooltip(vehicle) {
    if (!vehicle)
        return '';
    if (!canRentVehicle(vehicle)) {
        return vehicle.status === '維修' || vehicle.status === 'maintenance'
            ? '車輛維修中，暫不可租借'
            : '目前無法租借此車輛';
    }
    if (isLowBattery(vehicle)) {
        return '車輛電量偏低，請確認是否仍要租借';
    }
    return '點擊租借車輛';
}
function handleRentVehicle(vehicle) {
    if (!canRentVehicle(vehicle))
        return;
    if (isLowBattery(vehicle)) {
        const proceed = window.confirm('此車輛目前電量偏低，仍要租借嗎？');
        if (!proceed) {
            return;
        }
    }
    selectedVehicleForRent.value = vehicle;
    showRentDialog.value = true;
}
function handleReturnVehicle(vehicle) {
    selectedReturnVehicle.value = vehicle;
    showReturnDialog.value = true;
}
function handleCloseRentDialog() {
    showRentDialog.value = false;
    selectedVehicleForRent.value = null;
}
function handleCloseSuccessDialog() {
    showRentSuccessDialog.value = false;
    currentRental.value = null;
}
function handleCloseReturnDialog() {
    showReturnDialog.value = false;
    selectedReturnVehicle.value = null;
}
async function onReturnSuccess(returnRecord) {
    // 記錄歸還成功
    console.log('車輛歸還成功:', returnRecord);
    // 更新最近歸還記錄
    recentReturns.value.unshift(returnRecord);
    if (recentReturns.value.length > 5) {
        recentReturns.value = recentReturns.value.slice(0, 5);
    }
    // 關閉歸還對話框
    showReturnDialog.value = false;
    selectedReturnVehicle.value = null;
    // 顯示成功對話框
    showSuccessNotification.value = true;
    successMessage.value = `車輛 ${returnRecord.vehicleId} 已成功歸還！`;
    // 1秒後自動刷新頁面
    setTimeout(() => {
        window.location.reload();
    }, 1000);
    // 立即重新載入相關資料
    if (sitesStore.selected) {
        await Promise.all([
            sitesStore.fetchSites(),
            vehiclesStore.fetchBySite(sitesStore.selected.id),
            returnsStore.fetchReturns({ siteId: sitesStore.selected.id, limit: 5 })
        ]);
    }
}
// 生命週期
onMounted(async () => {
    await Promise.all([
        sitesStore.fetchSites(),
        bikeMeta.fetchBikeStatusOptions(),
        loadRealtimePositions()
    ]);
    // 設置自動重新整理即時資料 (每30秒)
    const refreshInterval = setInterval(async () => {
        if (displayMode.value === 'realtime') {
            await loadRealtimePositions();
            console.log('[SiteMap] Auto-refreshed realtime vehicle data');
        }
    }, 30000);
    // 頁面卸載時清除定時器
    onBeforeUnmount(() => {
        clearInterval(refreshInterval);
    });
});
// 監聽選中站點變化
watch(() => sitesStore.selected, async (newSite) => {
    if (newSite) {
        const [vehicles, alerts, returns] = await Promise.all([
            vehiclesStore.fetchBySite(newSite.id),
            alertsStore.fetchBySiteSince(newSite.id),
            returnsStore.fetchRecentReturns(newSite.id, 5)
        ]);
        recentReturns.value = returns;
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex h-screen bg-gray-50" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "flex-1 flex flex-col" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "bg-white shadow-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-10" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center space-x-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center space-x-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "text-sm font-medium text-gray-700" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    ...{ onChange: (__VLS_ctx.handleDomainChange) },
    value: (__VLS_ctx.selectedDomain),
    ...{ class: "px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "huali",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "shunqi",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center space-x-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "text-sm font-medium text-gray-700" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    ...{ onChange: (__VLS_ctx.handleDisplayModeChange) },
    value: (__VLS_ctx.displayMode),
    ...{ class: "px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "realtime",
});
if (__VLS_ctx.canViewHistory) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "history",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center space-x-4" },
});
if (__VLS_ctx.displayMode === 'history') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center space-x-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center space-x-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "text-xs text-gray-500 self-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "date",
        ...{ class: "h-8 px-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" },
    });
    (__VLS_ctx.startDate);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.startHour),
        ...{ class: "h-8 px-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" },
    });
    for (const [hour] of __VLS_getVForSourceType((__VLS_ctx.hourOptions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (hour),
            value: (hour),
        });
        (hour);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-gray-400 self-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center space-x-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "text-xs text-gray-500 self-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "date",
        ...{ class: "h-8 px-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" },
    });
    (__VLS_ctx.endDate);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.endHour),
        ...{ class: "h-8 px-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" },
    });
    for (const [hour] of __VLS_getVForSourceType((__VLS_ctx.hourOptions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (hour),
            value: (hour),
        });
        (hour);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "relative" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.searchQuery),
    type: "text",
    placeholder: "搜尋車輛/編號/標籤",
    ...{ class: "h-8 pl-8 pr-3 border border-gray-300 rounded-md text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
    ...{ class: "i-ph-magnifying-glass absolute left-2.5 top-2 w-4 h-4 text-gray-400" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "h-8 px-4 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex-1 flex overflow-hidden" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex-1 p-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "h-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm" },
});
/** @type {[typeof MapLibreMap, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(MapLibreMap, new MapLibreMap({
    ...{ 'onSelect': {} },
    sites: (__VLS_ctx.displayMode === 'realtime' ? undefined : __VLS_ctx.sitesStore.filteredSites),
    vehicles: (__VLS_ctx.displayMode === 'realtime' ? __VLS_ctx.filteredRealtimeVehicles : undefined),
    vehicleTraces: (__VLS_ctx.displayMode === 'history' ? __VLS_ctx.filteredTraces : undefined),
    selected: (__VLS_ctx.selectedItem),
    displayMode: (__VLS_ctx.displayMode === 'realtime' ? 'vehicles' : (__VLS_ctx.displayMode === 'history' ? 'history' : 'sites')),
    defaultCenter: (__VLS_ctx.mapCenter),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onSelect': {} },
    sites: (__VLS_ctx.displayMode === 'realtime' ? undefined : __VLS_ctx.sitesStore.filteredSites),
    vehicles: (__VLS_ctx.displayMode === 'realtime' ? __VLS_ctx.filteredRealtimeVehicles : undefined),
    vehicleTraces: (__VLS_ctx.displayMode === 'history' ? __VLS_ctx.filteredTraces : undefined),
    selected: (__VLS_ctx.selectedItem),
    displayMode: (__VLS_ctx.displayMode === 'realtime' ? 'vehicles' : (__VLS_ctx.displayMode === 'history' ? 'history' : 'sites')),
    defaultCenter: (__VLS_ctx.mapCenter),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onSelect: (__VLS_ctx.handleMapSelect)
};
var __VLS_2;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "w-96 bg-white border-l border-gray-200 flex flex-col sticky right-0" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "p-4 border-b border-gray-200" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-between mb-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "text-lg font-semibold text-gray-900" },
});
(__VLS_ctx.displayMode === 'history'
    ? `軌跡過濾 (${Object.keys(__VLS_ctx.filteredTraces || {}).length}/${Object.keys(__VLS_ctx.filteredVehicleTraces || {}).length})`
    : `車輛過濾 (${__VLS_ctx.filteredRealtimeVehicles.length}/${__VLS_ctx.totalVehicles})`);
if (__VLS_ctx.displayMode === 'history') {
    /** @type {[typeof VehicleTraceFilter, ]} */ ;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent(VehicleTraceFilter, new VehicleTraceFilter({
        modelValue: (__VLS_ctx.selectedTraceVehicles),
        availableVehicles: (__VLS_ctx.availableTraceVehicles),
    }));
    const __VLS_8 = __VLS_7({
        modelValue: (__VLS_ctx.selectedTraceVehicles),
        availableVehicles: (__VLS_ctx.availableTraceVehicles),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
}
else {
    /** @type {[typeof VehicleFilter, ]} */ ;
    // @ts-ignore
    const __VLS_10 = __VLS_asFunctionalComponent(VehicleFilter, new VehicleFilter({
        modelValue: (__VLS_ctx.selectedRealtimeVehicles),
        availableVehicles: (__VLS_ctx.availableVehiclesForFilter),
    }));
    const __VLS_11 = __VLS_10({
        modelValue: (__VLS_ctx.selectedRealtimeVehicles),
        availableVehicles: (__VLS_ctx.availableVehiclesForFilter),
    }, ...__VLS_functionalComponentArgsRest(__VLS_10));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex-1 overflow-y-auto p-4 space-y-3" },
});
if (__VLS_ctx.displayMode === 'history') {
    if (__VLS_ctx.historyLoading) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center justify-center text-sm text-gray-500" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-spinner mr-2 animate-spin w-4 h-4" },
        });
    }
    else if (__VLS_ctx.historyError) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600" },
        });
        (__VLS_ctx.historyError);
    }
    else if (__VLS_ctx.historyRoutes.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" },
        });
    }
    else {
        for (const [route] of __VLS_getVForSourceType((__VLS_ctx.historyRoutes))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.displayMode === 'history'))
                            return;
                        if (!!(__VLS_ctx.historyLoading))
                            return;
                        if (!!(__VLS_ctx.historyError))
                            return;
                        if (!!(__VLS_ctx.historyRoutes.length === 0))
                            return;
                        __VLS_ctx.focusTrace(route.id);
                    } },
                key: (route.id),
                ...{ class: ({ 'ring-2 ring-indigo-500 bg-indigo-50': __VLS_ctx.selectedTraceVehicles.includes(route.id) }) },
                ...{ class: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-center justify-between mb-2" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
                ...{ class: "font-semibold text-gray-900" },
            });
            (route.label);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "text-xs text-gray-500" },
            });
            (__VLS_ctx.formatRouteTime(route.createdAt));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "grid grid-cols-2 gap-2 text-sm text-gray-600" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-center space-x-1" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
                ...{ class: "i-ph-map-trifold w-4 h-4" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.formatDistance(route.distanceMeters));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-center space-x-1" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
                ...{ class: "i-ph-dots-three-outline w-4 h-4" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (route.pointCount);
            if (route.averageConfidence != null) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "flex items-center space-x-1 col-span-2" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
                    ...{ class: "i-ph-target w-4 h-4" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                ((route.averageConfidence * 100).toFixed(1));
            }
        }
    }
}
else {
    for (const [vehicle] of __VLS_getVForSourceType((__VLS_ctx.filteredRealtimeVehicles))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.displayMode === 'history'))
                        return;
                    __VLS_ctx.selectVehicle(vehicle);
                } },
            key: (vehicle.id),
            ...{ class: ({ 'ring-2 ring-indigo-500 bg-indigo-50': __VLS_ctx.highlightedVehicle === vehicle.id }) },
            ...{ class: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center justify-between mb-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center space-x-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
            ...{ class: "font-semibold text-gray-900" },
        });
        (vehicle.id);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: (__VLS_ctx.getStatusBadgeClass(vehicle.status)) },
            ...{ class: "px-2 py-0.5 rounded-full text-xs font-medium" },
        });
        (__VLS_ctx.getStatusText(vehicle.status));
        if (vehicle.currentMember) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "mb-2 p-2 bg-blue-50 rounded text-sm" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-center space-x-1 text-blue-700" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
                ...{ class: "i-ph-user w-4 h-4" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "font-medium" },
            });
            (vehicle.currentMember.name);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "text-blue-600 text-xs mt-1" },
            });
            (vehicle.currentMember.phone);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center space-x-1" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-gauge w-4 h-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (vehicle.vehicleSpeed || vehicle.speedKph || 0);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center space-x-1" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-battery-high w-4 h-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (vehicle.batteryPct);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center space-x-1" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-map-pin w-4 h-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (vehicle.lat.toFixed(6));
        (vehicle.lon.toFixed(6));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center space-x-1" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-clock w-4 h-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.getRelativeTime(vehicle.lastSeen || new Date().toISOString()));
        if ((vehicle.status === '使用中' || vehicle.status === 'in-use') && vehicle.currentMember && vehicle.currentMember.name) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "mb-3" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-center space-x-1 text-sm text-blue-700" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
                ...{ class: "i-ph-user w-4 h-4" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (vehicle.currentMember.name);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex justify-end" },
        });
        if (__VLS_ctx.canRentVehicle(vehicle)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.displayMode === 'history'))
                            return;
                        if (!(__VLS_ctx.canRentVehicle(vehicle)))
                            return;
                        __VLS_ctx.handleRentVehicle(vehicle);
                    } },
                title: (__VLS_ctx.getRentButtonTooltip(vehicle)),
                ...{ class: "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-700" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
                ...{ class: "i-ph-key w-4 h-4 mr-1" },
            });
        }
        else if (__VLS_ctx.canReturnVehicle(vehicle)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.displayMode === 'history'))
                            return;
                        if (!!(__VLS_ctx.canRentVehicle(vehicle)))
                            return;
                        if (!(__VLS_ctx.canReturnVehicle(vehicle)))
                            return;
                        __VLS_ctx.handleReturnVehicle(vehicle);
                    } },
                ...{ class: "px-3 py-1.5 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
                ...{ class: "i-ph-handbag w-4 h-4 mr-1" },
            });
        }
    }
}
/** @type {[typeof RentDialog, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(RentDialog, new RentDialog({
    ...{ 'onClose': {} },
    ...{ 'onSuccess': {} },
    show: (__VLS_ctx.showRentDialog),
    vehicle: (__VLS_ctx.selectedVehicleForRent),
}));
const __VLS_14 = __VLS_13({
    ...{ 'onClose': {} },
    ...{ 'onSuccess': {} },
    show: (__VLS_ctx.showRentDialog),
    vehicle: (__VLS_ctx.selectedVehicleForRent),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onClose: (__VLS_ctx.handleCloseRentDialog)
};
const __VLS_20 = {
    onSuccess: (__VLS_ctx.handleRentSuccess)
};
var __VLS_15;
/** @type {[typeof RentSuccessDialog, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(RentSuccessDialog, new RentSuccessDialog({
    ...{ 'onClose': {} },
    show: (__VLS_ctx.showRentSuccessDialog),
    rental: (__VLS_ctx.currentRental),
}));
const __VLS_22 = __VLS_21({
    ...{ 'onClose': {} },
    show: (__VLS_ctx.showRentSuccessDialog),
    rental: (__VLS_ctx.currentRental),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
let __VLS_24;
let __VLS_25;
let __VLS_26;
const __VLS_27 = {
    onClose: (__VLS_ctx.handleCloseSuccessDialog)
};
var __VLS_23;
/** @type {[typeof SimpleReturnDialog, ]} */ ;
// @ts-ignore
const __VLS_28 = __VLS_asFunctionalComponent(SimpleReturnDialog, new SimpleReturnDialog({
    ...{ 'onClose': {} },
    ...{ 'onSuccess': {} },
    show: (__VLS_ctx.showReturnDialog),
    vehicle: (__VLS_ctx.selectedReturnVehicle),
}));
const __VLS_29 = __VLS_28({
    ...{ 'onClose': {} },
    ...{ 'onSuccess': {} },
    show: (__VLS_ctx.showReturnDialog),
    vehicle: (__VLS_ctx.selectedReturnVehicle),
}, ...__VLS_functionalComponentArgsRest(__VLS_28));
let __VLS_31;
let __VLS_32;
let __VLS_33;
const __VLS_34 = {
    onClose: (__VLS_ctx.handleCloseReturnDialog)
};
const __VLS_35 = {
    onSuccess: (__VLS_ctx.onReturnSuccess)
};
var __VLS_30;
if (__VLS_ctx.showSuccessNotification) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bg-white rounded-2xl p-8 max-w-md w-full transform animate-bounce-in" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-col items-center text-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "i-ph-check-circle-fill w-12 h-12 text-green-600" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-xl font-bold text-gray-900 mb-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-gray-600 mb-4" },
    });
    (__VLS_ctx.successMessage);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bg-blue-50 rounded-lg px-4 py-3 w-full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "i-ph-spinner w-5 h-5 text-blue-600 animate-spin inline-block mr-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm text-blue-700" },
    });
}
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sticky']} */ ;
/** @type {__VLS_StyleScopedClasses['top-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['self-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['self-center']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['self-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['pl-8']} */ ;
/** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['w-48']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-magnifying-glass']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['left-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['top-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['w-96']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['border-l']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['sticky']} */ ;
/** @type {__VLS_StyleScopedClasses['right-0']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-red-200']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-red-50']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-50']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:shadow-md']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-shadow']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-1']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-map-trifold']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-1']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-dots-three-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-1']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-target']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-50']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:shadow-md']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-shadow']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-50']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-700']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-user']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-1']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-gauge']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-1']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-battery-high']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-1']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-map-pin']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-1']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-clock']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-700']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-user']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-key']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-orange-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-orange-700']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-handbag']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-8']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['transform']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-bounce-in']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-20']} */ ;
/** @type {__VLS_StyleScopedClasses['h-20']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-green-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-check-circle-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['w-12']} */ ;
/** @type {__VLS_StyleScopedClasses['h-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-50']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-700']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            MapLibreMap: MapLibreMap,
            RentDialog: RentDialog,
            RentSuccessDialog: RentSuccessDialog,
            SimpleReturnDialog: SimpleReturnDialog,
            VehicleTraceFilter: VehicleTraceFilter,
            VehicleFilter: VehicleFilter,
            sitesStore: sitesStore,
            canViewHistory: canViewHistory,
            selectedDomain: selectedDomain,
            displayMode: displayMode,
            selectedItem: selectedItem,
            highlightedVehicle: highlightedVehicle,
            searchQuery: searchQuery,
            hourOptions: hourOptions,
            startDate: startDate,
            startHour: startHour,
            endDate: endDate,
            endHour: endHour,
            selectedTraceVehicles: selectedTraceVehicles,
            filteredVehicleTraces: filteredVehicleTraces,
            selectedRealtimeVehicles: selectedRealtimeVehicles,
            showRentDialog: showRentDialog,
            selectedVehicleForRent: selectedVehicleForRent,
            showReturnDialog: showReturnDialog,
            selectedReturnVehicle: selectedReturnVehicle,
            showSuccessNotification: showSuccessNotification,
            successMessage: successMessage,
            showRentSuccessDialog: showRentSuccessDialog,
            currentRental: currentRental,
            historyLoading: historyLoading,
            historyError: historyError,
            formatRouteTime: formatRouteTime,
            formatDistance: formatDistance,
            mapCenter: mapCenter,
            availableTraceVehicles: availableTraceVehicles,
            filteredTraces: filteredTraces,
            historyRoutes: historyRoutes,
            filteredRealtimeVehicles: filteredRealtimeVehicles,
            availableVehiclesForFilter: availableVehiclesForFilter,
            totalVehicles: totalVehicles,
            getStatusBadgeClass: getStatusBadgeClass,
            getRelativeTime: getRelativeTime,
            selectVehicle: selectVehicle,
            focusTrace: focusTrace,
            getStatusText: getStatusText,
            handleDomainChange: handleDomainChange,
            handleDisplayModeChange: handleDisplayModeChange,
            handleMapSelect: handleMapSelect,
            handleRentSuccess: handleRentSuccess,
            canRentVehicle: canRentVehicle,
            canReturnVehicle: canReturnVehicle,
            getRentButtonTooltip: getRentButtonTooltip,
            handleRentVehicle: handleRentVehicle,
            handleReturnVehicle: handleReturnVehicle,
            handleCloseRentDialog: handleCloseRentDialog,
            handleCloseSuccessDialog: handleCloseSuccessDialog,
            handleCloseReturnDialog: handleCloseReturnDialog,
            onReturnSuccess: onReturnSuccess,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
