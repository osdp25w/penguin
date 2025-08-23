import { rest } from 'msw'
import { faker } from '@faker-js/faker'
import type { Vehicle } from '@/types/vehicle'
import { VehicleSchema } from '@/types/vehicle'
import { z } from 'zod'

const SEED_MOCK_ENABLED = import.meta.env.VITE_SEED_MOCK === '1'

function generateMockVehicle(siteId: string, index: number): Vehicle {
  const statuses = ['available', 'rented', 'maintenance', 'charging'] as const
  const brands = ['huali', 'shunqi'] as const
  const models = ['EBike-Pro', 'EBike-Lite', 'Urban-E', 'City-Rider']

  const vehicle: Vehicle = {
    id: `vehicle_${siteId}_${String(index).padStart(3, '0')}`,
    siteId,
    model: faker.helpers.arrayElement(models),
    batteryLevel: faker.number.int({ min: 15, max: 100 }),
    status: faker.helpers.arrayElement(statuses),
    location: {
      lat: faker.number.float({ min: 23.0, max: 24.5, fractionDigits: 6 }),
      lng: faker.number.float({ min: 121.0, max: 122.0, fractionDigits: 6 })
    },
    brand: faker.helpers.arrayElement(brands),
    lastUpdate: faker.date.recent({ days: 1 }).toISOString(),
    createdAt: faker.date.past({ years: 1 }).toISOString()
  }

  return VehicleSchema.parse(vehicle)
}

function generateVehicles(siteId: string): Vehicle[] {
  if (!SEED_MOCK_ENABLED) {
    return []
  }

  const count = faker.number.int({ min: 2, max: 8 })
  const vehicles: Vehicle[] = []

  for (let i = 1; i <= count; i++) {
    vehicles.push(generateMockVehicle(siteId, i))
  }

  return vehicles
}

const VehicleQuerySchema = z.object({
  siteId: z.string().min(1)
})

export const vehiclesHandlers = [
  rest.get('/api/v1/vehicles', (req, res, ctx) => {
    try {
      const url = new URL(req.url)
      const queryParams = Object.fromEntries(url.searchParams.entries())
      const { siteId } = VehicleQuerySchema.parse(queryParams)
      
      const vehicles = generateVehicles(siteId)
      const delay = faker.number.int({ min: 100, max: 400 })
      
      return res(
        ctx.delay(delay),
        ctx.status(200),
        ctx.json(vehicles)
      )
    } catch (error) {
      console.error('[MSW] Vehicles API error:', error)
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