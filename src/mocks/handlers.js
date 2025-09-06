import { rest } from 'msw';
import { faker } from '@faker-js/faker';
import { sitesHandlers } from './handlers/sites';
import { vehiclesHandlers } from './handlers/vehicles';
import { alertsHandlers } from './handlers/alerts';
import { returnsHandlers } from './handlers/returns';
import { rentalsHandlers } from './handlers/rentals';
const api = (p) => `/api/v1${p}`;
/* ── 1. KPI ─────────────────────────────────────────── */
const summary = rest.get(api('/metrics/summary'), (_, res, ctx) => res(ctx.delay(300), ctx.json({
    online: faker.number.int({ min: 30, max: 60 }),
    offline: faker.number.int({ min: 1, max: 20 }),
    distance: faker.number.int({ min: 50, max: 200 }),
    carbon: faker.number.float({ min: 5, max: 20, fractionDigits: 1 })
})));
/* ── 2. Vehicles (分頁) - 已移至 ./handlers/vehicles.ts ── */
/* ── 3. Batteries ──────────────────────────────────── */
const batteries = rest.get(api('/batteries'), (_, res, ctx) => res(ctx.delay(300), ctx.json(Array.from({ length: 16 }).map(() => ({
    id: faker.string.nanoid(10),
    vehicleId: faker.string.numeric(4),
    health: faker.number.int({ min: 60, max: 100 }),
    cycles: faker.number.int({ min: 50, max: 800 }),
    temp: faker.number.int({ min: 15, max: 45 }),
    updatedAt: faker.date.recent().toISOString()
})))));
/* ── 4. Alerts - 已移至 ./handlers/alerts.ts ──── */
/* ── 5. Auth ───────────────────────────────────────── */
// Mock user data for profile management
let mockCurrentUser = {
    id: 'u_admin001',
    name: 'admin',
    email: 'admin@example.com',
    roleId: 'admin',
    phone: '+886-912-345-678',
    avatarUrl: undefined
};
const login = rest.post(api('/auth/login'), async (req, res, ctx) => {
    const { email, password } = (await req.json());
    let roleId = 'user';
    if (email === 'admin@example.com' && password === 'admin123')
        roleId = 'admin';
    // Update mock user data
    mockCurrentUser = {
        id: 'u_' + faker.string.nanoid(6),
        name: email.split('@')[0],
        email,
        roleId,
        phone: faker.phone.number(),
        avatarUrl: undefined
    };
    return res(ctx.delay(400), ctx.json({
        token: faker.string.nanoid(24),
        user: mockCurrentUser
    }));
});
const getMe = rest.get(api('/me'), (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }
    return res(ctx.delay(200), ctx.json(mockCurrentUser));
});
const updateMe = rest.put(api('/me'), async (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }
    try {
        const body = await req.json();
        // Validate password if changing
        if (body.currentPassword && body.password) {
            // In real app, verify current password
            if (body.currentPassword !== 'admin123') {
                return res(ctx.status(400), ctx.json({ message: '目前密碼不正確' }));
            }
        }
        // Update mock user data
        mockCurrentUser = {
            ...mockCurrentUser,
            name: body.name || mockCurrentUser.name,
            email: body.email || mockCurrentUser.email,
            phone: body.phone !== undefined ? body.phone : mockCurrentUser.phone,
            avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : mockCurrentUser.avatarUrl
        };
        return res(ctx.delay(500), ctx.json(mockCurrentUser));
    }
    catch (error) {
        return res(ctx.status(400), ctx.json({ message: 'Invalid request body' }));
    }
});
/* ── 6. Roles / Users ──────────────────────────────── */
const roles = rest.get(api('/roles'), (_, res, ctx) => res(ctx.json([
    { id: 'admin', name: '最高管理員', desc: '擁有全部權限', scopes: ['admin:*'] },
    { id: 'manager', name: '一般管理者', desc: '可管理車隊與分析', scopes: ['read:*', 'write:vehicle'] },
    { id: 'user', name: '使用者', desc: '僅可讀取資料', scopes: ['read:data'] }
])));
const users = rest.get(api('/users'), (_, res, ctx) => res(ctx.json(faker.helpers.multiple(() => ({
    id: faker.string.nanoid(8),
    email: faker.internet.email(),
    fullName: faker.person.fullName(),
    roleId: faker.helpers.arrayElement(['admin', 'manager', 'user']),
    active: faker.datatype.boolean(),
    createdAt: faker.date.past().toISOString(),
    lastLogin: faker.date.recent().toISOString()
}), { count: 24 }))));
/* ── 7-10. ML APIs ─────────────────────────────────── */
const mlStrategy = rest.post(api('/ml/strategy'), async (req, res, ctx) => {
    const { distance } = await req.json();
    return res(ctx.delay(500), ctx.json({
        polyline: Array.from({ length: 10 }).map(() => ({
            lat: +faker.location.latitude().toFixed(6),
            lon: +faker.location.longitude().toFixed(6)
        })),
        estTime: (distance / 15).toFixed(1),
        estEnergy: (distance * 0.012).toFixed(2)
    }));
});
const mlCarbon = rest.post(api('/ml/carbon'), async (req, res, ctx) => {
    const { distance } = await req.json();
    return res(ctx.json({ saved: +(distance * 0.15).toFixed(2) }));
});
const mlPower = rest.post(api('/ml/power'), async (req, res, ctx) => {
    const { speed } = await req.json();
    return res(ctx.json({
        kWh: +(speed * 0.015).toFixed(2),
        nextCharge: '約 2 hr 後建議充電'
    }));
});
const mlBattery = rest.get(api('/ml/battery'), (_, res, ctx) => res(ctx.json(faker.helpers.multiple(() => ({
    id: faker.string.nanoid(8),
    health: faker.number.int({ min: 60, max: 100 }),
    faultP: +faker.number.float({ min: 0, max: 0.4, precision: 0.01 }).toFixed(2)
}), { count: 20 }))));
/* ── Export handlers ───────────────────────────────── */
export const handlers = [
    ...sitesHandlers,
    ...vehiclesHandlers,
    ...alertsHandlers,
    ...returnsHandlers,
    ...rentalsHandlers,
    summary,
    batteries,
    login,
    getMe,
    updateMe,
    roles,
    users,
    mlStrategy,
    mlCarbon,
    mlPower,
    mlBattery
];
