import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReturns } from '@/stores/returns'

// Mock fetch
global.fetch = vi.fn()

const mockFetch = fetch as any

describe('useReturns Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const store = useReturns()
    
    expect(store.isSubmitting).toBe(false)
    expect(store.error).toBe('')
    expect(store.lastReturn).toBeNull()
    expect(store.siteVehicles).toEqual([])
    expect(store.loadingSiteVehicles).toBe(false)
  })

  describe('submitReturn', () => {
    it('should successfully submit a return', async () => {
      const store = useReturns()
      const returnPayload = {
        vehicleId: 'V-1234',
        siteId: 'S-001',
        odometer: 150,
        battery: 80
      }

      const mockResponse = {
        id: 'RET-123',
        ...returnPayload,
        returnedAt: '2024-01-01T00:00:00Z',
        status: 'completed'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await store.submitReturn(returnPayload)

      expect(store.isSubmitting).toBe(false)
      expect(store.error).toBe('')
      expect(store.lastReturn).toEqual(mockResponse)
      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('/api/v1/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnPayload)
      })
    })

    it('should handle validation errors', async () => {
      const store = useReturns()
      const invalidPayload = {
        vehicleId: '',
        siteId: 'S-001',
        odometer: -10,
        battery: 150
      }

      await expect(store.submitReturn(invalidPayload)).rejects.toThrow()
      expect(store.error).toContain('驗證失敗')
    })

    it('should handle API errors', async () => {
      const store = useReturns()
      const returnPayload = {
        vehicleId: 'V-1234',
        siteId: 'S-001',
        odometer: 150,
        battery: 80
      }

      const errorResponse = {
        error: 'VALIDATION_ERROR',
        message: '車輛ID和站點ID為必填項目'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse)
      })

      await expect(store.submitReturn(returnPayload)).rejects.toThrow()
      expect(store.error).toBe('車輛ID和站點ID為必填項目')
      expect(store.isSubmitting).toBe(false)
    })

    it('should handle network errors', async () => {
      const store = useReturns()
      const returnPayload = {
        vehicleId: 'V-1234',
        siteId: 'S-001',
        odometer: 150,
        battery: 80
      }

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(store.submitReturn(returnPayload)).rejects.toThrow()
      expect(store.error).toBe('網路連線錯誤，請檢查網路狀態')
      expect(store.isSubmitting).toBe(false)
    })
  })

  describe('fetchSiteVehicles', () => {
    it('should successfully fetch site vehicles', async () => {
      const store = useReturns()
      const siteId = 'S-001'
      const mockVehicles = [
        {
          id: 'V-1234',
          name: '共享單車 123',
          batteryLevel: 80,
          isAvailable: true,
          model: '標準版'
        },
        {
          id: 'V-5678',
          name: '共享單車 456',
          batteryLevel: 60,
          isAvailable: true,
          model: '豪華版'
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVehicles)
      })

      await store.fetchSiteVehicles(siteId)

      expect(store.loadingSiteVehicles).toBe(false)
      expect(store.siteVehicles).toEqual(mockVehicles)
      expect(store.error).toBe('')
      expect(fetch).toHaveBeenCalledWith(`/api/v1/sites/${siteId}/vehicles`)
    })

    it('should handle empty site ID', async () => {
      const store = useReturns()
      
      await store.fetchSiteVehicles('')

      expect(store.siteVehicles).toEqual([])
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should handle fetch errors', async () => {
      const store = useReturns()
      const siteId = 'S-001'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await store.fetchSiteVehicles(siteId)

      expect(store.loadingSiteVehicles).toBe(false)
      expect(store.siteVehicles).toEqual([])
      expect(store.error).toContain('取得站點車輛失敗')
    })
  })

  describe('clearError', () => {
    it('should clear the error message', () => {
      const store = useReturns()
      store.error = 'Some error message'
      
      store.clearError()
      
      expect(store.error).toBe('')
    })
  })

  describe('resetForm', () => {
    it('should reset all form-related state', () => {
      const store = useReturns()
      
      // Set some state
      store.error = 'Some error'
      store.lastReturn = { id: 'RET-123' } as any
      store.siteVehicles = [{ id: 'V-1234' }] as any
      
      store.resetForm()
      
      expect(store.error).toBe('')
      expect(store.lastReturn).toBeNull()
      expect(store.siteVehicles).toEqual([])
    })
  })
})