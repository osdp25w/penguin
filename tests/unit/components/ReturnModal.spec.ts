import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ReturnModal from '@/components/returns/ReturnModal.vue'
import { useReturns } from '@/stores/returns'

// Mock the stores
vi.mock('@/stores/returns')

const mockUseReturns = useReturns as any

describe('ReturnModal', () => {
  let wrapper: any
  let mockReturnsStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    
    mockReturnsStore = {
      isSubmitting: false,
      error: '',
      siteVehicles: [],
      loadingSiteVehicles: false,
      submitReturn: vi.fn(),
      fetchSiteVehicles: vi.fn(),
      clearError: vi.fn(),
      resetForm: vi.fn()
    }

    mockUseReturns.mockReturnValue(mockReturnsStore)

    wrapper = mount(ReturnModal, {
      props: {
        visible: true,
        selectedSite: {
          id: 'S-001',
          name: '嘉義大學站',
          location: { lat: 23.5, lng: 120.5 }
        }
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal when visible', () => {
    expect(wrapper.find('[data-testid="return-modal"]').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe('車輛歸還')
  })

  it('should not render modal when not visible', async () => {
    await wrapper.setProps({ visible: false })
    expect(wrapper.find('[data-testid="return-modal"]').exists()).toBe(false)
  })

  it('should display selected site information', () => {
    expect(wrapper.text()).toContain('嘉義大學站')
  })

  it('should fetch site vehicles when site changes', async () => {
    await wrapper.setProps({
      selectedSite: {
        id: 'S-002',
        name: '嘉義車站',
        location: { lat: 23.5, lng: 120.5 }
      }
    })

    expect(mockReturnsStore.fetchSiteVehicles).toHaveBeenCalledWith('S-002')
  })

  it('should validate form fields', async () => {
    const form = wrapper.find('form')
    
    // Try to submit empty form
    await form.trigger('submit')
    
    // Should show validation errors
    expect(wrapper.find('.text-red-600').exists()).toBe(true)
  })

  it('should display vehicles when loaded', async () => {
    mockReturnsStore.siteVehicles = [
      {
        id: 'V-1234',
        name: '共享單車 123',
        batteryLevel: 80,
        isAvailable: true
      },
      {
        id: 'V-5678',
        name: '共享單車 456',
        batteryLevel: 60,
        isAvailable: true
      }
    ]

    await wrapper.vm.$nextTick()

    const vehicleOptions = wrapper.findAll('option')
    expect(vehicleOptions.length).toBeGreaterThan(1) // Including default option
  })

  it('should show loading state when fetching vehicles', async () => {
    mockReturnsStore.loadingSiteVehicles = true
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('should validate odometer input', async () => {
    const odometerInput = wrapper.find('input[type="number"]')
    
    // Test negative value
    await odometerInput.setValue(-10)
    await odometerInput.trigger('blur')
    
    expect(wrapper.text()).toContain('里程數必須為非負數')
  })

  it('should validate battery level', async () => {
    const batteryInput = wrapper.findAll('input[type="number"]')[1]
    
    // Test invalid range
    await batteryInput.setValue(150)
    await batteryInput.trigger('blur')
    
    expect(wrapper.text()).toContain('電池電量必須在0-100%之間')
  })

  it('should show battery level indicator', async () => {
    const batteryInput = wrapper.findAll('input[type="number"]')[1]
    await batteryInput.setValue(75)
    
    expect(wrapper.find('.bg-green-500').exists()).toBe(true)
  })

  it('should submit form with valid data', async () => {
    mockReturnsStore.siteVehicles = [
      { id: 'V-1234', name: '共享單車 123', batteryLevel: 80, isAvailable: true }
    ]
    
    await wrapper.vm.$nextTick()

    // Fill form
    const vehicleSelect = wrapper.find('select')
    const odometerInput = wrapper.findAll('input[type="number"]')[0]
    const batteryInput = wrapper.findAll('input[type="number"]')[1]

    await vehicleSelect.setValue('V-1234')
    await odometerInput.setValue(150)
    await batteryInput.setValue(80)

    // Submit form
    await wrapper.find('form').trigger('submit')

    expect(mockReturnsStore.submitReturn).toHaveBeenCalledWith({
      vehicleId: 'V-1234',
      siteId: 'S-001',
      odometer: 150,
      battery: 80,
      photos: [],
      notes: ''
    })
  })

  it('should show error message when submission fails', async () => {
    mockReturnsStore.error = '提交失敗'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.text-red-700').exists()).toBe(true)
    expect(wrapper.text()).toContain('提交失敗')
  })

  it('should disable submit button when submitting', async () => {
    mockReturnsStore.isSubmitting = true
    await wrapper.vm.$nextTick()

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
    expect(submitButton.text()).toContain('處理中')
  })

  it('should emit close event when cancel button is clicked', async () => {
    const cancelButton = wrapper.findAll('button').find((btn: any) => 
      btn.text().includes('取消')
    )
    
    await cancelButton.trigger('click')
    
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should clear form when modal is closed and reopened', async () => {
    // Close modal
    await wrapper.setProps({ visible: false })
    
    // Reopen modal
    await wrapper.setProps({ visible: true })
    
    expect(mockReturnsStore.resetForm).toHaveBeenCalled()
  })

  it('should handle photo upload', async () => {
    const fileInput = wrapper.find('input[type="file"]')
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    // Mock file input change
    Object.defineProperty(fileInput.element, 'files', {
      value: [mockFile],
      writable: false,
    })
    
    await fileInput.trigger('change')
    
    // Should add photo to form data
    expect(wrapper.vm.form.photos.length).toBeGreaterThan(0)
  })

  it('should remove photos when delete button is clicked', async () => {
    // Add a photo first
    wrapper.vm.form.photos = ['data:image/jpeg;base64,test']
    await wrapper.vm.$nextTick()
    
    const deleteButton = wrapper.find('[data-testid="delete-photo"]')
    await deleteButton.trigger('click')
    
    expect(wrapper.vm.form.photos.length).toBe(0)
  })
})