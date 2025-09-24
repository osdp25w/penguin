var _a, _b, _c, _d, _e, _f, _g, _h;
import { reactive, ref, onMounted, computed, watch } from 'vue';
import { Button, Card, KpiCard } from '@/design/components';
import SocTrend from '@/components/charts/SocTrend.vue';
import CarbonBar from '@/components/charts/CarbonBar.vue';
import { http } from '@/lib/api';
import { computeDailyOverviewMetrics } from '@/utils/dailyOverview';
// Reactive data
const granularity = ref('hour');
const startDate = ref(getDefaultStartDate());
const endDate = ref(getDefaultEndDate());
const isLoading = ref(false);
const socLoading = ref(false);
const carbonLoading = ref(false);
const hourlyDisplayMode = ref('timeline');
// Computed properties
const daysDiff = computed(() => {
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
});
// Helper functions for default dates
function getDefaultStartDate() {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    return lastWeek.toISOString().split('T')[0];
}
function getDefaultEndDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}
const summary = reactive({
    online: '—',
    offline: '—',
    distance: '—',
    carbon: '—',
    onlineChange: null,
    offlineChange: null,
    distanceChange: null,
    carbonChange: null,
    onlineChangeLabel: '—',
    offlineChangeLabel: '—',
    distanceChangeLabel: '—',
    carbonChangeLabel: '—'
});
// Chart data (reactive arrays)
const socLabels = reactive(['00h', '02h', '04h', '06h', '08h', '10h', '12h', '14h', '16h', '18h', '20h', '22h']);
const socValues = reactive([92, 90, 87, 84, 80, 75, 70, 65, 60, 55, 50, 45]);
const carbonLabels = reactive(['06-20', '06-21', '06-22', '06-23', '06-24', '06-25', '06-26']);
const carbonValues = reactive([9.6, 10.2, 8.7, 11.3, 9.9, 12.1, 10.4]);
// Recent alerts mock data
const recentAlerts = reactive([
    {
        id: 1,
        type: 'warning',
        message: '站點 A01 電池電量不足',
        time: '2 分鐘前'
    },
    {
        id: 2,
        type: 'error',
        message: '車輛 BK001 GPS 信號異常',
        time: '5 分鐘前'
    },
    {
        id: 3,
        type: 'info',
        message: '系統維護已完成',
        time: '15 分鐘前'
    }
]);
// System status mock data
const systemStatus = reactive([
    {
        name: 'API 服務',
        description: '資料處理與同步',
        status: 'healthy'
    },
    {
        name: 'GPS 追蹤',
        description: '車輛位置監控',
        status: 'healthy'
    },
    {
        name: '電池監測',
        description: '電池狀態監控',
        status: 'warning'
    },
    {
        name: '資料庫',
        description: '資料儲存服務',
        status: 'healthy'
    }
]);
// 粒度變更處理
const onGranularityChange = () => {
    autoAdjustDateRange();
    updateData();
};
// 根據粒度自動調整日期範圍
const autoAdjustDateRange = () => {
    const today = new Date();
    const start = new Date(today);
    switch (granularity.value) {
        case 'hour':
            // 每小時：顯示今日
            start.setDate(today.getDate());
            break;
        case 'day':
            // 每日：顯示最近 14 天
            start.setDate(today.getDate() - 13);
            break;
        case 'month':
            // 每月：顯示最近 12 個月
            start.setMonth(today.getMonth() - 11);
            break;
        case 'year':
            // 每年：顯示最近 5 年
            start.setFullYear(today.getFullYear() - 4);
            break;
    }
    startDate.value = start.toISOString().split('T')[0];
    endDate.value = today.toISOString().split('T')[0];
};
// 檢查日期範圍是否需要自動調整粒度
const checkAndAdjustGranularity = () => {
    if (!startDate.value || !endDate.value)
        return;
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    // 自動調整粒度規則
    if (diffDays > 365 && granularity.value !== 'year') {
        granularity.value = 'year';
        console.log('自動調整粒度為年');
    }
    else if (diffDays > 90 && granularity.value !== 'month' && granularity.value !== 'year') {
        granularity.value = 'month';
        console.log('自動調整粒度為月');
    }
    else if (diffDays > 14 && granularity.value === 'hour') {
        granularity.value = 'day';
        console.log('自動調整粒度為日');
    }
};
// Methods
const refreshData = async () => {
    isLoading.value = true;
    socLoading.value = true;
    carbonLoading.value = true;
    try {
        await Promise.all([
            fetchDailyOverviewWithComparison(startDate.value, endDate.value), // KPI 卡含昨日比較
            fetchTrendData(startDate.value, endDate.value, granularity.value), // 趨勢圖資料
        ]);
    }
    finally {
        isLoading.value = false;
        socLoading.value = false;
        carbonLoading.value = false;
    }
};
const updateData = () => {
    // Update data based on selected date range
    console.log('更新資料日期範圍:', {
        startDate: startDate.value,
        endDate: endDate.value,
        granularity: granularity.value
    });
    // Validate date range
    if (startDate.value && endDate.value) {
        const start = new Date(startDate.value);
        const end = new Date(endDate.value);
        if (start > end) {
            alert('起始日期不能晚於結束日期');
            return;
        }
        // 檢查並調整粒度
        checkAndAdjustGranularity();
        // 實際調用 API 獲取資料
        refreshData();
    }
};
function extractDailyRecords(source) {
    var _a;
    const data = (_a = source === null || source === void 0 ? void 0 : source.data) !== null && _a !== void 0 ? _a : source;
    if (Array.isArray(data))
        return data;
    if (Array.isArray(data === null || data === void 0 ? void 0 : data.results))
        return data.results;
    return [];
}
// 取得每日總覽統計並與昨日比較
async function fetchDailyOverviewWithComparison(start, end) {
    var _a, _b, _c, _d;
    try {
        // 使用與原始程式碼相同的 API 參數格式
        const targetDate = end || start || new Date().toISOString().split('T')[0];
        // 建立參數
        const params = new URLSearchParams();
        params.set('limit', '14');
        params.set('ordering', '-collected_time');
        params.set('collected_time__lte', targetDate);
        // 取得資料
        const response = await http.get(`/api/statistic/daily-overview/?${params.toString()}`).catch(() => null);
        // 提取資料
        const records = extractDailyRecords(response);
        // 如果資料不足，嘗試取得更大範圍
        if (records.length < 2) {
            const params2 = new URLSearchParams();
            params2.set('limit', '30');
            params2.set('ordering', '-collected_time');
            const response2 = await http.get(`/api/statistic/daily-overview/?${params2.toString()}`).catch(() => null);
            const moreRecords = extractDailyRecords(response2);
            if (moreRecords.length > records.length) {
                records.splice(0, records.length, ...moreRecords);
            }
        }
        console.log('Daily overview records:', records.length, 'items');
        if (records.length > 0) {
            console.log('First record:', records[0]);
        }
        const metrics = computeDailyOverviewMetrics(records);
        const onlineMetric = metrics.online;
        summary.online = (_a = onlineMetric.value) !== null && _a !== void 0 ? _a : '—';
        summary.onlineChange = onlineMetric.delta;
        summary.onlineChangeLabel = onlineMetric.deltaLabel;
        const offlineMetric = metrics.offline;
        summary.offline = (_b = offlineMetric.value) !== null && _b !== void 0 ? _b : '—';
        summary.offlineChange = offlineMetric.delta;
        summary.offlineChangeLabel = offlineMetric.deltaLabel;
        const distanceMetric = metrics.distance;
        summary.distance = (_c = distanceMetric.value) !== null && _c !== void 0 ? _c : '—';
        summary.distanceChange = distanceMetric.delta;
        summary.distanceChangeLabel = distanceMetric.deltaLabel;
        const carbonMetric = metrics.carbon;
        summary.carbon = (_d = carbonMetric.value) !== null && _d !== void 0 ? _d : '—';
        summary.carbonChange = carbonMetric.delta;
        summary.carbonChangeLabel = carbonMetric.deltaLabel;
        console.log('Daily overview with comparison updated:', {
            today: {
                online: onlineMetric.value,
                offline: offlineMetric.value,
                distance: distanceMetric.value,
                carbon: carbonMetric.value
            },
            changes: {
                online: summary.onlineChange,
                offline: summary.offlineChange,
                distance: summary.distanceChange,
                carbon: summary.carbonChange
            }
        });
    }
    catch (e) {
        console.warn('fetchDailyOverviewWithComparison failed:', e);
        summary.online = '—';
        summary.offline = '—';
        summary.distance = '—';
        summary.carbon = '—';
        summary.onlineChange = null;
        summary.offlineChange = null;
        summary.distanceChange = null;
        summary.carbonChange = null;
        summary.onlineChangeLabel = '—';
        summary.offlineChangeLabel = '—';
        summary.distanceChangeLabel = '—';
        summary.carbonChangeLabel = '—';
    }
}
// 統一的趨勢圖資料獲取函數
async function fetchTrendData(start, end, granularityType) {
    try {
        if (granularityType === 'hour') {
            // 每小時模式
            if (hourlyDisplayMode.value === 'timeline') {
                // 時間序列模式
                await fetchHourlyTimelineTrend(start, end);
            }
            else {
                // 小時平均模式
                await fetchHourlyAverageTrend(start, end);
            }
        }
        else {
            // 每日/月/年：同時獲取 SOC 和減碳趨勢
            await Promise.all([
                fetchSocTrendByGranularity(start, end, granularityType),
                fetchCarbonTrendByGranularity(start, end, granularityType)
            ]);
        }
    }
    catch (e) {
        console.warn('fetchTrendData failed:', e);
    }
}
// 模式 A: 時間序列 - 顯示區間內每個小時的實際數據
async function fetchHourlyTimelineTrend(start, end) {
    if (!start || !end)
        return;
    try {
        // 構建查詢參數
        const params = new URLSearchParams();
        params.set('collected_time__gte', start + 'T00:00:00');
        params.set('collected_time__lte', end + 'T23:59:59');
        params.set('ordering', 'collected_time');
        const url = `/api/statistic/hourly-overview/?${params.toString()}`;
        const response = await http.get(url);
        const data = (response === null || response === void 0 ? void 0 : response.data) || response;
        const arr = Array.isArray(data) ? data : ((data === null || data === void 0 ? void 0 : data.results) || []);
        const pickNum = (o, keys, def = 0) => {
            for (const k of keys) {
                const v = o === null || o === void 0 ? void 0 : o[k];
                if (v != null && !isNaN(Number(v)))
                    return Number(v);
            }
            return def;
        };
        // 處理數據並格式化標籤
        const items = arr.map((it) => {
            const time = (it === null || it === void 0 ? void 0 : it.collected_time) || (it === null || it === void 0 ? void 0 : it.timestamp) || '';
            return {
                time,
                soc: pickNum(it, ['average_soc', 'avg_soc', 'soc_avg', 'mean_soc', 'soc'], 0),
                carbon: pickNum(it, ['carbon_reduction_kg', 'carbon', 'carbon_saved', 'co2', 'co2_kg'], 0)
            };
        }).filter((x) => x.time);
        // 排序
        items.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        // 格式化 X 軸標籤
        const labels = items.map((item) => {
            const date = new Date(item.time);
            if (daysDiff.value <= 1) {
                // 單天或以內：只顯示小時
                return String(date.getHours()).padStart(2, '0') + 'h';
            }
            else {
                // 多天：顯示 MM/DD HH
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hour = String(date.getHours()).padStart(2, '0');
                return `${month}/${day} ${hour}h`;
            }
        });
        // 更新圖表數據
        socLabels.splice(0, socLabels.length, ...labels);
        socValues.splice(0, socValues.length, ...items.map((x) => x.soc));
        carbonLabels.splice(0, carbonLabels.length, ...labels);
        carbonValues.splice(0, carbonValues.length, ...items.map((x) => x.carbon));
        console.log('Hourly timeline trend updated:', {
            mode: 'timeline',
            count: items.length,
            range: `${start} to ${end}`
        });
    }
    catch (e) {
        console.warn('fetchHourlyTimelineTrend failed:', e);
    }
}
// 模式 B: 小時平均 - 顯示一天中各小時的平均值
async function fetchHourlyAverageTrend(start, end) {
    if (!start || !end)
        return;
    try {
        // 獲取區間內所有小時數據
        const params = new URLSearchParams();
        params.set('collected_time__gte', start + 'T00:00:00');
        params.set('collected_time__lte', end + 'T23:59:59');
        params.set('ordering', 'collected_time');
        const url = `/api/statistic/hourly-overview/?${params.toString()}`;
        const response = await http.get(url);
        const data = (response === null || response === void 0 ? void 0 : response.data) || response;
        const arr = Array.isArray(data) ? data : ((data === null || data === void 0 ? void 0 : data.results) || []);
        const pickNum = (o, keys, def = 0) => {
            for (const k of keys) {
                const v = o === null || o === void 0 ? void 0 : o[k];
                if (v != null && !isNaN(Number(v)))
                    return Number(v);
            }
            return def;
        };
        // 初始化 24 小時的桶
        const hourlyBuckets = Array(24).fill(null).map(() => ({
            soc: [],
            carbon: []
        }));
        // 將數據分配到對應的小時桶
        arr.forEach((it) => {
            const time = (it === null || it === void 0 ? void 0 : it.collected_time) || (it === null || it === void 0 ? void 0 : it.timestamp);
            if (!time)
                return;
            const hour = new Date(time).getHours();
            const soc = pickNum(it, ['average_soc', 'avg_soc', 'soc_avg', 'mean_soc', 'soc'], 0);
            const carbon = pickNum(it, ['carbon_reduction_kg', 'carbon', 'carbon_saved', 'co2', 'co2_kg'], 0);
            if (soc > 0)
                hourlyBuckets[hour].soc.push(soc);
            if (carbon > 0)
                hourlyBuckets[hour].carbon.push(carbon);
        });
        // 計算每個小時的平均值
        const labels = [];
        const socAvgValues = [];
        const carbonAvgValues = [];
        for (let hour = 0; hour < 24; hour++) {
            const bucket = hourlyBuckets[hour];
            // 只顯示有數據的小時
            if (bucket.soc.length > 0 || bucket.carbon.length > 0) {
                labels.push(String(hour).padStart(2, '0') + 'h');
                // 計算 SOC 平均值
                const socAvg = bucket.soc.length > 0
                    ? bucket.soc.reduce((a, b) => a + b, 0) / bucket.soc.length
                    : 0;
                socAvgValues.push(Number(socAvg.toFixed(1)));
                // 計算減碳平均值
                const carbonAvg = bucket.carbon.length > 0
                    ? bucket.carbon.reduce((a, b) => a + b, 0) / bucket.carbon.length
                    : 0;
                carbonAvgValues.push(Number(carbonAvg.toFixed(2)));
            }
        }
        // 更新圖表數據
        socLabels.splice(0, socLabels.length, ...labels);
        socValues.splice(0, socValues.length, ...socAvgValues);
        carbonLabels.splice(0, carbonLabels.length, ...labels);
        carbonValues.splice(0, carbonValues.length, ...carbonAvgValues);
        console.log('Hourly average trend updated:', {
            mode: 'average',
            hours: labels.length,
            dateRange: `${start} to ${end}`,
            days: daysDiff.value + 1
        });
    }
    catch (e) {
        console.warn('fetchHourlyAverageTrend failed:', e);
    }
}
// 按粒度獲取 SOC 趨勢
async function fetchSocTrendByGranularity(start, end, granularityType) {
    if (!start || !end)
        return;
    try {
        let url = '';
        switch (granularityType) {
            case 'day':
                url = `/api/statistic/daily-overview/?collected_time__gte=${encodeURIComponent(start)}&collected_time__lte=${encodeURIComponent(end)}`;
                break;
            case 'month':
            case 'year':
                // 如果後端有按月/年的 API，在這裡使用
                url = `/api/statistic/daily-overview/?collected_time__gte=${encodeURIComponent(start)}&collected_time__lte=${encodeURIComponent(end)}`;
                break;
        }
        const response = await http.get(url);
        const data = (response === null || response === void 0 ? void 0 : response.data) || response;
        const arr = Array.isArray(data) ? data : ((data === null || data === void 0 ? void 0 : data.results) || []);
        const pickNum = (o, keys, def = 0) => {
            for (const k of keys) {
                const v = o === null || o === void 0 ? void 0 : o[k];
                if (v != null && !isNaN(Number(v)))
                    return Number(v);
            }
            return def;
        };
        const formatLabel = (dateStr, type) => {
            const d = new Date(dateStr);
            if (isNaN(d.getTime()))
                return dateStr;
            switch (type) {
                case 'day':
                    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                case 'month':
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                case 'year':
                    return String(d.getFullYear());
                default:
                    return dateStr;
            }
        };
        let processedItems = arr.map((it) => ({
            date: (it === null || it === void 0 ? void 0 : it.collected_time) || (it === null || it === void 0 ? void 0 : it.date) || '',
            soc: pickNum(it, ['average_soc', 'avg_soc', 'soc_avg', 'mean_soc', 'soc'], 0)
        })).filter((x) => x.date);
        // 如果是月或年級，需要群組資料
        if (granularityType === 'month' || granularityType === 'year') {
            processedItems = groupByPeriod(processedItems, granularityType);
        }
        processedItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        socLabels.splice(0, socLabels.length, ...processedItems.map((x) => formatLabel(x.date, granularityType)));
        socValues.splice(0, socValues.length, ...processedItems.map((x) => x.soc));
        console.log(`SOC trend (${granularityType}) updated:`, { labels: socLabels.length, avgSoc: socValues.reduce((a, b) => a + b, 0) / socValues.length });
    }
    catch (e) {
        console.warn('fetchSocTrendByGranularity failed:', e);
    }
}
// 按粒度獲取減碳趨勢
async function fetchCarbonTrendByGranularity(start, end, granularityType) {
    if (!start || !end)
        return;
    try {
        const url = `/api/statistic/daily-overview/?collected_time__gte=${encodeURIComponent(start)}&collected_time__lte=${encodeURIComponent(end)}`;
        const response = await http.get(url);
        const data = (response === null || response === void 0 ? void 0 : response.data) || response;
        const arr = Array.isArray(data) ? data : ((data === null || data === void 0 ? void 0 : data.results) || []);
        const pickNum = (o, keys, def = 0) => {
            for (const k of keys) {
                const v = o === null || o === void 0 ? void 0 : o[k];
                if (v != null && !isNaN(Number(v)))
                    return Number(v);
            }
            return def;
        };
        const formatLabel = (dateStr, type) => {
            const d = new Date(dateStr);
            if (isNaN(d.getTime()))
                return dateStr;
            switch (type) {
                case 'day':
                    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                case 'month':
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                case 'year':
                    return String(d.getFullYear());
                default:
                    return dateStr;
            }
        };
        let processedItems = arr.map((it) => ({
            date: (it === null || it === void 0 ? void 0 : it.collected_time) || (it === null || it === void 0 ? void 0 : it.date) || '',
            carbon: pickNum(it, ['carbon_reduction_kg', 'carbon', 'carbon_saved', 'co2', 'co2_kg'], 0)
        })).filter((x) => x.date);
        // 如果是月或年級，需要群組資料
        if (granularityType === 'month' || granularityType === 'year') {
            processedItems = groupByPeriod(processedItems, granularityType, 'carbon');
        }
        processedItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        carbonLabels.splice(0, carbonLabels.length, ...processedItems.map((x) => formatLabel(x.date, granularityType)));
        carbonValues.splice(0, carbonValues.length, ...processedItems.map((x) => x.carbon));
        console.log(`Carbon trend (${granularityType}) updated:`, { labels: carbonLabels.length, totalCarbon: carbonValues.reduce((a, b) => a + b, 0) });
    }
    catch (e) {
        console.warn('fetchCarbonTrendByGranularity failed:', e);
    }
}
// 群組資料輔助函數
function groupByPeriod(items, granularityType, valueField = 'soc') {
    const groups = new Map();
    items.forEach(item => {
        const date = new Date(item.date);
        let key = '';
        if (granularityType === 'month') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
        }
        else if (granularityType === 'year') {
            key = `${date.getFullYear()}-01-01`;
        }
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(item);
    });
    return Array.from(groups.entries()).map(([date, groupItems]) => {
        const values = groupItems.map(item => item[valueField]).filter(v => !isNaN(v));
        const avgValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        return {
            date,
            [valueField]: Number(avgValue.toFixed(1))
        };
    });
}
const exportData = () => {
    // Validate date range before export
    if (!startDate.value || !endDate.value) {
        alert('請選擇完整的日期範圍');
        return;
    }
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    if (start > end) {
        alert('起始日期不能晚於結束日期');
        return;
    }
    // Prepare export data
    const exportData = {
        dateRange: {
            startDate: startDate.value,
            endDate: endDate.value
        },
        kpi: {
            onlineVehicles: summary.online,
            offlineVehicles: summary.offline,
            totalDistance: summary.distance,
            carbonSaved: summary.carbon
        },
        chartData: {
            socTrend: {
                labels: socLabels,
                values: socValues
            },
            carbonReduction: {
                labels: carbonLabels,
                values: carbonValues
            }
        },
        exportTime: new Date().toISOString(),
        exportedBy: 'system'
    };
    // Create and download CSV file
    const csvContent = generateCSVContent(exportData);
    downloadCSV(csvContent, `system-overview-${startDate.value}-to-${endDate.value}.csv`);
    console.log('匯出資料:', exportData);
};
const generateCSVContent = (data) => {
    const lines = [];
    // Header
    lines.push('系統總覽報表');
    lines.push(`匯出時間：${new Date(data.exportTime).toLocaleString('zh-TW')}`);
    lines.push(`日期範圍：${data.dateRange.startDate} 至 ${data.dateRange.endDate}`);
    lines.push('');
    // KPI Data
    lines.push('KPI 指標');
    lines.push('指標名稱,數值,單位');
    lines.push(`上線車輛,${data.kpi.onlineVehicles},台`);
    lines.push(`離線車輛,${data.kpi.offlineVehicles},台`);
    lines.push(`今日總里程,${data.kpi.totalDistance},公里`);
    lines.push(`減碳效益,${data.kpi.carbonSaved},kg CO₂`);
    lines.push('');
    // SoC Trend Data
    lines.push('電池狀態趨勢');
    lines.push('時間,平均 SoC (%)');
    data.chartData.socTrend.labels.forEach((label, index) => {
        lines.push(`${label},${data.chartData.socTrend.values[index]}`);
    });
    lines.push('');
    // Carbon Reduction Data
    lines.push('減碳量統計');
    lines.push('日期,減碳量 (kg CO₂)');
    data.chartData.carbonReduction.labels.forEach((label, index) => {
        lines.push(`${label},${data.chartData.carbonReduction.values[index]}`);
    });
    return lines.join('\n');
};
const downloadCSV = (content, filename) => {
    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};
// Cleanup: Removed unused helper methods for disabled alert and status sections
// Watch for display mode changes
watch(hourlyDisplayMode, () => {
    if (granularity.value === 'hour') {
        refreshData();
    }
});
onMounted(() => {
    // 初始化預設粒度和日期範圍
    autoAdjustDateRange();
    // Initial data load
    refreshData();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-3xl font-bold text-gray-900" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-gray-600 mt-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "text-sm font-medium text-gray-700" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    ...{ onChange: (__VLS_ctx.onGranularityChange) },
    value: (__VLS_ctx.granularity),
    ...{ class: "input-base w-24" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "hour",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "day",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "month",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "year",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "text-sm font-medium text-gray-700" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (__VLS_ctx.updateData) },
    type: "date",
    ...{ class: "input-base w-36" },
});
(__VLS_ctx.startDate);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "text-sm font-medium text-gray-700" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (__VLS_ctx.updateData) },
    type: "date",
    ...{ class: "input-base w-36" },
});
(__VLS_ctx.endDate);
const __VLS_0 = {}.Button;
/** @type {[typeof __VLS_components.Button, typeof __VLS_components.Button, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    variant: "primary",
    disabled: (__VLS_ctx.isLoading),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    variant: "primary",
    disabled: (__VLS_ctx.isLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (__VLS_ctx.refreshData)
};
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.i)({
    ...{ class: "i-ph-arrow-clockwise w-4 h-4" },
});
var __VLS_3;
const __VLS_8 = {}.Button;
/** @type {[typeof __VLS_components.Button, typeof __VLS_components.Button, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    variant: "ghost",
    disabled: (__VLS_ctx.isLoading),
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    variant: "ghost",
    disabled: (__VLS_ctx.isLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onClick: (__VLS_ctx.exportData)
};
__VLS_11.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.i)({
    ...{ class: "i-ph-download w-4 h-4" },
});
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6" },
});
const __VLS_16 = {}.KpiCard;
/** @type {[typeof __VLS_components.KpiCard, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    title: "現在上線",
    value: (__VLS_ctx.summary.online),
    unit: "台",
    icon: "i-ph-bicycle",
    color: "green",
    change: ((_a = __VLS_ctx.summary.onlineChange) !== null && _a !== void 0 ? _a : undefined),
    changeLabel: (__VLS_ctx.summary.onlineChangeLabel),
    period: "昨日",
    trend: "up",
}));
const __VLS_18 = __VLS_17({
    title: "現在上線",
    value: (__VLS_ctx.summary.online),
    unit: "台",
    icon: "i-ph-bicycle",
    color: "green",
    change: ((_b = __VLS_ctx.summary.onlineChange) !== null && _b !== void 0 ? _b : undefined),
    changeLabel: (__VLS_ctx.summary.onlineChangeLabel),
    period: "昨日",
    trend: "up",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const __VLS_20 = {}.KpiCard;
/** @type {[typeof __VLS_components.KpiCard, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    title: "現在離線",
    value: (__VLS_ctx.summary.offline),
    unit: "台",
    icon: "i-ph-warning-circle",
    color: "red",
    change: ((_c = __VLS_ctx.summary.offlineChange) !== null && _c !== void 0 ? _c : undefined),
    changeLabel: (__VLS_ctx.summary.offlineChangeLabel),
    period: "昨日",
    trend: "down",
}));
const __VLS_22 = __VLS_21({
    title: "現在離線",
    value: (__VLS_ctx.summary.offline),
    unit: "台",
    icon: "i-ph-warning-circle",
    color: "red",
    change: ((_d = __VLS_ctx.summary.offlineChange) !== null && _d !== void 0 ? _d : undefined),
    changeLabel: (__VLS_ctx.summary.offlineChangeLabel),
    period: "昨日",
    trend: "down",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
const __VLS_24 = {}.KpiCard;
/** @type {[typeof __VLS_components.KpiCard, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    title: "今日總里程",
    value: (__VLS_ctx.summary.distance),
    unit: "公里",
    icon: "i-ph-map-pin",
    color: "blue",
    format: "number",
    precision: (1),
    change: ((_e = __VLS_ctx.summary.distanceChange) !== null && _e !== void 0 ? _e : undefined),
    changeLabel: (__VLS_ctx.summary.distanceChangeLabel),
    period: "昨日",
    trend: "up",
}));
const __VLS_26 = __VLS_25({
    title: "今日總里程",
    value: (__VLS_ctx.summary.distance),
    unit: "公里",
    icon: "i-ph-map-pin",
    color: "blue",
    format: "number",
    precision: (1),
    change: ((_f = __VLS_ctx.summary.distanceChange) !== null && _f !== void 0 ? _f : undefined),
    changeLabel: (__VLS_ctx.summary.distanceChangeLabel),
    period: "昨日",
    trend: "up",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
const __VLS_28 = {}.KpiCard;
/** @type {[typeof __VLS_components.KpiCard, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    title: "今日減碳",
    value: (__VLS_ctx.summary.carbon),
    unit: "kg CO₂",
    icon: "i-ph-tree",
    color: "green",
    format: "number",
    precision: (1),
    change: ((_g = __VLS_ctx.summary.carbonChange) !== null && _g !== void 0 ? _g : undefined),
    changeLabel: (__VLS_ctx.summary.carbonChangeLabel),
    period: "昨日",
    trend: "up",
}));
const __VLS_30 = __VLS_29({
    title: "今日減碳",
    value: (__VLS_ctx.summary.carbon),
    unit: "kg CO₂",
    icon: "i-ph-tree",
    color: "green",
    format: "number",
    precision: (1),
    change: ((_h = __VLS_ctx.summary.carbonChange) !== null && _h !== void 0 ? _h : undefined),
    changeLabel: (__VLS_ctx.summary.carbonChangeLabel),
    period: "昨日",
    trend: "up",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
if (__VLS_ctx.granularity === 'hour' && __VLS_ctx.daysDiff > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-end gap-4 bg-gray-50 px-4 py-3 rounded-lg" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "text-sm font-medium text-gray-700" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex gap-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.granularity === 'hour' && __VLS_ctx.daysDiff > 0))
                    return;
                __VLS_ctx.hourlyDisplayMode = 'timeline';
            } },
        ...{ class: ([
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                __VLS_ctx.hourlyDisplayMode === 'timeline'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            ]) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i)({
        ...{ class: "i-ph-chart-line w-4 h-4 inline-block mr-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.granularity === 'hour' && __VLS_ctx.daysDiff > 0))
                    return;
                __VLS_ctx.hourlyDisplayMode = 'average';
            } },
        ...{ class: ([
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                __VLS_ctx.hourlyDisplayMode === 'average'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            ]) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i)({
        ...{ class: "i-ph-chart-bar w-4 h-4 inline-block mr-1" },
    });
    if (__VLS_ctx.hourlyDisplayMode === 'average') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-sm text-gray-600" },
        });
        (__VLS_ctx.startDate);
        (__VLS_ctx.endDate);
        (__VLS_ctx.daysDiff + 1);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 xl:grid-cols-2 gap-6" },
});
const __VLS_32 = {}.Card;
/** @type {[typeof __VLS_components.Card, typeof __VLS_components.Card, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    padding: "md",
}));
const __VLS_34 = __VLS_33({
    padding: "md",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_35.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-between" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-semibold text-gray-900" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "w-3 h-3 bg-blue-500 rounded-full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm text-gray-600" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "h-80" },
});
if (!__VLS_ctx.socLoading) {
    /** @type {[typeof SocTrend, ]} */ ;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent(SocTrend, new SocTrend({
        labels: (__VLS_ctx.socLabels),
        values: (__VLS_ctx.socValues),
        granularity: (__VLS_ctx.granularity),
        ...{ class: "w-full h-full" },
    }));
    const __VLS_37 = __VLS_36({
        labels: (__VLS_ctx.socLabels),
        values: (__VLS_ctx.socValues),
        granularity: (__VLS_ctx.granularity),
        ...{ class: "w-full h-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-center h-full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" },
    });
}
var __VLS_35;
const __VLS_39 = {}.Card;
/** @type {[typeof __VLS_components.Card, typeof __VLS_components.Card, ]} */ ;
// @ts-ignore
const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
    padding: "md",
}));
const __VLS_41 = __VLS_40({
    padding: "md",
}, ...__VLS_functionalComponentArgsRest(__VLS_40));
__VLS_42.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_42.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-semibold text-gray-900" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "h-80" },
});
if (!__VLS_ctx.carbonLoading) {
    /** @type {[typeof CarbonBar, ]} */ ;
    // @ts-ignore
    const __VLS_43 = __VLS_asFunctionalComponent(CarbonBar, new CarbonBar({
        labels: (__VLS_ctx.carbonLabels),
        values: (__VLS_ctx.carbonValues),
        granularity: (__VLS_ctx.granularity),
        ...{ class: "w-full h-full" },
    }));
    const __VLS_44 = __VLS_43({
        labels: (__VLS_ctx.carbonLabels),
        values: (__VLS_ctx.carbonValues),
        granularity: (__VLS_ctx.granularity),
        ...{ class: "w-full h-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_43));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-center h-full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" },
    });
}
var __VLS_42;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['input-base']} */ ;
/** @type {__VLS_StyleScopedClasses['w-24']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['input-base']} */ ;
/** @type {__VLS_StyleScopedClasses['w-36']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['input-base']} */ ;
/** @type {__VLS_StyleScopedClasses['w-36']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-arrow-clockwise']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-download']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-chart-line']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-chart-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['h-80']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-brand-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['h-80']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-brand-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Button: Button,
            Card: Card,
            KpiCard: KpiCard,
            SocTrend: SocTrend,
            CarbonBar: CarbonBar,
            granularity: granularity,
            startDate: startDate,
            endDate: endDate,
            isLoading: isLoading,
            socLoading: socLoading,
            carbonLoading: carbonLoading,
            hourlyDisplayMode: hourlyDisplayMode,
            daysDiff: daysDiff,
            summary: summary,
            socLabels: socLabels,
            socValues: socValues,
            carbonLabels: carbonLabels,
            carbonValues: carbonValues,
            onGranularityChange: onGranularityChange,
            refreshData: refreshData,
            updateData: updateData,
            exportData: exportData,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
