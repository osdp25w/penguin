import { rest } from 'msw'
import { faker } from '@faker-js/faker'

const SEED_MOCK_ENABLED = import.meta.env.VITE_SEED_MOCK === '1'

// 生成新格式的車輛資料
function generateNewVehicleData() {
  if (!SEED_MOCK_ENABLED) {
    return { total: 0, vehicles: [] }
  }

  const vehicles = []
  const names = ['Bike0594', 'Bike0123', 'Bike0456', 'Bike0789', 'Bike0321', 'Bike0654', 'Bike0987', 'Bike0111', 'Bike0222', 'Bike0333',
                 '花蓮號', '太魯閣號', '七星潭號', '清水斷崖號', '慈濟號', '東大門號', '鯉魚潭號', '瑞穗號', '玉里號', '富里號',
                 '光復號', '鳳林號', '萬榮號', '秀林號', '新城號', '吉安號', '壽豐號', '豐濱號', '卓溪號', '紅葉號',
                 '天祥號', '合歡號', '慕谷慕魚號', '砂卡礑號', '白楊號', '燕子口號', '九曲洞號', '長春祠號', '布洛灣號', '綠水號',
                 '文山號', '西寶號']
  const componentStatuses = ['normal', 'warning', 'error', 'offline']
  const siteIds = ['site-001', 'site-002', 'site-003', 'site-004', 'site-005']

  for (let i = 0; i < 42; i++) {
    const socPct = faker.number.int({ min: 5, max: 100 })
    const status = faker.helpers.arrayElement(['available', 'in-use', 'maintenance', 'charging', 'low-battery'])
    
    const vehicle = {
      id: `KU-${faker.string.alphanumeric({ length: 1, casing: 'upper' })}_${faker.string.alphanumeric({ length: 4 })}-${String(i + 1).padStart(2, '0')}`,
      name: names[i] || `Bike${String(i).padStart(4, '0')}`,
      device_id: `KU-${faker.string.alphanumeric({ length: 1, casing: 'upper' })}_${faker.string.alphanumeric({ length: 4 })}-${String(i + 1).padStart(2, '0')}`,
      soc_pct: socPct,
      batteryLevel: socPct,
      batteryPct: socPct,
      motor: faker.string.alphanumeric({ length: 5 }),
      battery: faker.string.alphanumeric({ length: 5 }),
      controller: faker.string.alphanumeric({ length: 6 }),
      port: faker.number.int({ min: 1024, max: 9999 }),
      mqtt_ok: faker.datatype.boolean(),
      
      // 轉換為UI需要的欄位
      motorStatus: faker.helpers.arrayElement(componentStatuses),
      batteryStatus: faker.helpers.arrayElement(componentStatuses),
      controllerStatus: faker.helpers.arrayElement(componentStatuses),
      portStatus: faker.helpers.arrayElement(componentStatuses),
      mqttStatus: faker.datatype.boolean() ? 'online' : 'offline',
      
      // 其他必要欄位
      siteId: faker.helpers.arrayElement([...siteIds, undefined]),
      status,
      
      // 使用人資訊（僅在使用中時有值）
      registeredUser: status === 'in-use' ? `${faker.person.lastName()}${faker.person.firstName()} (${faker.phone.number('09##-###-###')})` : null,
      model: faker.helpers.arrayElement(['EBike-Pro', 'EBike-Lite', 'Urban-E', 'City-Rider']),
      brand: faker.helpers.arrayElement(['huali', 'shunqi']),
      location: {
        lat: faker.number.float({ min: 23.8, max: 24.1, fractionDigits: 6 }),
        lng: faker.number.float({ min: 121.5, max: 121.7, fractionDigits: 6 })
      },
      lat: faker.number.float({ min: 23.8, max: 24.1, fractionDigits: 6 }),
      lon: faker.number.float({ min: 121.5, max: 121.7, fractionDigits: 6 }),
      speedKph: faker.number.int({ min: 0, max: 25 }),
      signal: faker.helpers.arrayElement(['良好', '中等', '弱']),
      lastSeen: faker.date.recent({ days: 1 }).toISOString(),
      lastUpdate: faker.date.recent({ days: 1 }).toISOString(),
      createdAt: faker.date.past({ years: 1 }).toISOString(),
      
      // 電池相關
      soh: faker.number.int({ min: 65, max: 100 }),
      predictedRangeKm: faker.number.int({ min: 15, max: 80 }),
      chargeCycles: faker.number.int({ min: 50, max: 1200 }),
      predictedReplaceAt: faker.helpers.maybe(() => faker.date.future({ years: 2 }).toISOString()),
      
      // 電池趨勢資料
      batteryTrend: Array.from({ length: 7 }, (_, j) => ({
        t: Date.now() - (6 - j) * 24 * 60 * 60 * 1000,
        v: Math.max(0, Math.min(100, socPct + faker.number.int({ min: -20, max: 20 })))
      }))
    }
    
    vehicles.push(vehicle)
  }

  return {
    total: 42,
    vehicles
  }
}

// 為地圖API生成站點車輛
function generateVehiclesBySite(siteId: string) {
  if (!SEED_MOCK_ENABLED) {
    return []
  }

  const allData = generateNewVehicleData()
  return allData.vehicles.filter(v => v.siteId === siteId).slice(0, faker.number.int({ min: 2, max: 8 }))
}

export const vehiclesHandlers = [
  // 原有的 by siteId API (地圖用)
  rest.get('/api/v1/vehicles', (req, res, ctx) => {
    try {
      const url = new URL(req.url)
      const siteId = url.searchParams.get('siteId')
      
      if (!siteId) {
        return res(
          ctx.status(400),
          ctx.json({ error: 'siteId parameter is required' })
        )
      }
      
      const vehicles = generateVehiclesBySite(siteId)
      const delay = faker.number.int({ min: 100, max: 400 })
      
      return res(
        ctx.delay(delay),
        ctx.status(200),
        ctx.json(vehicles)
      )
    } catch (error) {
      console.error('[MSW] Vehicles API error:', error)
      return res(
        ctx.status(500),
        ctx.json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      )
    }
  }),

  // 新的車輛清單 API (支援篩選)
  rest.get('/api/v1/vehicles/list', (req, res, ctx) => {
    try {
      const allData = generateNewVehicleData()
      
      if (!SEED_MOCK_ENABLED) {
        return res(ctx.status(200), ctx.json([]))
      }

      const url = new URL(req.url)
      const siteId = url.searchParams.get('siteId')
      const keyword = url.searchParams.get('keyword')
      const status = url.searchParams.get('status')
      const sohLt = url.searchParams.get('soh_lt')

      let vehicles = allData.vehicles

      // 篩選邏輯
      if (siteId) {
        vehicles = vehicles.filter(v => v.siteId === siteId)
      }

      if (keyword) {
        const lowerKeyword = keyword.toLowerCase()
        vehicles = vehicles.filter(v => 
          v.id.toLowerCase().includes(lowerKeyword) ||
          v.name?.toLowerCase().includes(lowerKeyword) ||
          v.device_id?.toLowerCase().includes(lowerKeyword)
        )
      }

      if (status) {
        vehicles = vehicles.filter(v => v.status === status)
      }

      if (sohLt) {
        const threshold = parseInt(sohLt)
        vehicles = vehicles.filter(v => v.soh < threshold)
      }

      const delay = faker.number.int({ min: 200, max: 600 })

      console.log(`[MSW] Generated ${vehicles.length} vehicles for list API`)

      return res(
        ctx.delay(delay),
        ctx.status(200),
        ctx.json(vehicles)
      )
    } catch (error) {
      console.error('[MSW] Vehicles List API error:', error)
      return res(
        ctx.status(500),
        ctx.json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      )
    }
  }),

  // 車輛電池詳細資訊
  rest.get('/api/v1/metrics/vehicle/:id/battery', (req, res, ctx) => {
    try {
      if (!SEED_MOCK_ENABLED) {
        return res(ctx.status(404), ctx.json({ error: 'Not found' }))
      }

      const { id } = req.params
      
      // 生成詳細的電池資訊
      const batteryMetrics = {
        vehicleId: id,
        currentBattery: faker.number.int({ min: 15, max: 100 }),
        soh: faker.number.int({ min: 65, max: 100 }),
        predictedRangeKm: faker.number.int({ min: 15, max: 80 }),
        chargeCycles: faker.number.int({ min: 50, max: 1200 }),
        predictedReplaceAt: faker.helpers.maybe(() => 
          faker.date.future({ years: 2 }).toISOString()
        ),
        temperature: faker.number.float({ min: 15, max: 45, fractionDigits: 1 }),
        voltage: faker.number.float({ min: 48, max: 54, fractionDigits: 2 }),
        current: faker.number.float({ min: -20, max: 20, fractionDigits: 2 }),
        
        // 趨勢資料
        batteryTrend: Array.from({ length: 14 }, (_, i) => ({
          timestamp: Date.now() - (13 - i) * 24 * 60 * 60 * 1000,
          batteryLevel: faker.number.int({ min: 10, max: 100 }),
          soh: faker.number.int({ min: 70, max: 100 })
        })),
        
        // 健康度歷程 (過去 30 天)
        sohHistory: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          soh: faker.number.int({ min: 75, max: 100 })
        }))
      }

      return res(
        ctx.delay(300),
        ctx.status(200),
        ctx.json(batteryMetrics)
      )
    } catch (error) {
      console.error('[MSW] Battery Metrics API error:', error)
      return res(
        ctx.status(500),
        ctx.json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      )
    }
  })
]