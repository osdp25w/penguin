import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Rental, CreateRentalForm } from '@/types/rental'
import { useVehicles } from '@/stores/vehicles'
import { http } from '@/lib/api'
import { useAuth } from '@/stores/auth'

function unwrapKoalaResponse(res: any) {
  if (!res) return res
  if (typeof res.code === 'number' && res.code !== 2000) {
    const detail = res?.details
    let message = res?.msg || res?.message || 'Koala API error'
    if (detail) {
      if (typeof detail === 'string') message = detail
      else if (Array.isArray(detail)) message = detail.join(', ')
      else if (detail.non_field_errors && Array.isArray(detail.non_field_errors)) {
        message = detail.non_field_errors[0]
      } else if (detail.bike_id && Array.isArray(detail.bike_id)) {
        message = detail.bike_id[0]
      }
    }
    const error = new Error(message)
    ;(error as any).details = detail || res
    throw error
  }
  return res?.data ?? res
}

function mapKoalaRental(raw: any, fallback: CreateRentalForm & { member_email?: string; member_phone?: string }): Rental {
  if (!raw || typeof raw !== 'object') {
    return {
      rentalId: String(Date.now()),
      bikeId: fallback.bikeId,
      userName: fallback.userName,
      phone: fallback.phone,
      idLast4: fallback.idLast4,
      state: 'in_use',
      startedAt: new Date().toISOString()
    }
  }

  const bike = raw.bike || {}
  return {
    rentalId: String(raw.id ?? raw.rental_id ?? Date.now()),
    bikeId: bike.bike_id || fallback.bikeId,
    userName: raw.member?.full_name || fallback.userName,
    phone: raw.member?.phone || fallback.phone,
    idLast4: fallback.idLast4,
    state: raw.rental_status === 'active' ? 'in_use' : 'in_use',
    startedAt: raw.start_time || new Date().toISOString()
  }
}

export const useRentals = defineStore('rentals', () => {
  const vehiclesStore = useVehicles()
  const auth = useAuth()
  
  // State
  const current = ref<Rental | undefined>()
  const loading = ref(false)
  const error = ref<string | undefined>()
  const memberRentals = ref<any[]>([])
  const memberRentalsTotal = ref(0)
  const memberRentalsLoading = ref(false)
  const memberRentalsError = ref<string | undefined>()

  // Actions
  async function createRental(form: CreateRentalForm & { member_email?: string; member_phone?: string; memo?: string; pickup_location?: string }): Promise<Rental> {
    loading.value = true
    error.value = undefined
    try {
      const isPrivileged = (auth.user?.roleId === 'admin' || auth.user?.roleId === 'staff')
      let res: any
      if (isPrivileged) {
        const payload: any = { bike_id: form.bikeId, memo: form.memo }
        if (form.member_phone) payload.member_phone = form.member_phone
        else if (form.member_email) payload.member_email = form.member_email
        const response: any = await http.post('/api/rental/staff/rentals/', payload)
        res = unwrapKoalaResponse(response)
      } else {
        // member 自行租借
        const payload: any = { bike_id: form.bikeId }
        if (form.pickup_location) payload.pickup_location = form.pickup_location
        const response: any = await http.post('/api/rental/member/rentals/', payload)
        res = unwrapKoalaResponse(response)
      }

      const rental: Rental = mapKoalaRental(res, form)
      current.value = rental

      // 同步更新車輛狀態
      vehiclesStore.updateVehicleStatus(form.bikeId, 'in-use')

      if (!isPrivileged) {
        try {
          await fetchMemberRentals()
        } catch (fetchErr) {
          console.warn('[Rentals] Unable to refresh member rentals after create:', fetchErr)
        }
      }

      return rental
    } catch (err: any) {
      error.value = err?.message || '租借失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function unlockCurrent(): Promise<void> {
    // Koala API: 建立租借後即進入使用狀態，不需要額外 unlock API。
    return
  }

  async function cancelCurrent(): Promise<void> {
    if (!current.value) {
      return
    }

    loading.value = true
    error.value = undefined

    try {
      // Koala 若有取消租借 API 可於此補上；暫無
      
      current.value = undefined

    } catch (err) {
      error.value = err instanceof Error ? err.message : '取消失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function listActiveRentals(): Promise<any[]> {
    try {
      const isPrivileged = (auth.user?.roleId === 'admin' || auth.user?.roleId === 'staff')
      if (isPrivileged) {
        const res: any = await http.get('/api/rental/staff/rentals/active_rentals/')
        if (res && res.code === 2000 && res.data) {
          const rows = Array.isArray(res.data) ? res.data : []
          return rows
        }
        const rows = res?.data || res?.results || res || []
        return Array.isArray(rows) ? rows : []
      } else {
        const res: any = await http.get('/api/rental/member/rentals/active_rental/')
        const one = res?.data || res?.result || null
        return one ? [one] : []
      }
    } catch (error) {
      console.error('[Rentals] Failed to load active rentals:', error)
      return []
    }
  }

  async function returnByRentalId(id: string | number, opts?: { return_location?: string }): Promise<boolean> {
    try {
      const isPrivileged = (auth.user?.roleId === 'admin' || auth.user?.roleId === 'staff')
      if (isPrivileged) {
        await http.patch(`/api/rental/staff/rentals/${id}/`, { action: 'return' })
      } else {
        const payload: any = { action: 'return' }
        if (opts?.return_location) payload.return_location = opts.return_location
        await http.patch(`/api/rental/member/rentals/${id}/`, payload)
        try {
          await fetchMemberRentals()
        } catch (fetchErr) {
          console.warn('[Rentals] Unable to refresh member rentals after return:', fetchErr)
        }
      }
      return true
    } catch (error) {
      console.error('[Rentals] Return API failed:', error)
      return false
    }
  }

  async function returnByBikeId(bikeId: string, opts?: { return_location?: string }): Promise<boolean> {
    const norm = (v?: string) => String(v || '').trim().toUpperCase()
    const target = norm(bikeId)

    console.log('[Rentals] Attempting to return bike:', bikeId, 'normalized:', target)

    // 1) 先從 active_rentals 找
    let actives = await listActiveRentals()
    let found = actives.find((r: any) => {
      const bikeIdFromAPI = r?.bike?.bike_id || r?.bike_id || r?.bikeId
      const normalized = norm(bikeIdFromAPI)
      console.log('[Rentals] Comparing:', { target, bikeIdFromAPI, normalized, match: normalized === target })
      return normalized === target
    })

    console.log('[Rentals] Found in active rentals:', !!found, found ? `ID: ${found.id}` : 'none')

    // 2) 找不到就打 list 全量，再本地篩 active + 比對 id
    if (!found) {
      console.log('[Rentals] Not found in active_rentals, trying full rental list...')
      try {
        const res: any = await http.get('/api/rental/staff/rentals/')
        let rows = []

        // 處理 Koala API 格式
        if (res && res.code === 2000 && res.data) {
          rows = Array.isArray(res.data) ? res.data : []
        } else {
          rows = res?.data || res?.results || res || []
        }

        actives = Array.isArray(rows) ? rows.filter((x:any) => (x.rental_status || x.status) === 'active') : []
        console.log('[Rentals] Found', actives.length, 'active rentals in full list')

        found = actives.find((r: any) => {
          const bikeIdFromAPI = r?.bike?.bike_id || r?.bike_id || r?.bikeId
          const normalized = norm(bikeIdFromAPI)
          return normalized === target
        })

        console.log('[Rentals] Found in full list:', !!found, found ? `ID: ${found.id}` : 'none')
      } catch (err) {
        console.error('[Rentals] Error fetching full rental list:', err)
      }
    }

    if (!found) {
      console.error('[Rentals] Could not find active rental for bike:', bikeId)
      console.error('[Rentals] Available active rentals:', actives.map(r => ({
        id: r.id,
        bike_id: r?.bike?.bike_id || r?.bike_id || r?.bikeId,
        status: r.rental_status || r.status
      })))
      throw new Error('找不到該車輛的進行中租借')
    }

    const id = found.id || found.rental_id
    if (!id) throw new Error('租借 ID 缺失')

    console.log('[Rentals] Found rental to return:', { id, bikeId })

    const success = await returnByRentalId(id, opts)
    if (success) {
      console.log('[Rentals] Return successful, updating vehicle status')
      // 同步更新車輛狀態為可用
      vehiclesStore.updateVehicleStatus(bikeId, 'available')
      // 清除當前租借記錄
      if (current.value?.bikeId === bikeId) {
        current.value = undefined
      }
    }
    return success
  }

  // Helper for vehicles store
  function setInUse(bikeId: string): void {
    vehiclesStore.updateVehicleStatus(bikeId, '使用中')
  }

  function clearError(): void {
    error.value = undefined
  }

  function clearCurrent(): void {
    current.value = undefined
  }

  async function fetchMemberRentals(params?: { limit?: number; offset?: number }, opts?: { updateState?: boolean }): Promise<{ data: any[]; total: number }> {
    try {
      if (opts?.updateState !== false) {
        memberRentalsLoading.value = true
        memberRentalsError.value = undefined
      }
      const limit = params?.limit ?? 50
      const offset = params?.offset ?? 0
      const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) })
      const path = qs.toString() ? `/api/rental/member/rentals/?${qs}` : '/api/rental/member/rentals/'
      console.log('[fetchMemberRentals] Requesting:', path)
      const res: any = await http.get(path)
      console.log('[fetchMemberRentals] Raw response:', res)
      const payload = unwrapKoalaResponse(res)
      console.log('[fetchMemberRentals] After unwrap:', payload)

      let rows: any[] = []
      let total = 0

      const ensureArray = (candidate: any) => (Array.isArray(candidate) ? candidate : [])

      console.log('[fetchMemberRentals] Checking payload structure...')
      console.log('[fetchMemberRentals] payload is Array:', Array.isArray(payload))
      console.log('[fetchMemberRentals] payload.results is Array:', Array.isArray(payload?.results))
      console.log('[fetchMemberRentals] payload.data is Array:', Array.isArray(payload?.data))
      console.log('[fetchMemberRentals] payload.rentals is Array:', Array.isArray(payload?.rentals))

      if (Array.isArray(payload)) {
        console.log('[fetchMemberRentals] Using payload as array')
        rows = payload
        total = payload.length
      } else if (payload && typeof payload === 'object') {
        if (Array.isArray(payload.results)) {
          console.log('[fetchMemberRentals] Found payload.results')
          rows = payload.results
          total = payload.count ?? payload.total ?? payload.results.length
        } else if (Array.isArray(payload.data)) {
          console.log('[fetchMemberRentals] Found payload.data')
          rows = payload.data
          total = payload.count ?? payload.total ?? payload.data.length
        } else if (Array.isArray(payload.rentals)) {
          console.log('[fetchMemberRentals] Found payload.rentals')
          rows = payload.rentals
          total = payload.total ?? payload.rentals.length
        }
      }

      if (!rows.length) {
        console.log('[fetchMemberRentals] No rows found yet, checking fallback paths...')
        console.log('[fetchMemberRentals] res.data.results is Array:', Array.isArray(res?.data?.results))
        console.log('[fetchMemberRentals] res.data is Array:', Array.isArray(res?.data))
        console.log('[fetchMemberRentals] res is Array:', Array.isArray(res))
        console.log('[fetchMemberRentals] res.results is Array:', Array.isArray(res?.results))

        if (Array.isArray(res?.data?.results)) {
          console.log('[fetchMemberRentals] Using res.data.results')
          rows = res.data.results
          total = res.data.count ?? res.data.total ?? rows.length
        } else if (Array.isArray(res?.data)) {
          console.log('[fetchMemberRentals] Using res.data')
          rows = ensureArray(res.data)
          total = res?.data?.length ?? rows.length
        } else if (Array.isArray(res)) {
          console.log('[fetchMemberRentals] Using res')
          rows = res
          total = rows.length
        } else if (Array.isArray(res?.results)) {
          console.log('[fetchMemberRentals] Using res.results')
          rows = res.results
          total = res?.count ?? res?.total ?? rows.length
        }
      }

      if (!total) {
        total = res?.data?.count ?? res?.count ?? res?.total ?? rows.length
      }

      console.log('[fetchMemberRentals] Final rows:', rows)
      console.log('[fetchMemberRentals] Final total:', total)
      console.log('[fetchMemberRentals] Returning:', { data: rows, total })

      if (opts?.updateState !== false) {
        memberRentals.value = rows
        memberRentalsTotal.value = total
        memberRentalsLoading.value = false
      }
      return { data: rows, total }
    } catch (error) {
      console.error('[Rentals] Failed to load member rentals:', error)
      if (opts?.updateState !== false) {
        memberRentalsError.value = error instanceof Error ? error.message : '取得租借紀錄失敗'
        memberRentalsLoading.value = false
      }
      throw error
    }
  }

  async function fetchMemberRentalDetail(id: string | number): Promise<any | null> {
    if (!id && id !== 0) return null
    try {
      const res: any = await http.get(`/api/rental/member/rentals/${id}/`)
      return res?.data ?? res ?? null
    } catch (error) {
      console.error('[Rentals] Failed to load member rental detail:', error)
      throw error
    }
  }

  function clearMemberRentals() {
    memberRentals.value = []
    memberRentalsTotal.value = 0
    memberRentalsError.value = undefined
    memberRentalsLoading.value = false
  }

  async function fetchStaffRentals(params?: { limit?: number; offset?: number; rentalStatus?: string | string[]; search?: string; signal?: AbortSignal }): Promise<{ data: any[]; total: number }> {
    try {
      const limit = params?.limit ?? 50
      const offset = params?.offset ?? 0
      const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) })
      const rentalStatus = params?.rentalStatus
      if (Array.isArray(rentalStatus) && rentalStatus.length > 0) {
        qs.set('rental_status', rentalStatus.join(','))
      } else if (typeof rentalStatus === 'string' && rentalStatus.trim() !== '') {
        qs.set('rental_status', rentalStatus)
      }
      if (params?.search) {
        qs.set('search', params.search)
      }

      const path = qs.toString() ? `/api/rental/staff/rentals/?${qs}` : '/api/rental/staff/rentals/'
      const res: any = await http.get(path, params?.signal ? { signal: params.signal } : undefined)

      let rows: any[] = []
      let total = 0
      if (res?.code === 2000 && res?.data) {
        const section = res.data
        if (Array.isArray(section)) {
          rows = section
          total = section.length
        } else if (Array.isArray(section.results)) {
          rows = section.results
          total = section.count ?? rows.length
        } else if (Array.isArray(section.rentals)) {
          rows = section.rentals
          total = section.total ?? rows.length
        }
      }

      if (!rows.length) {
        rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.results || res?.rentals || []
        total = res?.count ?? res?.total ?? rows.length
      }

      return { data: rows, total }
    } catch (error) {
      console.error('[Rentals] Failed to load staff rentals:', error)
      throw error
    }
  }

  async function fetchStaffRentalDetail(id: string | number): Promise<any | null> {
    if (!id && id !== 0) return null
    try {
      const res: any = await http.get(`/api/rental/staff/rentals/${id}/`)
      return res?.data ?? res ?? null
    } catch (error) {
      console.error('[Rentals] Failed to load staff rental detail:', error)
      throw error
    }
  }

  return {
    // State
    current,
    loading,
    error,
    memberRentals,
    memberRentalsTotal,
    memberRentalsLoading,
    memberRentalsError,

    // Actions
    createRental,
    unlockCurrent,
    cancelCurrent,
    listActiveRentals,
    returnByBikeId,
    returnByRentalId,
    setInUse,
    clearError,
    clearCurrent,
    fetchMemberRentals,
    fetchMemberRentalDetail,
    fetchStaffRentals,
    fetchStaffRentalDetail,
    clearMemberRentals
  }
})
