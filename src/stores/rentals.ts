import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Rental, CreateRentalForm } from '@/types/rental'
import { useVehicles } from '@/stores/vehicles'

export const useRentals = defineStore('rentals', () => {
  const vehiclesStore = useVehicles()
  
  // State
  const current = ref<Rental | undefined>()
  const loading = ref(false)
  const error = ref<string | undefined>()

  // Actions
  async function createRental(form: CreateRentalForm): Promise<Rental> {
    loading.value = true
    error.value = undefined

    try {
      // 前置檢查
      const vehicle = vehiclesStore.vehicles.find(v => v.id === form.bikeId)
      if (!vehicle) {
        throw new Error('車輛不存在')
      }

      // 檢查車輛狀態
      if (vehicle.status !== '可租借') {
        throw new Error('車輛狀態不可租借')
      }

      // 檢查電量
      if (vehicle.batteryPct < 20) {
        throw new Error('車輛電量不足，需要充電')
      }

      // 檢查信號
      if (vehicle.signal === '弱') {
        throw new Error('車輛信號過弱，無法租借')
      }

      // 檢查最後更新時間
      const lastSeenTime = new Date(vehicle.lastSeen).getTime()
      const now = new Date().getTime()
      const minutesSinceLastSeen = (now - lastSeenTime) / (1000 * 60)
      
      if (minutesSinceLastSeen > 5) {
        throw new Error('車輛離線時間過長，請選擇其他車輛')
      }

      // 發送 API 請求
      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        const errorData = await response.json()
        switch (response.status) {
          case 409:
            throw new Error('車輛已被他人租借')
          case 422:
            throw new Error('表單驗證失敗')
          case 503:
            throw new Error('車輛離線，無法租借')
          default:
            throw new Error(errorData.message || '租借失敗')
        }
      }

      const rental: Rental = await response.json()
      current.value = rental
      return rental

    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知錯誤'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function unlockCurrent(): Promise<void> {
    if (!current.value) {
      throw new Error('沒有進行中的租借')
    }

    loading.value = true
    error.value = undefined

    try {
      const response = await fetch(`/api/rentals/${current.value.rentalId}/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('開鎖失敗')
      }

      const result = await response.json()
      if (current.value) {
        current.value.state = result.state
      }

    } catch (err) {
      error.value = err instanceof Error ? err.message : '開鎖失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelCurrent(): Promise<void> {
    if (!current.value) {
      return
    }

    loading.value = true
    error.value = undefined

    try {
      const response = await fetch(`/api/rentals/${current.value.rentalId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('取消租借失敗')
      }

      current.value = undefined

    } catch (err) {
      error.value = err instanceof Error ? err.message : '取消失敗'
      throw err
    } finally {
      loading.value = false
    }
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
    setInUse,
    clearError,
    clearCurrent
  }
})