import { rest, type RestHandler } from 'msw'
import { faker } from '@faker-js/faker'

const api = (p: string) => `/api/v1${p}`

/* ── Vehicle Return Handlers ──────────────────────────────── */

// Get site vehicles (for return modal)
const getSiteVehicles: RestHandler = rest.get(api('/sites/:siteId/vehicles'), (req, res, ctx) => {
  const siteId = req.params.siteId as string
  
  const vehicles = faker.helpers.multiple(() => ({
    id: `V-${faker.number.int({ min: 1000, max: 9999 })}`,
    name: `共享單車 ${faker.number.int({ min: 1, max: 999 })}`,
    batteryLevel: faker.number.int({ min: 15, max: 100 }),
    isAvailable: faker.datatype.boolean({ probability: 0.7 }),
    model: faker.helpers.arrayElement(['標準版', '豪華版', '運動版']),
    lastMaintenance: faker.date.recent({ days: 30 }).toISOString(),
    odometer: faker.number.int({ min: 100, max: 5000 }),
    status: faker.helpers.arrayElement(['可用', '維修中', '充電中'])
  }), { count: faker.number.int({ min: 5, max: 15 }) })

  return res(
    ctx.delay(200),
    ctx.json(vehicles)
  )
})

// Submit vehicle return
const submitReturn: RestHandler = rest.post(api('/returns'), async (req, res, ctx) => {
  const returnData = await req.json() as {
    vehicleId: string
    siteId: string
    odometer: number
    battery: number
    photos?: string[]
    notes?: string
  }

  // Simulate validation
  if (!returnData.vehicleId || !returnData.siteId) {
    return res(
      ctx.status(400),
      ctx.json({
        error: 'VALIDATION_ERROR',
        message: '車輛ID和站點ID為必填項目'
      })
    )
  }

  if (returnData.odometer < 0) {
    return res(
      ctx.status(400),
      ctx.json({
        error: 'INVALID_ODOMETER',
        message: '里程數不能為負數'
      })
    )
  }

  if (returnData.battery < 0 || returnData.battery > 100) {
    return res(
      ctx.status(400),
      ctx.json({
        error: 'INVALID_BATTERY',
        message: '電池電量必須在0-100%之間'
      })
    )
  }

  // Simulate random failure for testing error handling
  if (faker.datatype.boolean({ probability: 0.1 })) {
    return res(
      ctx.status(500),
      ctx.json({
        error: 'SYSTEM_ERROR',
        message: '系統暫時無法處理歸還請求，請稍後重試'
      })
    )
  }

  // Success response
  const returnId = `RET-${Date.now()}-${faker.string.nanoid(6)}`
  
  return res(
    ctx.delay(800), // Simulate processing time
    ctx.json({
      id: returnId,
      vehicleId: returnData.vehicleId,
      siteId: returnData.siteId,
      odometer: returnData.odometer,
      battery: returnData.battery,
      returnedAt: new Date().toISOString(),
      estimatedRevenue: faker.number.float({ min: 10, max: 50, fractionDigits: 2 }),
      status: 'completed',
      message: '車輛歸還成功'
    })
  )
})

// Get return history
const getReturns: RestHandler = rest.get(api('/returns'), (req, res, ctx) => {
  const page = parseInt(req.url.searchParams.get('page') || '1')
  const size = parseInt(req.url.searchParams.get('size') || '20')
  const vehicleId = req.url.searchParams.get('vehicleId')
  const siteId = req.url.searchParams.get('siteId')

  const returns = faker.helpers.multiple(() => ({
    id: `RET-${faker.date.recent({ days: 30 }).getTime()}-${faker.string.nanoid(6)}`,
    vehicleId: `V-${faker.number.int({ min: 1000, max: 9999 })}`,
    siteId: `S-${faker.number.int({ min: 100, max: 999 })}`,
    siteName: faker.helpers.arrayElement([
      '嘉義大學站', '嘉義車站', '文化路夜市站', 
      '嘉義公園站', '蘭潭風景區站', '檜意森活村站'
    ]),
    odometer: faker.number.int({ min: 50, max: 500 }),
    battery: faker.number.int({ min: 10, max: 100 }),
    returnedAt: faker.date.recent({ days: 30 }).toISOString(),
    estimatedRevenue: faker.number.float({ min: 5, max: 80, fractionDigits: 2 }),
    status: faker.helpers.arrayElement(['completed', 'processing', 'failed']),
    notes: faker.datatype.boolean({ probability: 0.3 }) 
      ? faker.lorem.sentence()
      : undefined
  }), { 
    count: faker.number.int({ min: 15, max: 25 })
  })

  // Filter by vehicleId if provided
  let filteredReturns = returns
  if (vehicleId) {
    filteredReturns = returns.filter(r => r.vehicleId === vehicleId)
  }
  if (siteId) {
    filteredReturns = filteredReturns.filter(r => r.siteId === siteId)
  }

  // Pagination
  const total = filteredReturns.length
  const start = (page - 1) * size
  const items = filteredReturns.slice(start, start + size)

  return res(
    ctx.delay(400),
    ctx.json({
      items,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size)
    })
  )
})

// Get return statistics
const getReturnStats: RestHandler = rest.get(api('/returns/stats'), (req, res, ctx) => {
  const startDate = req.url.searchParams.get('startDate')
  const endDate = req.url.searchParams.get('endDate')

  return res(
    ctx.delay(300),
    ctx.json({
      totalReturns: faker.number.int({ min: 500, max: 2000 }),
      successfulReturns: faker.number.int({ min: 450, max: 1900 }),
      failedReturns: faker.number.int({ min: 10, max: 100 }),
      averageOdometer: faker.number.float({ min: 50, max: 200, fractionDigits: 1 }),
      averageBattery: faker.number.float({ min: 40, max: 80, fractionDigits: 1 }),
      totalRevenue: faker.number.float({ min: 5000, max: 50000, fractionDigits: 2 }),
      topSites: faker.helpers.multiple(() => ({
        id: `S-${faker.number.int({ min: 100, max: 999 })}`,
        name: faker.helpers.arrayElement([
          '嘉義大學站', '嘉義車站', '文化路夜市站', 
          '嘉義公園站', '蘭潭風景區站', '檜意森活村站'
        ]),
        returnCount: faker.number.int({ min: 10, max: 200 })
      }), { count: 5 }),
      period: {
        startDate: startDate || faker.date.recent({ days: 30 }).toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0]
      }
    })
  )
})

// Delete/cancel return (admin only)
const deleteReturn: RestHandler = rest.delete(api('/returns/:returnId'), (req, res, ctx) => {
  const returnId = req.params.returnId as string

  // Simulate authorization check
  if (faker.datatype.boolean({ probability: 0.1 })) {
    return res(
      ctx.status(403),
      ctx.json({
        error: 'FORBIDDEN',
        message: '您沒有權限執行此操作'
      })
    )
  }

  // Simulate not found
  if (faker.datatype.boolean({ probability: 0.05 })) {
    return res(
      ctx.status(404),
      ctx.json({
        error: 'NOT_FOUND',
        message: '找不到指定的歸還記錄'
      })
    )
  }

  return res(
    ctx.delay(300),
    ctx.json({
      message: '歸還記錄已成功刪除',
      deletedId: returnId
    })
  )
})

export const returnsHandlers = [
  getSiteVehicles,
  submitReturn,
  getReturns,
  getReturnStats,
  deleteReturn
]