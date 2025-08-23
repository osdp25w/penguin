import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { z } from 'zod'
import { useVehiclesStore } from './vehicles'
import { useSitesStore } from './sites' 
import { useAlertsStore } from './alerts'

// Zod 驗證模式
export const ReturnPayloadSchema = z.object({
  vehicleId: z.string().min(1, '請選擇車輛'),
  siteId: z.string().min(1, '請選擇站點'),
  odometer: z.number().nonnegative('里程數不能為負'),
  battery: z.number().min(0, '電池電量最低 0%').max(100, '電池電量最高 100%'),
  issues: z.string().optional(),
  photos: z.array(z.string().url()).optional(),
})

export const ReturnRecordSchema = ReturnPayloadSchema.extend({
  id: z.string(),
  fromSiteId: z.string().optional(),
  by: z.string().optional(),
  createdAt: z.string(), // ISO date string
})

export type ReturnPayload = z.infer<typeof ReturnPayloadSchema>
export type ReturnRecord = z.infer<typeof ReturnRecordSchema>

export const useReturnsStore = defineStore('returns', () => {
  // State
  const list = ref<ReturnRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  const returnVehicle = async (payload: ReturnPayload): Promise<ReturnRecord> => {
    try {
      loading.value = true
      error.value = null

      // 驗證輸入資料
      const validatedPayload = ReturnPayloadSchema.parse(payload)

      // 呼叫 API
      const response = await fetch('/api/v1/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedPayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '歸還車輛失敗')
      }

      const responseData = await response.json()
      const returnRecord = ReturnRecordSchema.parse(responseData.data)

      // 更新本地狀態
      list.value.unshift(returnRecord)

      // 同步更新其他 stores
      await syncStores(returnRecord)

      // 添加成功事件到警報系統
      const alertsStore = useAlertsStore()
      alertsStore.addAlert({
        type: 'info',
        title: '車輛歸還成功',
        message: `車輛 ${returnRecord.vehicleId} 已成功歸還至 ${returnRecord.siteId}`,
        vehicleId: returnRecord.vehicleId,
        siteId: returnRecord.siteId,
      })

      return returnRecord
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知錯誤'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchReturns = async (siteId?: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const params = new URLSearchParams()
      if (siteId) params.append('siteId', siteId)

      const response = await fetch(`/api/v1/returns?${params}`)
      
      if (!response.ok) {
        throw new Error('獲取歸還記錄失敗')
      }

      const responseData = await response.json()
      const returns = z.array(ReturnRecordSchema).parse(responseData.data)
      
      if (siteId) {
        // 如果是特定站點，合併到列表中
        const existingIds = new Set(list.value.map(r => r.id))
        const newReturns = returns.filter(r => !existingIds.has(r.id))
        list.value.push(...newReturns)
      } else {
        // 全部替換
        list.value = returns
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '獲取歸還記錄失敗'
      error.value = message
      console.error('Fetch returns error:', err)
    } finally {
      loading.value = false
    }
  }

  // 同步其他 stores 的狀態
  const syncStores = async (returnRecord: ReturnRecord) => {
    // 更新車輛狀態
    const vehiclesStore = useVehiclesStore()
    await vehiclesStore.updateVehicle(returnRecord.vehicleId, {
      status: 'available',
      siteId: returnRecord.siteId,
      batteryLevel: returnRecord.battery,
      odometer: returnRecord.odometer,
      lastUpdated: returnRecord.createdAt,
    })

    // 更新站點可用車輛數
    const sitesStore = useSitesStore()
    await sitesStore.updateSiteStats(returnRecord.siteId)
    
    // 如果是跨站歸還，也更新原站點
    if (returnRecord.fromSiteId && returnRecord.fromSiteId !== returnRecord.siteId) {
      await sitesStore.updateSiteStats(returnRecord.fromSiteId)
    }
  }

  // 獲取站點最近歸還記錄
  const getRecentReturns = (siteId: string, limit = 5): ReturnRecord[] => {
    return list.value
      .filter(r => r.siteId === siteId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  }

  // 清空錯誤狀態
  const clearError = () => {
    error.value = null
  }

  // 重置狀態
  const reset = () => {
    list.value = []
    loading.value = false
    error.value = null
  }

  return {
    // State
    list: readonly(list),
    loading: readonly(loading),
    error: readonly(error),
    
    // Actions
    returnVehicle,
    fetchReturns,
    getRecentReturns,
    clearError,
    reset,
  }
})