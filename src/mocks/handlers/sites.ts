import { rest } from 'msw'
import { faker } from '@faker-js/faker'
import type { Site, SiteRegion } from '@/types/site'
import { SiteSchema } from '@/types/site'
import { z } from 'zod'

const SEED_MOCK_ENABLED = import.meta.env.VITE_SEED_MOCK === '1'

// Export function for direct use when API fails
export function getDemoSites(region?: SiteRegion): Site[] {
  const allSites: Site[] = []
  
  // Generate sites for both regions
  for (let i = 0; i < 8; i++) {
    allSites.push(generateMockSite('hualien', i))
  }
  for (let i = 0; i < 6; i++) {
    allSites.push(generateMockSite('taitung', i + 8))
  }
  
  // Filter by region if specified
  if (region) {
    return allSites.filter(site => site.region === region)
  }
  
  return allSites
}

// 區域邊界配置（從環境變數讀取）
const REGION_BOUNDS = {
  hualien: {
    minLat: 23.5,
    maxLat: 24.5,
    minLng: 121.0,
    maxLng: 122.0
  },
  taitung: {
    minLat: 22.5,
    maxLat: 23.5,
    minLng: 120.8,
    maxLng: 121.8
  }
}

// 生成隨機站點（不含真實地名）
function generateMockSite(region: SiteRegion, index: number): Site {
  const bounds = REGION_BOUNDS[region]
  const brands = ['huali', 'shunqi'] as const
  const statuses = ['active', 'maintenance', 'offline'] as const
  
  const vehicleCount = faker.number.int({ min: 0, max: 20 })
  const availableCount = faker.number.int({ min: 0, max: vehicleCount })
  
  // 電池分佈
  const remaining = vehicleCount - availableCount
  const high = faker.number.int({ min: 0, max: Math.floor(vehicleCount * 0.6) })
  const medium = faker.number.int({ min: 0, max: Math.max(0, vehicleCount - high) })
  const low = Math.max(0, vehicleCount - high - medium)

  const site: Site = {
    id: `site_${region}_${index}`,
    name: `${region === 'hualien' ? 'HL' : 'TT'}-站點${String(index).padStart(2, '0')}`,
    region,
    location: {
      lat: faker.number.float({ min: bounds.minLat, max: bounds.maxLat, fractionDigits: 6 }),
      lng: faker.number.float({ min: bounds.minLng, max: bounds.maxLng, fractionDigits: 6 })
    },
    status: faker.helpers.arrayElement(statuses),
    brand: faker.helpers.arrayElement(brands),
    vehicleCount,
    availableCount,
    batteryLevels: { high, medium, low },
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: faker.date.recent({ days: 7 }).toISOString()
  }

  return SiteSchema.parse(site)
}

// 生成站點資料
function generateSites(region?: SiteRegion): Site[] {
  if (!SEED_MOCK_ENABLED) {
    return []
  }

  const regions = region ? [region] : ['hualien', 'taitung'] as const
  const sites: Site[] = []

  regions.forEach(r => {
    const count = faker.number.int({ min: 3, max: 8 })
    for (let i = 1; i <= count; i++) {
      sites.push(generateMockSite(r, i))
    }
  })

  return sites
}

// URL 參數解析
const RegionQuerySchema = z.object({
  region: z.enum(['hualien', 'taitung']).optional()
})

export const sitesHandlers = [
  rest.get('/api/v1/sites', (req, res, ctx) => {
    try {
      // 解析查詢參數
      const url = new URL(req.url)
      const queryParams = Object.fromEntries(url.searchParams.entries())
      const { region } = RegionQuerySchema.parse(queryParams)
      
      // 生成資料
      const sites = generateSites(region)
      
      // 模擬延遲
      const delay = faker.number.int({ min: 100, max: 500 })
      
      return res(
        ctx.delay(delay),
        ctx.status(200),
        ctx.json(sites)
      )
    } catch (error) {
      console.error('[MSW] Sites API error:', error)
      return res(
        ctx.status(400),
        ctx.json({ 
          error: 'Invalid request parameters',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      )
    }
  }),

  rest.get('/api/v1/metrics/site/:id', (req, res, ctx) => {
    const { id } = req.params
    
    if (!SEED_MOCK_ENABLED) {
      return res(
        ctx.status(200),
        ctx.json({
          kpi: { totalVehicles: 0, availableVehicles: 0, batteryAvg: 0 },
          trend: []
        })
      )
    }
    
    return res(
      ctx.delay(200),
      ctx.status(200),
      ctx.json({
        kpi: {
          totalVehicles: faker.number.int({ min: 5, max: 20 }),
          availableVehicles: faker.number.int({ min: 1, max: 15 }),
          batteryAvg: faker.number.int({ min: 40, max: 90 })
        },
        trend: Array.from({ length: 7 }, (_, i) => ({
          timestamp: Date.now() - (6 - i) * 24 * 60 * 60 * 1000,
          value: faker.number.int({ min: 10, max: 25 })
        }))
      })
    )
  })
]