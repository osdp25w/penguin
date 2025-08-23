import { rest } from 'msw'
import { faker } from '@faker-js/faker'
import type { Alert } from '@/types/alert'
import { AlertSchema } from '@/types/alert'
import { z } from 'zod'

const SEED_MOCK_ENABLED = import.meta.env.VITE_SEED_MOCK === '1'

// 預設的靜態測試數據
const STATIC_ALERTS: Alert[] = [
  {
    id: 'alert_001',
    siteId: 'site_hualien_001',
    vehicleId: 'vehicle_001',
    type: 'battery_temperature',
    severity: 'critical',
    message: '電池溫度過高',
    description: '車輛 vehicle_001 的電池溫度達到 65°C，超過安全閾值',
    resolved: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30分鐘前
  },
  {
    id: 'alert_002',
    siteId: 'site_hualien_002',
    vehicleId: 'vehicle_005',
    type: 'charging_anomaly',
    severity: 'warning',
    message: '充電異常',
    description: '車輛 vehicle_005 充電過程中電流不穩定',
    resolved: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2小時前
  },
  {
    id: 'alert_003',
    siteId: 'site_taitung_001',
    vehicleId: 'vehicle_010',
    type: 'gps_signal_lost',
    severity: 'info',
    message: 'GPS 訊號異常',
    description: '車輛 vehicle_010 GPS 訊號間歇性中斷',
    resolved: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45分鐘前
  },
  {
    id: 'alert_004',
    siteId: 'site_hualien_001',
    vehicleId: 'vehicle_003',
    type: 'low_battery',
    severity: 'warning',
    message: '電量低於警戒值',
    description: '車輛 vehicle_003 電量僅剩 15%，建議立即充電',
    resolved: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() // 10分鐘前
  },
  {
    id: 'alert_005',
    siteId: 'site_hualien_002',
    type: 'network_connectivity',
    severity: 'error',
    message: '網路連線異常',
    description: '站點 site_hualien_002 與中央系統連線不穩定',
    resolved: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4小時前
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() // 3小時前解決
  }
]

const ALERT_TYPES = [
  '電池溫度過高',
  '充電異常',
  'GPS 訊號異常',
  '車輛離線',
  '電量低於警戒值',
  '感應器故障',
  '網路連線異常'
]

function generateMockAlert(siteId: string, index: number): Alert {
  const severities = ['info', 'warning', 'error', 'critical'] as const
  const severity = faker.helpers.arrayElement(severities)
  const alertType = faker.helpers.arrayElement(ALERT_TYPES)
  
  const alert: Alert = {
    id: `alert_${siteId}_${String(index).padStart(3, '0')}`,
    siteId,
    vehicleId: faker.datatype.boolean() ? `vehicle_${siteId}_${faker.string.numeric(3)}` : undefined,
    severity,
    type: alertType,
    message: alertType,
    description: `${alertType}詳細描述 - ${faker.lorem.sentence()}`,
    resolved: faker.datatype.boolean({ probability: 0.3 }),
    createdAt: faker.date.recent({ days: 3 }).toISOString(),
    resolvedAt: undefined
  }

  if (alert.resolved) {
    alert.resolvedAt = faker.date.between({ 
      from: alert.createdAt, 
      to: new Date() 
    }).toISOString()
  }

  return AlertSchema.parse(alert)
}

function generateAlerts(siteId: string, since?: string): Alert[] {
  if (!SEED_MOCK_ENABLED) {
    return []
  }

  const count = faker.number.int({ min: 1, max: 6 })
  const alerts: Alert[] = []

  for (let i = 1; i <= count; i++) {
    const alert = generateMockAlert(siteId, i)
    
    // 如果指定了 since，過濾較早的告警
    if (since) {
      const sinceDate = new Date(since)
      const alertDate = new Date(alert.createdAt)
      if (alertDate >= sinceDate) {
        alerts.push(alert)
      }
    } else {
      alerts.push(alert)
    }
  }

  return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

const AlertQuerySchema = z.object({
  siteId: z.string().optional(),
  since: z.string().optional(),
  resolved: z.string().optional()
})

// Generate some general alerts for all sites
function generateGeneralAlerts(): Alert[] {
  // 總是返回靜態測試數據，確保有內容顯示
  let alerts = [...STATIC_ALERTS]
  
  if (SEED_MOCK_ENABLED) {
    // 如果啟用隨機數據，添加一些隨機生成的警報
    const sites = ['site_hualien_001', 'site_hualien_002', 'site_taitung_001']
    sites.forEach((siteId, siteIndex) => {
      const count = faker.number.int({ min: 1, max: 3 })
      for (let i = 1; i <= count; i++) {
        alerts.push(generateMockAlert(siteId, siteIndex * 10 + i + 100))
      }
    })
  }

  return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const alertsHandlers = [
  rest.get('/api/v1/alerts', (req, res, ctx) => {
    console.log('[MSW] Alerts API called:', req.url.toString())
    
    try {
      // 簡化邏輯，總是返回測試數據
      let alerts = generateGeneralAlerts()
      
      // 檢查參數：支持 resolved=false 或 state=open
      const url = new URL(req.url)
      const resolved = url.searchParams.get('resolved')
      const state = url.searchParams.get('state')
      
      if (resolved === 'false' || state === 'open') {
        alerts = alerts.filter(alert => !alert.resolved)
      } else if (resolved === 'true') {
        alerts = alerts.filter(alert => alert.resolved)
      }
      
      // 確保所有警報都通過 Zod 驗證
      const validatedAlerts = alerts.map(alert => {
        try {
          return AlertSchema.parse(alert)
        } catch (validationError) {
          console.error('[MSW] Alert validation failed:', validationError, alert)
          // 為缺失 siteId 的警報添加默認值
          return AlertSchema.parse({
            ...alert,
            siteId: alert.siteId || 'site_default_001'
          })
        }
      })
      
      console.log(`[MSW] Returning ${validatedAlerts.length} validated alerts`)
      
      return res(
        ctx.delay(300),
        ctx.status(200),
        ctx.json(validatedAlerts)
      )
    } catch (error) {
      console.error('[MSW] Alerts API error:', error)
      return res(
        ctx.status(400),
        ctx.json({ error: error.message || 'Failed to generate alerts' })
      )
    }
  }),

  // Handle PATCH request to acknowledge/resolve alerts
  rest.patch('/api/v1/alerts/:id', (req, res, ctx) => {
    const { id } = req.params
    console.log(`[MSW] Acknowledging alert: ${id}`)
    
    return res(
      ctx.delay(200),
      ctx.status(200),
      ctx.json({ success: true, id })
    )
  })
]