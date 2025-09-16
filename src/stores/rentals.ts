import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Rental, CreateRentalForm } from '@/types/rental'
import { useVehicles } from '@/stores/vehicles'
import { http } from '@/lib/api'
import { useAuth } from '@/stores/auth'

export const useRentals = defineStore('rentals', () => {
  const vehiclesStore = useVehicles()
  const auth = useAuth()
  
  // State
  const current = ref<Rental | undefined>()
  const loading = ref(false)
  const error = ref<string | undefined>()

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
        res = await http.post('/api/rental/staff/rentals/', payload)
      } else {
        // member 自行租借
        const payload: any = { bike_id: form.bikeId }
        if (form.pickup_location) payload.pickup_location = form.pickup_location
        res = await http.post('/api/rental/member/rentals/', payload)
      }

      // Normalize to Rental type for UI
      const rental: Rental = {
        rentalId: String(res?.id || res?.rental_id || Date.now()),
        bikeId: form.bikeId,
        userName: form.userName,
        phone: form.phone,
        idLast4: form.idLast4,
        state: 'in_use',
        startedAt: new Date().toISOString()
      }
      current.value = rental

      // 同步更新車輛狀態
      vehiclesStore.updateVehicleStatus(form.bikeId, 'in-use')

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

  return {
    // State
    current,
    loading,
    error,

    // Actions
    createRental,
    unlockCurrent,
    cancelCurrent,
    listActiveRentals,
    returnByBikeId,
    returnByRentalId,
    setInUse,
    clearError,
    clearCurrent
  }
})
