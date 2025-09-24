const METRIC_CONFIGS = {
    online: {
        fields: ['online_bikes_count', 'online', 'online_vehicles', 'online_count'],
        unit: '台',
        precision: 0,
    },
    offline: {
        fields: ['offline_bikes_count', 'offline', 'offline_vehicles', 'offline_count'],
        unit: '台',
        precision: 0,
    },
    distance: {
        fields: ['total_distance_km', 'distance', 'total_distance', 'km', 'mileage'],
        unit: '公里',
        precision: 1,
    },
    carbon: {
        fields: ['carbon_reduction_kg', 'carbon', 'carbon_saved', 'co2', 'co2_kg'],
        unit: 'kg CO₂',
        precision: 1,
    },
};
function recordTime(record) {
    var _a;
    if (!record)
        return -Infinity;
    const raw = (_a = record.collected_time) !== null && _a !== void 0 ? _a : record.date;
    if (!raw)
        return -Infinity;
    const time = Date.parse(String(raw));
    return Number.isFinite(time) ? time : -Infinity;
}
function extractNumeric(record, keys) {
    if (!record)
        return null;
    for (const key of keys) {
        const value = record[key];
        if (value == null)
            continue;
        const num = Number(value);
        if (!Number.isNaN(num)) {
            return num;
        }
    }
    return null;
}
function normalizeValue(value, precision) {
    if (value == null || !Number.isFinite(value))
        return null;
    if (precision === 0)
        return Math.round(value);
    return Number(value.toFixed(precision));
}
function formatDelta(delta, precision, unit) {
    const sign = delta > 0 ? '+' : delta < 0 ? '-' : '±';
    const formatter = new Intl.NumberFormat('zh-TW', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
    });
    const formatted = formatter.format(Math.abs(delta));
    const unitLabel = unit ? ` ${unit}` : '';
    return `${sign}${formatted}${unitLabel}`;
}
export function computeDailyOverviewMetrics(records) {
    const metrics = {
        online: { value: null, delta: null, deltaLabel: '—' },
        offline: { value: null, delta: null, deltaLabel: '—' },
        distance: { value: null, delta: null, deltaLabel: '—' },
        carbon: { value: null, delta: null, deltaLabel: '—' },
    };
    if (!Array.isArray(records) || records.length === 0) {
        return metrics;
    }
    const sorted = [...records]
        .filter((item) => item && typeof item === 'object')
        .sort((a, b) => recordTime(b) - recordTime(a));
    const todayRecord = sorted[0];
    const yesterdayRecord = sorted[1];
    const metricKeys = Object.keys(METRIC_CONFIGS);
    for (const key of metricKeys) {
        const config = METRIC_CONFIGS[key];
        const todayRaw = extractNumeric(todayRecord, config.fields);
        const yesterdayRaw = extractNumeric(yesterdayRecord, config.fields);
        const todayValue = normalizeValue(todayRaw, config.precision);
        const yesterdayValue = normalizeValue(yesterdayRaw, config.precision);
        if (todayValue != null) {
            metrics[key].value = todayValue;
        }
        if (todayValue != null && yesterdayValue != null) {
            const delta = Number((todayValue - yesterdayValue).toFixed(config.precision));
            metrics[key].delta = delta;
            metrics[key].deltaLabel = formatDelta(delta, config.precision, config.unit);
        }
    }
    return metrics;
}
