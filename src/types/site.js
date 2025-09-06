import { z } from 'zod';
export const SiteSchema = z.object({
    id: z.string(),
    name: z.string(),
    region: z.enum(['hualien', 'taitung']),
    location: z.object({
        lat: z.number(),
        lng: z.number()
    }),
    status: z.enum(['active', 'maintenance', 'offline']),
    brand: z.enum(['huali', 'shunqi']), // 華麗轉身/順騎自然
    vehicleCount: z.number().int().min(0),
    availableCount: z.number().int().min(0),
    batteryLevels: z.object({
        high: z.number().int().min(0), // >70%
        medium: z.number().int().min(0), // 30-70%
        low: z.number().int().min(0) // <30%
    }),
    createdAt: z.string(),
    updatedAt: z.string()
});
