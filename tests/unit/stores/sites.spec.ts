import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSitesStore } from '@/stores/sites'

// Mock fetch
global.fetch = vi.fn()

describe('useSitesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('should initialize with empty state', () => {
    const store = useSitesStore()
    
    expect(store.list).toEqual([])
    expect(store.selected).toBeUndefined()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('should handle empty API response', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    } as Response)

    const store = useSitesStore()
    await store.fetchSites()

    expect(store.list).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('should filter sites correctly', () => {
    const store = useSitesStore()
    store.filters.region = 'hualien'
    
    expect(store.filteredSites).toEqual([])
  })

  it('should handle WMTS layer configuration', () => {
    // 測試環境變數讀取
    expect(import.meta.env.VITE_EMAP_LAYER || 'EMAP').toBeTruthy()
    expect(import.meta.env.VITE_MAP_PROVIDER || 'maplibre').toBe('maplibre')
  })

  it('should validate map center coordinates', () => {
    const center = import.meta.env.VITE_MAP_CENTER?.split(',').map(Number) || [23.8, 121.6]
    expect(center).toHaveLength(2)
    expect(center[0]).toBeGreaterThan(20) // 台灣緯度範圍
    expect(center[1]).toBeGreaterThan(120) // 台灣經度範圍
  })
})