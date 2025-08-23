import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useReturns } from '../returns';
// Mock fetch globally
global.fetch = vi.fn();
describe('useReturns Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });
    describe('initial state', () => {
        it('should have correct initial state', () => {
            const store = useReturns();
            expect(store.loading).toBe(false);
            expect(store.error).toBe('');
            expect(store.currentReturn).toBeNull();
            expect(store.siteVehicles).toEqual([]);
        });
    });
    describe('submitReturn action', () => {
        it('should successfully submit a return', async () => {
            const mockResponse = {
                id: 'return-123',
                vehicleId: 'V-001',
                siteId: 'S-001',
                status: 'completed'
            };
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });
            const store = useReturns();
            const returnData = {
                vehicleId: 'V-001',
                siteId: 'S-001',
                odometer: 150,
                battery: 85
            };
            await store.submitReturn(returnData);
            expect(store.loading).toBe(false);
            expect(store.error).toBe('');
            expect(store.currentReturn).toEqual(mockResponse);
            expect(fetch).toHaveBeenCalledWith('/api/v1/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(returnData)
            });
        });
        it('should handle validation errors', async () => {
            const mockError = {
                error: 'VALIDATION_ERROR',
                message: '車輛ID和站點ID為必填項目'
            };
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 400,
                json: () => Promise.resolve(mockError)
            });
            const store = useReturns();
            const invalidData = {
                vehicleId: '',
                siteId: 'S-001',
                odometer: 150,
                battery: 85
            };
            await store.submitReturn(invalidData);
            expect(store.loading).toBe(false);
            expect(store.error).toBe('車輛ID和站點ID為必填項目');
            expect(store.currentReturn).toBeNull();
        });
        it('should handle network errors', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
            const store = useReturns();
            const returnData = {
                vehicleId: 'V-001',
                siteId: 'S-001',
                odometer: 150,
                battery: 85
            };
            await store.submitReturn(returnData);
            expect(store.loading).toBe(false);
            expect(store.error).toBe('Network error');
            expect(store.currentReturn).toBeNull();
        });
        it('should set loading state correctly', async () => {
            global.fetch = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
                ok: true,
                json: () => Promise.resolve({ id: 'return-123' })
            }), 100)));
            const store = useReturns();
            const returnData = {
                vehicleId: 'V-001',
                siteId: 'S-001',
                odometer: 150,
                battery: 85
            };
            const promise = store.submitReturn(returnData);
            expect(store.loading).toBe(true);
            await promise;
            expect(store.loading).toBe(false);
        });
    });
    describe('fetchSiteVehicles action', () => {
        it('should fetch vehicles for a site', async () => {
            const mockVehicles = [
                {
                    id: 'V-001',
                    name: '共享單車 001',
                    batteryLevel: 85,
                    isAvailable: true
                },
                {
                    id: 'V-002',
                    name: '共享單車 002',
                    batteryLevel: 92,
                    isAvailable: true
                }
            ];
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockVehicles)
            });
            const store = useReturns();
            await store.fetchSiteVehicles('S-001');
            expect(store.siteVehicles).toEqual(mockVehicles);
            expect(store.error).toBe('');
            expect(fetch).toHaveBeenCalledWith('/api/v1/sites/S-001/vehicles');
        });
        it('should handle fetch errors', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
            const store = useReturns();
            await store.fetchSiteVehicles('S-001');
            expect(store.siteVehicles).toEqual([]);
            expect(store.error).toBe('Failed to fetch');
        });
    });
    describe('form validation', () => {
        it('should validate return payload correctly', () => {
            const store = useReturns();
            // Valid payload
            const validPayload = {
                vehicleId: 'V-001',
                siteId: 'S-001',
                odometer: 150,
                battery: 85
            };
            expect(() => store.validateReturnPayload(validPayload)).not.toThrow();
        });
        it('should reject invalid payload', () => {
            const store = useReturns();
            // Missing vehicleId
            const invalidPayload1 = {
                vehicleId: '',
                siteId: 'S-001',
                odometer: 150,
                battery: 85
            };
            expect(() => store.validateReturnPayload(invalidPayload1)).toThrow();
            // Invalid battery level
            const invalidPayload2 = {
                vehicleId: 'V-001',
                siteId: 'S-001',
                odometer: 150,
                battery: 150 // Invalid: > 100
            };
            expect(() => store.validateReturnPayload(invalidPayload2)).toThrow();
            // Negative odometer
            const invalidPayload3 = {
                vehicleId: 'V-001',
                siteId: 'S-001',
                odometer: -50, // Invalid: negative
                battery: 85
            };
            expect(() => store.validateReturnPayload(invalidPayload3)).toThrow();
        });
    });
    describe('clearError action', () => {
        it('should clear error state', () => {
            const store = useReturns();
            store.error = 'Some error message';
            store.clearError();
            expect(store.error).toBe('');
        });
    });
    describe('resetReturn action', () => {
        it('should reset return state', () => {
            const store = useReturns();
            store.currentReturn = { id: 'return-123' };
            store.siteVehicles = [{ id: 'V-001' }];
            store.resetReturn();
            expect(store.currentReturn).toBeNull();
            expect(store.siteVehicles).toEqual([]);
        });
    });
});
