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
const vehicleFilter = ref('all');
const highlightedVehicle = ref(null);
const searchQuery = ref('');
const timeRange = ref({
    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    end: new Date().toISOString().slice(0, 16)
});
const activeFilter = ref('all');
const selectedVehicle = ref(null);
// 軌跡過濾相關狀態
const selectedTraceVehicles = ref([]);
const filteredVehicleTraces = ref({});
// 即時車輛過濾相關狀態
const selectedRealtimeVehicles = ref([]);
const realtimeVehicles = ref([]);
const showRentDialog = ref(false);
const selectedVehicleForRent = ref(null);
const showReturnDialog = ref(false);
const selectedReturnVehicle = ref(null);
const showRentSuccessDialog = ref(false);
const currentRental = ref(null);
const seedMockEnabled = computed(() => import.meta.env.VITE_SEED_MOCK === '1');
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
    const vehicles = realtimeVehicles.value;
    if (vehicles.length === 0) {
        // 預設花蓮市中心
        return { lat: 23.9739, lng: 121.6014, zoom: 12 };
    }
    // 計算所有車輛位置的邊界
    const lats = vehicles.map((v) => { var _a; return v.lat || ((_a = v.location) === null || _a === void 0 ? void 0 : _a.lat); }).filter(Boolean);
    const lngs = vehicles.map((v) => { var _a; return v.lon || ((_a = v.location) === null || _a === void 0 ? void 0 : _a.lng); }).filter(Boolean);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    // 計算中心點
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    // 計算適當的縮放級別
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    let zoom = 13; // 預設縮放
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
    const traces = filteredVehicleTraces.value;
    const vehicleColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return Object.entries(traces).map(([vehicleId, trace], index) => ({
        id: vehicleId,
        color: vehicleColors[index % vehicleColors.length],
        pointCount: trace.length
    }));
});
const filteredTraces = computed(() => {
    if (selectedTraceVehicles.value.length === 0) {
        return filteredVehicleTraces.value;
    }
    const filtered = {};
    selectedTraceVehicles.value.forEach(vehicleId => {
        if (filteredVehicleTraces.value[vehicleId]) {
            filtered[vehicleId] = filteredVehicleTraces.value[vehicleId];
        }
    });
    return filtered;
});
// 即時車輛過濾邏輯
const filteredRealtimeVehicles = computed(() => {
    var _a;
    let list = realtimeVehicles.value;
    // 角色：member 不顯示已被租借（使用中）的車輛；但可看到低電/維修
    const role = (_a = auth.user) === null || _a === void 0 ? void 0 : _a.roleId;
    if (role !== 'admin' && role !== 'staff') {
        list = list.filter(v => v.status !== '使用中' && v.status !== 'in-use');
    }
    if (selectedRealtimeVehicles.value.length === 0) {
        return list;
    }
    return list.filter(vehicle => selectedRealtimeVehicles.value.includes(vehicle.id));
});
// 過濾後的車輛
const filteredVehicles = computed(() => {
    var _a;
    let vehicles = realtimeVehicles.value;
    const role = (_a = auth.user) === null || _a === void 0 ? void 0 : _a.roleId;
    if (role !== 'admin' && role !== 'staff') {
        vehicles = vehicles.filter(v => v.status !== '使用中' && v.status !== 'in-use');
    }
    // 根據篩選條件過濾
    if (vehicleFilter.value !== 'all') {
        vehicles = vehicles.filter(vehicle => {
            switch (vehicleFilter.value) {
                case 'moving':
                    return vehicle.status === 'in-use' && (vehicle.speed || 0) > 0;
                case 'offline':
                    return vehicle.status === 'maintenance';
                case 'low-battery':
                    return vehicle.status === 'low-battery' || vehicle.batteryLevel < 20;
                default:
                    return true;
            }
        });
    }
    // 根據搜尋條件過濾
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        vehicles = vehicles.filter(vehicle => vehicle.id.toLowerCase().includes(query) ||
            vehicle.model.toLowerCase().includes(query));
    }
    return vehicles;
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
// Filter and search functions
function setActiveFilter(filter) {
    vehicleFilter.value = filter;
}
function getStatusColor(status) {
    const colors = {
        active: 'text-green-600 dark:text-green-400',
        maintenance: 'text-yellow-600 dark:text-yellow-400',
        offline: 'text-red-600 dark:text-red-400'
    };
    return colors[status] || 'text-gray-600';
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
    // 載入歷史軌跡資料
    try {
        console.log('載入歷史軌跡資料');
        // TODO: 當有軌跡 API 時，在此調用
        // 暫時設為空物件，避免錯誤
        filteredVehicleTraces.value = {};
    }
    catch (error) {
        console.error('載入軌跡資料失敗:', error);
        filteredVehicleTraces.value = {};
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
function canRentVehicle(_vehicle) { return true; }
function getRentButtonTooltip(_vehicle) { return '點擊租借車輛'; }
function handleRentVehicle(vehicle) {
    // 不做前端條件限制，直接交由後端驗證
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
    // 重新載入相關資料
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "history",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center space-x-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center space-x-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "datetime-local",
    ...{ class: "px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" },
});
(__VLS_ctx.timeRange.start);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-gray-500" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "datetime-local",
    ...{ class: "px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" },
});
(__VLS_ctx.timeRange.end);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "relative" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.searchQuery),
    type: "text",
    placeholder: "搜尋車輛/編號/標籤",
    ...{ class: "pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
    ...{ class: "i-ph-magnifying-glass absolute left-2.5 top-2 w-4 h-4 text-gray-400" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" },
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
    ? `軌跡過濾 (${Object.keys(__VLS_ctx.filteredTraces).length}/${Object.keys(__VLS_ctx.filteredVehicleTraces.value).length})`
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
        availableVehicles: (__VLS_ctx.realtimeVehicles),
    }));
    const __VLS_11 = __VLS_10({
        modelValue: (__VLS_ctx.selectedRealtimeVehicles),
        availableVehicles: (__VLS_ctx.realtimeVehicles),
    }, ...__VLS_functionalComponentArgsRest(__VLS_10));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex-1 overflow-y-auto p-4 space-y-3" },
});
for (const [vehicle] of __VLS_getVForSourceType((__VLS_ctx.displayMode === 'realtime' ? __VLS_ctx.filteredRealtimeVehicles : __VLS_ctx.filteredVehicles))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
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
    if ((vehicle.status === '使用中' || vehicle.status === 'in-use') && vehicle.registeredUser) {
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
        (vehicle.registeredUser);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-end" },
    });
    if (!(vehicle.status === '使用中' || vehicle.status === 'in-use')) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!(vehicle.status === '使用中' || vehicle.status === 'in-use')))
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
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(!(vehicle.status === '使用中' || vehicle.status === 'in-use')))
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
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['pl-8']} */ ;
/** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
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
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
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
            selectedDomain: selectedDomain,
            displayMode: displayMode,
            selectedItem: selectedItem,
            highlightedVehicle: highlightedVehicle,
            searchQuery: searchQuery,
            timeRange: timeRange,
            selectedTraceVehicles: selectedTraceVehicles,
            filteredVehicleTraces: filteredVehicleTraces,
            selectedRealtimeVehicles: selectedRealtimeVehicles,
            realtimeVehicles: realtimeVehicles,
            showRentDialog: showRentDialog,
            selectedVehicleForRent: selectedVehicleForRent,
            showReturnDialog: showReturnDialog,
            selectedReturnVehicle: selectedReturnVehicle,
            showRentSuccessDialog: showRentSuccessDialog,
            currentRental: currentRental,
            mapCenter: mapCenter,
            availableTraceVehicles: availableTraceVehicles,
            filteredTraces: filteredTraces,
            filteredRealtimeVehicles: filteredRealtimeVehicles,
            filteredVehicles: filteredVehicles,
            totalVehicles: totalVehicles,
            getStatusBadgeClass: getStatusBadgeClass,
            getRelativeTime: getRelativeTime,
            selectVehicle: selectVehicle,
            getStatusText: getStatusText,
            handleDomainChange: handleDomainChange,
            handleDisplayModeChange: handleDisplayModeChange,
            handleMapSelect: handleMapSelect,
            handleRentSuccess: handleRentSuccess,
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
