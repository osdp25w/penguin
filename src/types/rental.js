import { z } from 'zod';
export const RentalSchema = z.object({
    rentalId: z.string(),
    bikeId: z.string(),
    userName: z.string(),
    phone: z.string().optional(),
    idLast4: z.string().optional(),
    state: z.enum(['reserving', 'unlocking', 'in_use']),
    startedAt: z.string().optional()
});
export const CreateRentalSchema = z.object({
    bikeId: z.string(),
    userName: z.string().min(1),
    // 在新流程中，電話與身分證末四碼改為可選（由系統自動帶入，若後端需要可於伺服端校驗）
    phone: z.string().regex(/^(09\d{8}|(\+886|886)9\d{8})$/).or(z.literal('')).optional(),
    idLast4: z.string().regex(/^\d{4}$/).or(z.literal('')).optional()
});
