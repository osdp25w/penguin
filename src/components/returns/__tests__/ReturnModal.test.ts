import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ReturnModal from '../ReturnModal.vue'
import { useReturns } from '@/stores/returns'

// Mock the stores
vi.mock('@/stores/returns')
vi.mock('@/stores/sites')

const createWrapper = (props = {}) => {
  return mount(ReturnModal, {
    props: {
      show: true,
      siteId: 'S-001',
      siteName: '測試站點',
      ...props
    },
    global: {
      plugins: [createPinia()],
      stubs: {
        teleport: true
      }
    }
  })
}

describe('ReturnModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render when show prop is true', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('[data-test="return-modal"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('歸還車輛')
      expect(wrapper.text()).toContain('測試站點')
    })

    it('should not render when show prop is false', () => {
      const wrapper = createWrapper({ show: false })
      expect(wrapper.find('[data-test="return-modal"]').exists()).toBe(false)
    })

    it('should display site name in title', () => {
      const wrapper = createWrapper({ siteName: '嘉義大學站' })
      expect(wrapper.text()).toContain('嘉義大學站')
    })
  })

  describe('form validation', () => {
    it('should show validation errors for empty required fields', async () => {
      const wrapper = createWrapper()
      
      // Try to submit without filling required fields
      await wrapper.find('form').trigger('submit.prevent')
      
      // Should show validation errors
      expect(wrapper.text()).toContain('請選擇車輛')
    })

    it('should validate odometer input', async () => {
      const wrapper = createWrapper()
      
      const odometerInput = wrapper.find('input[placeholder="請輸入里程數"]')
      await odometerInput.setValue('-100')
      await wrapper.find('form').trigger('submit.prevent')
      
      expect(wrapper.text()).toContain('里程數不能為負數')
    })

    it('should validate battery level', async () => {
      const wrapper = createWrapper()
      
      const batteryInput = wrapper.find('input[type="range"]')
      await batteryInput.setValue('150')
      await wrapper.find('form').trigger('submit.prevent')
      
      expect(wrapper.text()).toContain('電池電量必須在0-100%之間')
    })
  })

  describe('form interaction', () => {
    it('should update battery level when range input changes', async () => {
      const wrapper = createWrapper()
      
      const batteryRange = wrapper.find('input[type="range"]')
      await batteryRange.setValue('75')
      
      // Should update the display value
      expect(wrapper.text()).toContain('75%')
    })

    it('should enable/disable submit button based on form validity', async () => {
      const wrapper = createWrapper()
      
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
      
      // Fill in required fields
      const vehicleSelect = wrapper.find('select')
      await vehicleSelect.setValue('V-001')
      
      const odometerInput = wrapper.find('input[placeholder="請輸入里程數"]')
      await odometerInput.setValue('150')
      
      // Button should now be enabled
      await wrapper.vm.$nextTick()
      expect(submitButton.attributes('disabled')).toBeUndefined()
    })
  })

  describe('store integration', () => {
    it('should call fetchSiteVehicles on mount', () => {
      const mockStore = {
        fetchSiteVehicles: vi.fn(),
        siteVehicles: [],
        loading: false,
        error: ''
      }
      
      vi.mocked(useReturns).mockReturnValue(mockStore as any)
      
      createWrapper({ siteId: 'S-001' })
      
      expect(mockStore.fetchSiteVehicles).toHaveBeenCalledWith('S-001')
    })

    it('should call submitReturn when form is submitted', async () => {
      const mockStore = {
        submitReturn: vi.fn(),
        fetchSiteVehicles: vi.fn(),
        siteVehicles: [
          { id: 'V-001', name: '測試車輛', batteryLevel: 80, isAvailable: true }
        ],
        loading: false,
        error: ''
      }
      
      vi.mocked(useReturns).mockReturnValue(mockStore as any)
      
      const wrapper = createWrapper()
      
      // Fill form
      const vehicleSelect = wrapper.find('select')
      await vehicleSelect.setValue('V-001')
      
      const odometerInput = wrapper.find('input[placeholder="請輸入里程數"]')
      await odometerInput.setValue('150')
      
      const batteryRange = wrapper.find('input[type="range"]')
      await batteryRange.setValue('85')
      
      // Submit form
      await wrapper.find('form').trigger('submit.prevent')
      
      expect(mockStore.submitReturn).toHaveBeenCalledWith({
        vehicleId: 'V-001',
        siteId: 'S-001',
        odometer: 150,
        battery: 85
      })
    })
  })

  describe('error handling', () => {
    it('should display error message when store has error', () => {
      const mockStore = {
        fetchSiteVehicles: vi.fn(),
        siteVehicles: [],
        loading: false,
        error: '車輛歸還失敗'
      }
      
      vi.mocked(useReturns).mockReturnValue(mockStore as any)
      
      const wrapper = createWrapper()
      
      expect(wrapper.text()).toContain('車輛歸還失敗')
    })
  })

  describe('loading state', () => {
    it('should show loading state when submitting', () => {
      const mockStore = {
        fetchSiteVehicles: vi.fn(),
        siteVehicles: [],
        loading: true,
        error: ''
      }
      
      vi.mocked(useReturns).mockReturnValue(mockStore as any)
      
      const wrapper = createWrapper()
      
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.text()).toContain('處理中')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('events', () => {
    it('should emit close event when close button is clicked', async () => {
      const wrapper = createWrapper()
      
      const closeButton = wrapper.find('[data-test="close-button"]')
      await closeButton.trigger('click')
      
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should emit success event when return is successful', async () => {
      const mockStore = {
        submitReturn: vi.fn().mockResolvedValue({ id: 'return-123' }),
        fetchSiteVehicles: vi.fn(),
        siteVehicles: [
          { id: 'V-001', name: '測試車輛', batteryLevel: 80, isAvailable: true }
        ],
        loading: false,
        error: '',
        currentReturn: { id: 'return-123' }
      }
      
      vi.mocked(useReturns).mockReturnValue(mockStore as any)
      
      const wrapper = createWrapper()
      
      // Fill and submit form
      const vehicleSelect = wrapper.find('select')
      await vehicleSelect.setValue('V-001')
      
      const odometerInput = wrapper.find('input[placeholder="請輸入里程數"]')
      await odometerInput.setValue('150')
      
      await wrapper.find('form').trigger('submit.prevent')
      
      // Wait for async operation
      await wrapper.vm.$nextTick()
      
      expect(wrapper.emitted('success')).toBeTruthy()
    })
  })
})