import { z } from 'zod';
export const RentalSchema = z.object({
    rentalId: z.string(),
    bikeId: z.string(),
    userName: z.string(),
    phone: z.string(),
    idLast4: z.string(),
    state: z.enum(['reserving', 'unlocking', 'in_use']),
    startedAt: z.string()
});
export const CreateRentalSchema = z.object({
    bikeId: z.string(),
    userName: z.string().min(2).max(30),
    phone: z.string().regex(/^(09\d{8}|(\+886|886)9\d{8})$/),
    idLast4: z.string().regex(/^\d{4}$/)
});
