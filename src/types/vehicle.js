import { z } from 'zod';
export const VehicleSchema = z.object({
    id: z.string(),
    siteId: z.string(),
    model: z.string(),
    batteryLevel: z.number().min(0).max(100),
    status: z.enum(['available', 'rented', 'maintenance', 'charging']),
    location: z.object({
        lat: z.number(),
        lng: z.number()
    }),
    brand: z.enum(['huali', 'shunqi']),
    lastUpdate: z.string(),
    createdAt: z.string()
});
export const VehicleListSchema = z.array(VehicleSchema);
