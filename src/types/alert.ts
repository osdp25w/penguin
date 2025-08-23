import { z } from 'zod'

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
})

export type Alert = z.infer<typeof AlertSchema>
export type AlertSeverity = Alert['severity']

export const AlertListSchema = z.array(AlertSchema)
export type AlertList = z.infer<typeof AlertListSchema>