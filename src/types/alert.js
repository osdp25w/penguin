import { z } from 'zod';
export const AlertSchema = z.object({
    id: z.string(),
    siteId: z.string(),
    vehicleId: z.string().optional(),
    severity: z.enum(['info', 'warning', 'error', 'critical']),
    type: z.string(),
    message: z.string(),
    description: z.string().optional(),
    resolved: z.boolean(),
    createdAt: z.string(),
    resolvedAt: z.string().optional()
});
export const AlertListSchema = z.array(AlertSchema);
