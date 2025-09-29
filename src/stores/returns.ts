import { defineStore } from 'pinia'
import { ref } from 'vue'
import { z } from 'zod'
import { http } from '@/lib/api'
import { useAuth } from '@/stores/auth'

function canUseStaffRentalApi(): boolean {
  try {
    const auth = useAuth()
    const role =
      auth.user?.roleId ||
      sessionStorage.getItem('penguin.role') ||
      localStorage.getItem('penguin.role') ||
      null
    const allowed = role === 'admin' || role === 'staff'
    if (!allowed) {
      console.info('[Returns] Skip staff rental API for role:', role)
    }
    return allowed
  } catch {
    return false
  }
}

// Zod Schemas
export const ReturnPayloadSchema = z.object({
  vehicleId: z.string().min(1),
  siteId: z.string().min(1),
  odometer: z.number().nonnegative(),
  battery: z.number().min(0).max(100),
  issues: z.string().optional(),
  photos: z.array(z.string().url()).optional(),
})

export const ReturnRecordSchema = ReturnPayloadSchema.extend({
  id: z.string(),
  fromSiteId: z.string().optional(),
  by: z.string().optional(),
  createdAt: z.string(), // ISO string
})

export type ReturnPayload = z.infer<typeof ReturnPayloadSchema>
export type ReturnRecord = z.infer<typeof ReturnRecordSchema>

type ReturnRecordWithMeta = ReturnRecord & {
  memberName?: string
  memberPhone?: string
  returnLocation?: string
  bikeName?: string
  bikeModel?: string
}

const KoalaRentalSchema = z.object({
  id: z.union([z.number(), z.string()]),
  bike: z
    .object({
      bike_id: z.string(),
      bike_name: z.string().optional().nullable(),
      bike_model: z.string().optional().nullable()
    })
    .optional()
    .nullable(),
  member: z
    .object({
      id: z.union([z.number(), z.string()]).optional(),
      full_name: z.string().optional().nullable(),
      phone: z.string().optional().nullable()
    })
    .optional()
    .nullable(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  rental_status: z.string(),
  pickup_location: z.string().optional().nullable(),
  return_location: z.string().optional().nullable(),
  total_fee: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable()
})

const KoalaRentalListSchema = z.object({
  count: z.number().optional(),
  next: z.unknown().optional(),
  previous: z.unknown().optional(),
  results: z.array(KoalaRentalSchema).optional()
})

function extractKoalaRentals(payload: any) {
  const parsed = KoalaRentalListSchema.safeParse(payload)
  if (parsed.success) {
    return parsed.data.results ?? []
  }
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function normalizeRentalToReturnRecord(
  rental: z.infer<typeof KoalaRentalSchema>,
  siteId?: string
): ReturnRecordWithMeta | null {
  try {
    const base = ReturnRecordSchema.parse({
      id: String(rental.id ?? crypto.randomUUID?.() ?? Date.now()),
      vehicleId: rental.bike?.bike_id ?? 'unknown',
      siteId: siteId ?? rental.return_location ?? 'unknown',
      odometer: 0,
      battery: 0,
      issues: undefined,
      photos: undefined,
      fromSiteId: undefined,
      by: rental.member?.full_name ?? '',
      createdAt:
        rental.end_time ??
        rental.updated_at ??
        rental.created_at ??
        new Date().toISOString()
    })

    const member = rental.member ?? {}
    const bike = rental.bike ?? {}

    return {
      ...base,
      memberName: member?.full_name ?? '',
      memberPhone: member?.phone ?? '',
      returnLocation: rental.return_location ?? undefined,
      bikeName: bike?.bike_name ?? undefined,
      bikeModel: bike?.bike_model ?? undefined
    }
  } catch (error) {
    console.warn('[Returns] Failed to normalize rental record:', error)
    return null
  }
}

export const useReturns = defineStore('returns', () => {
const list = ref<ReturnRecordWithMeta[]>([])
  const isLoading = ref(false)

  /**
   * 歸還車輛（實際執行）
   */
  const returnVehicle = async (payload: ReturnPayload): Promise<ReturnRecord> => {
    // Validate payload
    const validatedPayload = ReturnPayloadSchema.parse(payload)

    isLoading.value = true

    try {
      const response = await fetch('/api/v1/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedPayload)
      })

      if (!response.ok) {
        throw new Error(`歸還失敗: ${response.statusText}`)
      }

      const data = await response.json()
      const returnRecord = ReturnRecordSchema.parse(data)

      // Add to local list
      list.value.unshift(returnRecord)

      // Update related stores
      await updateRelatedStores(returnRecord)

      return returnRecord
    } catch (error) {
      console.error('Return vehicle error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 確認執行歸還（帶確認步驟的版本）
   */
  const confirmReturnVehicle = async (payload: ReturnPayload): Promise<ReturnRecord> => {
    return returnVehicle(payload)
  }

  /**
   * 獲取歸還記錄
   */
const fetchReturns = async (params?: { siteId?: string; limit?: number }) => {
    isLoading.value = true

    try {
      if (!canUseStaffRentalApi()) {
        list.value = []
        return []
      }
      const searchParams = new URLSearchParams()
      searchParams.set('limit', String(params?.limit ?? 20))
      searchParams.set('offset', '0')
      searchParams.set('rental_status', 'completed')

      const response: any = await http.get(
        `/api/rental/staff/rentals/?${searchParams.toString()}`
      )
      const payload = response?.data ?? response
      const rentals = extractKoalaRentals(payload)
      const mapped = rentals
        .map((item) => normalizeRentalToReturnRecord(item, params?.siteId))
        .filter((item): item is ReturnRecordWithMeta => Boolean(item))

      list.value = mapped
      return mapped
    } catch (error) {
      console.error('Fetch returns error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 獲取特定站點的最近歸還記錄
   */
const fetchRecentReturns = async (siteId: string, limit = 5): Promise<ReturnRecordWithMeta[]> => {
    if (!canUseStaffRentalApi()) {
      return []
    }
    try {
      const searchParams = new URLSearchParams()
      searchParams.set('limit', String(Math.max(limit * 2, 10)))
      searchParams.set('offset', '0')
      searchParams.set('rental_status', 'completed')

      const response: any = await http.get(
        `/api/rental/staff/rentals/?${searchParams.toString()}`
      )
      const payload = response?.data ?? response
      const rentals = extractKoalaRentals(payload)

      const mapped = rentals
        .map((item) => normalizeRentalToReturnRecord(item, siteId))
        .filter((item): item is ReturnRecordWithMeta => Boolean(item))

      if (mapped.length <= limit) {
        return mapped
      }

      // 嘗試依照場域名稱做模糊匹配
      try {
        const { useSites } = await import('./sites')
        const sitesStore = useSites()
        const targetSite = sitesStore.list.find((s) => s.id === siteId)
        if (targetSite) {
          const keyword = targetSite.name.toLowerCase()
          const filtered = mapped.filter((record) =>
            record.returnLocation?.toLowerCase().includes(keyword)
          )
          if (filtered.length > 0) {
            return filtered.slice(0, limit)
          }
        }
      } catch (err) {
        console.warn('[Returns] Unable to refine recent returns by site:', err)
      }

      return mapped.slice(0, limit)
    } catch (error) {
      console.error('Fetch recent returns error:', error)
      return []
    }
  }

  /**
   * 更新相關 stores
   */
  const updateRelatedStores = async (returnRecord: ReturnRecord) => {
    // Import stores dynamically to avoid circular dependencies
    const { useVehicles } = await import('./vehicles')
    const { useSites } = await import('./sites')
    
    const vehiclesStore = useVehicles()
    const sitesStore = useSites()

    // Update vehicle status and location
    const vehicleIndex = vehiclesStore.vehicles.findIndex(v => v.id === returnRecord.vehicleId)
    if (vehicleIndex !== -1) {
      vehiclesStore.vehicles[vehicleIndex] = {
        ...vehiclesStore.vehicles[vehicleIndex],
        status: 'available',
        siteId: returnRecord.siteId,
        batteryLevel: returnRecord.battery,
        lastSeen: returnRecord.createdAt
      }
    }

    // Update site available count
    const siteIndex = sitesStore.sites.findIndex(s => s.id === returnRecord.siteId)
    if (siteIndex !== -1) {
      sitesStore.sites[siteIndex] = {
        ...sitesStore.sites[siteIndex],
        availableCount: sitesStore.sites[siteIndex].availableCount + 1,
        availableSpots: Math.max(0, sitesStore.sites[siteIndex].availableSpots - 1)
      }
    }
  }

  /**
   * 清空記錄
   */
  const clearReturns = () => {
    list.value = []
  }

  return {
    list,
    isLoading,
    returnVehicle,
    confirmReturnVehicle,
    fetchReturns,
    fetchRecentReturns,
    clearReturns
  }
})
