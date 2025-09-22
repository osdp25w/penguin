// src/stores/telemetry.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/lib/api'

export type TelemetryStatus = 'available' | 'in-use' | 'maintenance' | 'disabled' | 'deployed'

export interface TelemetryDevice {
  IMEI: string
  name?: string
  model?: string
  status?: TelemetryStatus
  bike?: {
    bike_id?: string
    bike_name?: string
    bike_model?: string
    series_id?: number
    category_id?: number
  } | null
  created_at?: string
  updated_at?: string
}

export const useTelemetry = defineStore('telemetry', () => {
  const devices = ref<TelemetryDevice[]>([])
  const available = ref<TelemetryDevice[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  // 始終保持完整的狀態選項列表
  const statusOptions = ref<string[]>(['available', 'in-use', 'maintenance', 'disabled', 'deployed'])

  function normalizeStatus(input?: string): TelemetryStatus {
    const s = String(input || '').toLowerCase().trim()
    if (s === 'available' || s === 'idle' || s === 'free') return 'available'
    if (s === 'maintenance' || s === 'maintain') return 'maintenance'
    if (s === 'disabled' || s === 'inactive') return 'disabled'
    if (s === 'in-use' || s === 'in_use' || s === 'used' || s === 'assigned' || s === 'bound') return 'in-use'
    if (s === 'deployed' || s === 'deploy') return 'deployed'
    return 'available'
  }

  async function fetchDevices(params?: { status?: TelemetryStatus; model?: string; IMEI_q?: string }) {
    loading.value = true
    error.value = null
    try {
      const qs = new URLSearchParams()
      if (params?.status) qs.set('status', params.status)
      if (params?.model) qs.set('model', params.model)
      if (params?.IMEI_q) qs.set('IMEI_q', params.IMEI_q)
      const url = `/api/telemetry/devices/${qs.toString() ? `?${qs.toString()}` : ''}`
      const res: any = await http.get(url)

      // 處理 Koala API 格式
      if (res && res.code === 2000 && res.data) {
        const rows = res.data || []
        devices.value = rows.map((r: any) => ({
          IMEI: r.IMEI || r.imei || r.id,
          name: r.name,
          model: r.model,
          status: normalizeStatus(r.status),
          bike: r.bike || null,
          created_at: r.created_at,
          updated_at: r.updated_at
        }))
        error.value = null
        console.log('[Telemetry] API success:', devices.value.length, 'devices loaded')
        return
      }

      // 降級處理：嘗試舊格式
      const rows = res?.results || res?.data || res || []
      devices.value = rows.map((r: any) => ({
        IMEI: r.IMEI || r.imei || r.id,
        name: r.name,
        model: r.model,
        status: normalizeStatus(r.status),
        bike: r.bike || null,
        created_at: r.created_at,
        updated_at: r.updated_at
      }))
      console.log('[Telemetry] Fallback format used:', devices.value.length, 'devices loaded')
    } catch (e: any) {
      console.warn('[Telemetry] API call failed, using mock data:', e)
      // fallback demo
      devices.value = [
        { IMEI: '867295075673001', name: 'TD-001', model: 'TD-2024', status: 'available' },
        { IMEI: '867295075673002', name: 'TD-002', model: 'TD-2024', status: 'maintenance' }
      ]
      error.value = '無法讀取遙測設備（使用假資料）'
    } finally {
      loading.value = false
    }
  }

  async function fetchAvailable() {
    await fetchDevices({ status: 'available' })
    available.value = devices.value.filter(d => d.status === 'available')
  }

  async function fetchDevicesPaged(params?: { limit?: number; offset?: number; status?: TelemetryStatus; model?: string; IMEI_q?: string }): Promise<{ data: TelemetryDevice[]; total: number }> {
    const { limit = 20, offset = 0, ...filters } = params || {}
    loading.value = true
    error.value = null
    try {
      const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) })
      if (filters.status) qs.set('status', filters.status)
      if (filters.model) qs.set('model', filters.model)
      if (filters.IMEI_q) qs.set('IMEI_q', filters.IMEI_q)
      const url = `/api/telemetry/devices/${qs.toString() ? `?${qs.toString()}` : ''}`
      const res: any = await http.get(url)

      // 處理 Koala API 格式
      if (res && res.code === 2000 && res.data) {
        const dataSection = res.data
        let rows = []
        let total = 0

        // 檢查是否有分頁結構
        if (Array.isArray(dataSection)) {
          rows = dataSection
          total = dataSection.length
        } else if (dataSection.results) {
          rows = dataSection.results
          total = dataSection.count || rows.length
        } else {
          rows = dataSection
          total = Array.isArray(rows) ? rows.length : 0
        }

        const out: TelemetryDevice[] = rows.map((r: any) => ({
          IMEI: r.IMEI || r.imei || r.id,
          name: r.name,
          model: r.model,
          status: normalizeStatus(r.status),
          bike: r.bike || null,
          created_at: r.created_at,
          updated_at: r.updated_at
        }))

        devices.value = out
        error.value = null

        // 從實際數據中提取唯一的狀態值（可選：用於將來擴展）
        const uniqueStatuses = [...new Set(rows.map((r: any) => normalizeStatus(r.status)))]
        console.log('[Telemetry] Unique statuses from current data:', uniqueStatuses)

        // 確保狀態選項始終包含完整列表（不覆蓋）
        console.log('[Telemetry] Current status options:', statusOptions.value)

        console.log('[Telemetry] Paged API success:', out.length, 'devices loaded, total:', total)
        return { data: out, total }
      }

      // 降級處理：嘗試舊格式
      const rows = res?.results || res?.data || res || []
      const total = res?.total_count || res?.count || rows.length
      const out: TelemetryDevice[] = rows.map((r: any) => ({
        IMEI: r.IMEI || r.imei || r.id,
        name: r.name,
        model: r.model,
        status: normalizeStatus(r.status),
        bike: r.bike || null,
        created_at: r.created_at,
        updated_at: r.updated_at
      }))
      devices.value = out
      console.log('[Telemetry] Fallback paged format used:', out.length, 'devices loaded')
      return { data: out, total }
    } catch (e: any) {
      console.warn('[Telemetry] Paged API call failed, using mock data:', e)
      // fallback demo
      const all: TelemetryDevice[] = [
        { IMEI: '867295075673001', name: 'TD-001', model: 'TD-2024', status: 'available' },
        { IMEI: '867295075673002', name: 'TD-002', model: 'TD-2024', status: 'maintenance' },
        { IMEI: '867295075673003', name: 'TD-003', model: 'TD-2024-IoT', status: 'available' }
      ]
      const filtered = all.filter(d =>
        (!filters.status || d.status === filters.status) &&
        (!filters.model || (d.model || '').includes(filters.model)) &&
        (!filters.IMEI_q || d.IMEI.includes(filters.IMEI_q))
      )
      const data = filtered.slice(offset, offset + limit) as TelemetryDevice[]
      devices.value = data
      error.value = '無法讀取遙測設備（使用假資料）'
      return { data, total: filtered.length }
    } finally {
      loading.value = false
    }
  }

  async function fetchDeviceStatusOptions() {
    // 此函數現在主要用於向後兼容，狀態選項已預設初始化
    console.log('[Telemetry] fetchDeviceStatusOptions called, but status options already initialized:', statusOptions.value)

    // 可選：嘗試從 API 獲取額外的狀態選項（但不覆蓋預設值）
    try {
      const res: any = await http.get('/api/telemetry/device-status-options/')
      console.log('[Telemetry] Status options API response:', res)

      if (res && res.code === 2000 && res.data) {
        const data = res.data
        const options = data.status_options || data

        if (Array.isArray(options)) {
          // 從 API 選項中提取新的狀態（如果有）
          const apiStatuses = options.map((opt: any) => {
            const val = typeof opt === 'string' ? opt : (opt.value || opt)
            return normalizeStatus(String(val))
          })

          // 合併新狀態到現有列表（不覆蓋）
          const merged = [...new Set([...statusOptions.value, ...apiStatuses])]
          if (merged.length > statusOptions.value.length) {
            statusOptions.value = merged
            console.log('[Telemetry] Added new status options from API:', merged)
          }
        }
      }
    } catch (e: any) {
      // 靜默處理錯誤，因為已有預設值
      console.log('[Telemetry] Status options API call failed (using defaults):', e.message)
    }
  }

  async function createDevice(payload: TelemetryDevice) {
    try {
      const res: any = await http.post('/api/telemetry/devices/', {
        IMEI: payload.IMEI,
        name: payload.name,
        model: payload.model,
        status: payload.status || 'available'
      })

      // 檢查 Koala API 回應
      if (res && res.code === 2000) {
        console.log('[Telemetry] Device created successfully:', payload.IMEI)
        await fetchDevices()
        return res.data || res
      }

      // 降級處理
      await fetchDevices()
      return res
    } catch (e: any) {
      console.error('[Telemetry] Failed to create device:', e)
      throw e
    }
  }

  async function updateDevice(IMEI: string, patch: Partial<TelemetryDevice>) {
    try {
      const res: any = await http.patch(`/api/telemetry/devices/${IMEI}/`, patch)

      // 檢查 Koala API 回應
      if (res && res.code === 2000) {
        console.log('[Telemetry] Device updated successfully:', IMEI)
        await fetchDevices()
        return res.data || res
      }

      // 降級處理
      await fetchDevices()
      return res
    } catch (e: any) {
      console.error('[Telemetry] Failed to update device:', e)
      throw e
    }
  }

  async function deleteDevice(IMEI: string) {
    try {
      const res: any = await http.del(`/api/telemetry/devices/${IMEI}/`)

      // 檢查 Koala API 回應
      if (res && (res.code === 2000 || res.status === 204)) {
        console.log('[Telemetry] Device deleted successfully:', IMEI)
      }

      await fetchDevices()
    } catch (e: any) {
      console.error('[Telemetry] Failed to delete device:', e)
      throw e
    }
  }

  return { devices, available, loading, error, statusOptions, fetchDevices, fetchAvailable, fetchDevicesPaged, fetchDeviceStatusOptions, createDevice, updateDevice, deleteDevice, normalizeStatus }
})
