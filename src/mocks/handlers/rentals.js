import { rest } from 'msw';
import { faker } from '@faker-js/faker';
const api = (path) => `/api${path}`;
// Mock rental storage
let mockRentals = [];
let rentalIdCounter = 1000;
// Generate rental ID
function generateRentalId() {
    return `R${Date.now()}${String(rentalIdCounter++).padStart(3, '0')}`;
}
export const rentalsHandlers = [
    // Create rental
    rest.post(api('/rentals'), async (req, res, ctx) => {
        try {
            const body = await req.json();
            const { bikeId, userName, phone, idLast4 } = body;
            // Validate required fields
            if (!bikeId || !userName) {
                return res(ctx.status(422), ctx.json({ message: '缺少必要欄位' }));
            }
            // Check if bike is already rented
            const existingRental = mockRentals.find(r => r.bikeId === bikeId && r.state !== 'completed');
            if (existingRental) {
                return res(ctx.status(409), ctx.json({ message: '車輛已被他人租借' }));
            }
            // Simulate vehicle availability check (could fail for some bikes)
            const isOffline = Math.random() < 0.1; // 10% chance of offline
            if (isOffline) {
                return res(ctx.status(503), ctx.json({ message: '車輛離線，無法租借' }));
            }
            // Create rental record
            const rental = {
                rentalId: generateRentalId(),
                bikeId,
                userName: userName.trim(),
                phone: (phone || '').trim(),
                idLast4: (idLast4 || '').trim(),
                state: 'reserving',
                startTime: new Date().toISOString(),
                endTime: null,
                duration: 0,
                distance: 0,
                fee: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            mockRentals.push(rental);
            return res(ctx.delay(faker.number.int({ min: 800, max: 1500 })), ctx.json(rental));
        }
        catch (error) {
            return res(ctx.status(400), ctx.json({ message: '請求格式錯誤' }));
        }
    }),
    // Unlock rental
    rest.post(api('/rentals/:rentalId/unlock'), async (req, res, ctx) => {
        const { rentalId } = req.params;
        const rental = mockRentals.find(r => r.rentalId === rentalId);
        if (!rental) {
            return res(ctx.status(404), ctx.json({ message: '租借記錄不存在' }));
        }
        if (rental.state !== 'reserving') {
            return res(ctx.status(400), ctx.json({ message: '租借狀態錯誤，無法開鎖' }));
        }
        // Simulate unlock failure occasionally
        const unlockFails = Math.random() < 0.05; // 5% failure rate
        if (unlockFails) {
            return res(ctx.status(500), ctx.json({ message: '開鎖失敗，請重試或聯絡客服' }));
        }
        // Update rental state
        rental.state = 'unlocking';
        rental.updatedAt = new Date().toISOString();
        // Simulate unlock process taking some time
        setTimeout(() => {
            rental.state = 'in_use';
            rental.actualStartTime = new Date().toISOString();
        }, 2000);
        return res(ctx.delay(faker.number.int({ min: 500, max: 1200 })), ctx.json({
            message: '開鎖成功',
            state: rental.state,
            rental
        }));
    }),
    // Cancel rental
    rest.post(api('/rentals/:rentalId/cancel'), async (req, res, ctx) => {
        const { rentalId } = req.params;
        const rental = mockRentals.find(r => r.rentalId === rentalId);
        if (!rental) {
            return res(ctx.status(404), ctx.json({ message: '租借記錄不存在' }));
        }
        if (rental.state === 'completed' || rental.state === 'cancelled') {
            return res(ctx.status(400), ctx.json({ message: '租借已結束，無法取消' }));
        }
        // Update rental state
        rental.state = 'cancelled';
        rental.endTime = new Date().toISOString();
        rental.updatedAt = new Date().toISOString();
        return res(ctx.delay(faker.number.int({ min: 300, max: 800 })), ctx.json({
            message: '租借已取消',
            rental
        }));
    }),
    // Get rental by ID
    rest.get(api('/rentals/:rentalId'), (req, res, ctx) => {
        const { rentalId } = req.params;
        const rental = mockRentals.find(r => r.rentalId === rentalId);
        if (!rental) {
            return res(ctx.status(404), ctx.json({ message: '租借記錄不存在' }));
        }
        return res(ctx.delay(faker.number.int({ min: 200, max: 500 })), ctx.json(rental));
    }),
    // Get user rentals (for personal vehicles page)
    rest.get(api('/rentals'), (req, res, ctx) => {
        const userId = req.url.searchParams.get('userId');
        const status = req.url.searchParams.get('status');
        let filteredRentals = [...mockRentals];
        if (userId) {
            // In a real app, you'd filter by user ID
            // For mock, we'll return all rentals
        }
        if (status) {
            filteredRentals = filteredRentals.filter(r => r.state === status);
        }
        // Sort by creation time (newest first)
        filteredRentals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return res(ctx.delay(faker.number.int({ min: 300, max: 800 })), ctx.json(filteredRentals));
    })
];
