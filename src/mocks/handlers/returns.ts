import { rest } from 'msw'
import { faker } from '@faker-js/faker'

const seedMockEnabled = () => import.meta.env.VITE_SEED_MOCK === '1'

// Mock returns data
let mockReturns: any[] = []

// Generate initial mock data
const generateMockReturns = () => {
  if (!seedMockEnabled()) return []
  
  return Array.from({ length: 20 }, () => ({
    id: faker.string.uuid(),
    vehicleId: `BK-${faker.string.numeric(4)}`,
    siteId: faker.helpers.arrayElement(['site-001', 'site-002', 'site-003']),
    fromSiteId: faker.helpers.arrayElement(['site-001', 'site-002', 'site-003']),
    odometer: faker.number.float({ min: 0, max: 1000, fractionDigits: 1 }),
    battery: faker.number.int({ min: 10, max: 100 }),
    issues: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
    photos: faker.helpers.maybe(() => [
      faker.image.url({ width: 400, height: 300 }),
      faker.image.url({ width: 400, height: 300 })
    ], { probability: 0.2 }),
    by: faker.person.fullName(),
    createdAt: faker.date.recent({ days: 7 }).toISOString()
  }))
}

// Initialize mock data
if (seedMockEnabled()) {
  mockReturns = generateMockReturns()
}

export const returnsHandlers = [
  // POST /api/v1/returns - 歸還車輛
  rest.post('/api/v1/returns', async (req, res, ctx) => {
    try {
      const body = await req.json()

      if (!seedMockEnabled()) {
        return res(ctx.status(200), ctx.json({ success: true }))
      }

      // Validate required fields
      const requiredFields = ['vehicleId', 'siteId', 'odometer', 'battery']
      for (const field of requiredFields) {
        if (!(field in body)) {
          return res(
            ctx.status(400),
            ctx.json({ error: `Missing required field: ${field}` })
          )
        }
      }

      // Create return record
      const returnRecord = {
        id: faker.string.uuid(),
        ...body,
        by: faker.person.fullName(),
        createdAt: new Date().toISOString()
      }

      // Add to mock data
      mockReturns.unshift(returnRecord)

      // Simulate updating vehicle status
      // This would normally be handled by the backend
      console.log('Mock: Vehicle returned', {
        vehicleId: body.vehicleId,
        newSiteId: body.siteId,
        batteryLevel: body.battery
      })

      return res(ctx.status(201), ctx.json(returnRecord))
    } catch (error) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Invalid request body' })
      )
    }
  }),

  // GET /api/v1/returns - 獲取歸還記錄
  rest.get('/api/v1/returns', (req, res, ctx) => {
    if (!seedMockEnabled()) {
      return res(ctx.status(200), ctx.json([]))
    }

    const url = new URL(req.url)
    const siteId = url.searchParams.get('siteId')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let filtered = mockReturns

    // Filter by site if specified
    if (siteId) {
      filtered = mockReturns.filter(r => r.siteId === siteId)
    }

    // Apply pagination
    const paginated = filtered
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit)

    return res(ctx.status(200), ctx.json(paginated))
  }),

  // GET /api/v1/returns/:id - 獲取單一歸還記錄
  rest.get('/api/v1/returns/:id', (req, res, ctx) => {
    if (!seedMockEnabled()) {
      return res(ctx.status(404), ctx.json({ error: 'Not found' }))
    }

    const { id } = req.params
    const returnRecord = mockReturns.find(r => r.id === id)

    if (!returnRecord) {
      return res(ctx.status(404), ctx.json({ error: 'Return record not found' }))
    }

    return res(ctx.status(200), ctx.json(returnRecord))
  }),

  // GET /api/v1/returns/stats - 獲取歸還統計
  rest.get('/api/v1/returns/stats', (req, res, ctx) => {
    if (!seedMockEnabled()) {
      return res(ctx.status(200), ctx.json({
        totalReturns: 0,
        todayReturns: 0,
        avgBatteryLevel: 0,
        issueRate: 0
      }))
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayReturns = mockReturns.filter(r => 
      new Date(r.createdAt) >= today
    ).length

    const totalBattery = mockReturns.reduce((sum, r) => sum + r.battery, 0)
    const avgBatteryLevel = mockReturns.length > 0 
      ? Math.round(totalBattery / mockReturns.length) 
      : 0

    const withIssues = mockReturns.filter(r => r.issues).length
    const issueRate = mockReturns.length > 0 
      ? Math.round((withIssues / mockReturns.length) * 100) 
      : 0

    const stats = {
      totalReturns: mockReturns.length,
      todayReturns,
      avgBatteryLevel,
      issueRate
    }

    return res(ctx.status(200), ctx.json(stats))
  })
]