export interface DailyOverviewRecord {
  collected_time?: string
  date?: string
  online_bikes_count?: number
  offline_bikes_count?: number
  total_distance_km?: number
  carbon_reduction_kg?: number
  average_soc?: number | null
  [key: string]: any
}

export interface MetricResult {
  value: number | null
  delta: number | null
  deltaLabel: string
}

export interface DailyOverviewMetrics {
  online: MetricResult
  offline: MetricResult
  distance: MetricResult
  carbon: MetricResult
}

const METRIC_CONFIGS: Record<keyof DailyOverviewMetrics, { fields: string[]; unit: string; precision: number }> = {
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
}

function recordTime(record: DailyOverviewRecord | undefined): number {
  if (!record) return -Infinity
  const raw = record.collected_time ?? record.date
  if (!raw) return -Infinity
  const time = Date.parse(String(raw))
  return Number.isFinite(time) ? time : -Infinity
}

function extractNumeric(record: DailyOverviewRecord | undefined, keys: string[]): number | null {
  if (!record) return null
  for (const key of keys) {
    const value = record[key]
    if (value == null) continue
    const num = Number(value)
    if (!Number.isNaN(num)) {
      return num
    }
  }
  return null
}

function normalizeValue(value: number | null, precision: number): number | null {
  if (value == null || !Number.isFinite(value)) return null
  if (precision === 0) return Math.round(value)
  return Number(value.toFixed(precision))
}

function formatDelta(delta: number, precision: number, unit: string): string {
  const sign = delta > 0 ? '+' : delta < 0 ? '-' : '±'
  const formatter = new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })
  const formatted = formatter.format(Math.abs(delta))
  const unitLabel = unit ? ` ${unit}` : ''
  return `${sign}${formatted}${unitLabel}`
}

export function computeDailyOverviewMetrics(records: DailyOverviewRecord[]): DailyOverviewMetrics {
  const metrics: DailyOverviewMetrics = {
    online: { value: null, delta: null, deltaLabel: '—' },
    offline: { value: null, delta: null, deltaLabel: '—' },
    distance: { value: null, delta: null, deltaLabel: '—' },
    carbon: { value: null, delta: null, deltaLabel: '—' },
  }

  if (!Array.isArray(records) || records.length === 0) {
    return metrics
  }

  const sorted = [...records]
    .filter((item) => item && typeof item === 'object')
    .sort((a, b) => recordTime(b) - recordTime(a))

  const todayRecord = sorted[0]
  const yesterdayRecord = sorted[1]

  const metricKeys = Object.keys(METRIC_CONFIGS) as Array<keyof DailyOverviewMetrics>

  for (const key of metricKeys) {
    const config = METRIC_CONFIGS[key]
    const todayRaw = extractNumeric(todayRecord, config.fields)
    const yesterdayRaw = extractNumeric(yesterdayRecord, config.fields)

    const todayValue = normalizeValue(todayRaw, config.precision)
    const yesterdayValue = normalizeValue(yesterdayRaw, config.precision)

    if (todayValue != null) {
      metrics[key].value = todayValue
    }

    if (todayValue != null && yesterdayValue != null) {
      const delta = Number((todayValue - yesterdayValue).toFixed(config.precision))
      metrics[key].delta = delta
      metrics[key].deltaLabel = formatDelta(delta, config.precision, config.unit)
    }
  }

  return metrics
}
