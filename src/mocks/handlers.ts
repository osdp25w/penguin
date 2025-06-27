// src/mocks/handlers.ts
import { rest } from 'msw'
import { faker } from '@faker-js/faker'

/* -------------------------------------------------------------- */
/*  共用：自動補上 /api/v1                                         */
/* -------------------------------------------------------------- */
const api = (path: string) => `/api/v1${path}`

/* -------------------------------------------------------------- */
/* 1️⃣ KPI Summary                                                */
/* -------------------------------------------------------------- */
const summary = rest.get(api('/metrics/summary'), (_, res, ctx) =>
  res(
    ctx.delay(300),
    ctx.json({
      online  : faker.number.int({ min: 30, max: 60 }),
      offline : faker.number.int({ min:  1, max: 20 }),
      distance: faker.number.int({ min: 50, max: 200 }),
      carbon  : faker.number.float({ min: 5,  max: 20, fractionDigits: 1 })
    })
  )
)

/* -------------------------------------------------------------- */
/* 2️⃣ Vehicles（分頁）                                            */
/* -------------------------------------------------------------- */
const vehicles = rest.get(api('/vehicles'), (req, res, ctx) => {
  const page  = Number(req.url.searchParams.get('page') ?? '1')
  const size  = Number(req.url.searchParams.get('size') ?? '20')
  const total = 200

  const items = Array.from({ length: size }).map(() => ({
    id      : faker.string.nanoid(8),
    name    : `Bike ${faker.number.int({ min: 1, max: 999 })}`,
    soc     : faker.number.int({ min: 10, max: 100 }),
    lastSeen: faker.date.recent({ days: 1 }).toISOString()
  }))

  return res(
    ctx.delay(300),
    ctx.json({ items, total, page, size })
  )
})

/* -------------------------------------------------------------- */
/* 3️⃣ Batteries（一覽）                                           */
/* -------------------------------------------------------------- */
const batteries = rest.get(api('/batteries'), (_, res, ctx) => {
  const list = Array.from({ length: 16 }).map(() => ({
    id        : faker.string.nanoid(10),        // 電池 ID
    vehicleId : faker.string.numeric(4),        // 車輛 ID
    health    : faker.number.int({ min: 60, max: 100 }),
    cycles    : faker.number.int({ min: 50, max: 800 }),
    temp      : faker.number.int({ min: 15, max: 45 }),
    updatedAt : faker.date.recent().toISOString()
  }))

  return res(
    ctx.delay(300),
    ctx.json(list)
  )
})

/* -------------------------------------------------------------- */
/* 4️⃣ Alerts（中文訊息 + 'warning' 等級）                         */
/* -------------------------------------------------------------- */
const zhMessages = [
  '控制器溫度過高，請檢查散熱！',
  '電池放電溫度超過 60°C，系統已降載',
  '電池充電溫度超過 45°C，已停止充電',
  '偵測到異常電流，建議立即維修',
  'GPS 訊號異常，無法定位',
  '設備長時間離線，請巡檢'
]

const alertsOpen = rest.get(api('/alerts'), (_, res, ctx) => {
  const list = Array.from({ length: 6 }).map(() => ({
    id       : faker.string.nanoid(10),
    vehicleId: faker.string.numeric(4),
    severity : faker.helpers.arrayElement(['info', 'warning', 'critical']),
    message  : faker.helpers.arrayElement(zhMessages),
    ts       : faker.date.recent().toISOString()
  }))

  return res(
    ctx.delay(120),
    ctx.json(list)
  )
})

/* -------------------------------------------------------------- */
/* 5️⃣ Auth-Login（最小可用登入）                                  */
/* -------------------------------------------------------------- */
const login = rest.post(api('/auth/login'), async (req, res, ctx) => {
  const { email } = await req.json() as { email: string; password: string }
  return res(
    ctx.delay(400),
    ctx.json({
      token: faker.string.nanoid(24),
      user : { id: 'u_' + faker.string.nanoid(6), name: email.split('@')[0] }
    })
  )
})

/* -------------------------------------------------------------- */
/*  匯出全部 handler                                               */
/* -------------------------------------------------------------- */
export const handlers = [
  summary,
  vehicles,
  batteries,
  alertsOpen,
  login
]
