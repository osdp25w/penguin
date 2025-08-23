import { rest } from 'msw'
import { faker } from '@faker-js/faker'
import type { Alert } from '@/types/alert'
import { AlertSchema } from '@/types/alert'
import { z } from 'zod'

const SEED_MOCK_ENABLED = import.meta.env.VITE_SEED_MOCK === '1'

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
  siteId: z.string().min(1),
  since: z.string().optional()
})

export const alertsHandlers = [
  rest.get('/api/v1/alerts', (req, res, ctx) => {
    try {
      const url = new URL(req.url)
      const queryParams = Object.fromEntries(url.searchParams.entries())
      const { siteId, since } = AlertQuerySchema.parse(queryParams)
      
      const alerts = generateAlerts(siteId, since)
      const delay = faker.number.int({ min: 150, max: 350 })
      
      return res(
        ctx.delay(delay),
        ctx.status(200),
        ctx.json(alerts)
      )
    } catch (error) {
      console.error('[MSW] Alerts API error:', error)
      return res(
        ctx.status(400),
        ctx.json({
          error: 'Invalid request parameters', 
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      )
    }
  })
]