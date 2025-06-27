import { rest, type RestHandler } from 'msw'
import { faker }                  from '@faker-js/faker'

const api = (p: string) => `/api/v1${p}`

/* ── 1. KPI ─────────────────────────────────────────── */
const summary = rest.get(api('/metrics/summary'), (_, res, ctx) =>
  res(
    ctx.delay(300),
    ctx.json({
      online  : faker.number.int({ min: 30, max: 60 }),
      offline : faker.number.int({ min:  1, max: 20 }),
      distance: faker.number.int({ min: 50, max: 200 }),
      carbon  : faker.number.float({ min: 5, max: 20, fractionDigits: 1 })
    })
  )
)

/* ── 2. Vehicles (分頁) ────────────────────────────── */
const vehicles = rest.get(api('/vehicles'), (req, res, ctx) => {
  const page = +req.url.searchParams.get('page')! || 1
  const size = +req.url.searchParams.get('size')! || 20
  const total = 200

  const items = Array.from({ length: size }).map(() => ({
    id          : faker.string.nanoid(8),
    name        : `Bike ${faker.number.int({ min: 1, max: 999 })}`,
    soc         : faker.number.int({ min: 10, max: 100 }),
    lastSeen    : faker.date.recent({ days: 1 }).toISOString(),

    /* ── Vehicle Management / ML 所需欄位 ── */
    motorId     : faker.string.nanoid(6),
    batteryId   : faker.string.nanoid(6),
    controllerId: faker.string.nanoid(6),

    mqttOnline  : faker.datatype.boolean(),
    mqttPort    : faker.number.int({ min: 1883, max: 1893 }),

    lat         : +faker.location.latitude().toFixed(6),
    lon         : +faker.location.longitude().toFixed(6)
  }))

  return res(ctx.delay(300), ctx.json({ items, total, page, size }))
})

/* ── 3. Batteries ──────────────────────────────────── */
const batteries = rest.get(api('/batteries'), (_, res, ctx) =>
  res(
    ctx.delay(300),
    ctx.json(
      Array.from({ length: 16 }).map(() => ({
        id        : faker.string.nanoid(10),
        vehicleId : faker.string.numeric(4),
        health    : faker.number.int({ min: 60, max: 100 }),
        cycles    : faker.number.int({ min: 50, max: 800 }),
        temp      : faker.number.int({ min: 15, max: 45 }),
        updatedAt : faker.date.recent().toISOString()
      }))
    )
  )
)

/* ── 4. Alerts ─────────────────────────────────────── */
const zhMessages = [
  '控制器溫度過高，請檢查散熱！',
  '電池放電溫度超過 60 °C，系統已降載',
  '電池充電溫度超過 45 °C，已停止充電',
  '偵測到異常電流，建議立即維修',
  'GPS 訊號異常，無法定位',
  '設備長時間離線，請巡檢'
]

const alertsOpen = rest.get(api('/alerts'), (_, res, ctx) =>
  res(
    ctx.delay(120),
    ctx.json(
      Array.from({ length: 6 }).map(() => ({
        id       : faker.string.nanoid(10),
        vehicleId: faker.string.numeric(4),
        severity : faker.helpers.arrayElement(['info', 'warning', 'critical']),
        message  : faker.helpers.arrayElement(zhMessages),
        ts       : faker.date.recent().toISOString()
      }))
    )
  )
)

/* ── 5. Auth ───────────────────────────────────────── */
const login = rest.post(api('/auth/login'), async (req, res, ctx) => {
  const { email, password } = (await req.json()) as { email: string; password: string }
  let roleId: 'admin' | 'manager' | 'user' = 'user'
  if (email === 'admin@example.com' && password === 'admin123') roleId = 'admin'

  return res(
    ctx.delay(400),
    ctx.json({
      token: faker.string.nanoid(24),
      user : { id: 'u_' + faker.string.nanoid(6), name: email.split('@')[0], email, roleId }
    })
  )
})

/* ── 6. Roles / Users ──────────────────────────────── */
const roles: RestHandler = rest.get(api('/roles'), (_, res, ctx) =>
  res(
    ctx.json([
      { id: 'admin',   name: '最高管理員', desc: '擁有全部權限',       scopes: ['admin:*'] },
      { id: 'manager', name: '一般管理者', desc: '可管理車隊與分析',   scopes: ['read:*', 'write:vehicle'] },
      { id: 'user',    name: '使用者',    desc: '僅可讀取資料',       scopes: ['read:data'] }
    ])
  )
)

const users: RestHandler = rest.get(api('/users'), (_, res, ctx) =>
  res(
    ctx.json(
      faker.helpers.multiple(() => ({
        id        : faker.string.nanoid(8),
        email     : faker.internet.email(),
        fullName  : faker.person.fullName(),
        roleId    : faker.helpers.arrayElement(['admin', 'manager', 'user']),
        active    : faker.datatype.boolean(),
        createdAt : faker.date.past().toISOString(),
        lastLogin : faker.date.recent().toISOString()
      }), { count: 24 })
    )
  )
)

/* ── 7-10. ML APIs ─────────────────────────────────── */
const mlStrategy: RestHandler = rest.post(api('/ml/strategy'), async (req, res, ctx) => {
  const { distance } = await req.json() as { distance: number }
  return res(
    ctx.delay(500),
    ctx.json({
      polyline : Array.from({ length: 10 }).map(() => ({
        lat: +faker.location.latitude().toFixed(6),
        lon: +faker.location.longitude().toFixed(6)
      })),
      estTime  : (distance / 15).toFixed(1),
      estEnergy: (distance * 0.012).toFixed(2)
    })
  )
})

const mlCarbon: RestHandler = rest.post(api('/ml/carbon'), async (req, res, ctx) => {
  const { distance } = await req.json() as { distance: number }
  return res(ctx.json({ saved: +(distance * 0.15).toFixed(2) }))
})

const mlPower: RestHandler = rest.post(api('/ml/power'), async (req, res, ctx) => {
  const { speed } = await req.json() as { speed: number }
  return res(ctx.json({
    kWh       : +(speed * 0.015).toFixed(2),
    nextCharge: '約 2 hr 後建議充電'
  }))
})

const mlBattery: RestHandler = rest.get(api('/ml/battery'), (_, res, ctx) =>
  res(
    ctx.json(
      faker.helpers.multiple(() => ({
        id     : faker.string.nanoid(8),
        health : faker.number.int({ min: 60, max: 100 }),
        faultP : +faker.number.float({ min: 0, max: 0.4, precision: 0.01 }).toFixed(2)
      }), { count: 20 })
    )
  )
)

/* ── Export handlers ───────────────────────────────── */
export const handlers = [
  summary,
  vehicles,
  batteries,
  alertsOpen,
  login,
  roles,
  users,
  mlStrategy,
  mlCarbon,
  mlPower,
  mlBattery
]
