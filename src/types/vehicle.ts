import { z } from 'zod'

export const VehicleSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  speedKph: z.number().optional(),
  batteryPct: z.number().min(0).max(100).optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  signal: z.enum(['良好', '中等', '弱']).optional(),
  status: z.enum(['可租借', '使用中', '離線', '維修', '低電量', 'available', 'in-use', 'rented', 'maintenance', 'charging', 'low-battery']).optional(),
  lastSeen: z.string().optional(),
  
  // 兼容舊欄位（可選）
  siteId: z.string().optional(),
  model: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  brand: z.enum(['huali', 'shunqi']).optional(),
  
  // 新增組件狀態欄位
  motorStatus: z.enum(['normal', 'warning', 'error', 'offline']).optional(),
  batteryStatus: z.enum(['normal', 'warning', 'error', 'offline']).optional(),
  controllerStatus: z.enum(['normal', 'warning', 'error', 'offline']).optional(),
  portStatus: z.enum(['normal', 'warning', 'error', 'offline']).optional(),
  mqttStatus: z.enum(['online', 'offline']).optional(),
  
  // 電池健康度相關欄位
  soh: z.number().min(0).max(100).optional(),
  predictedRangeKm: z.number().nonnegative().optional(),
  chargeCycles: z.number().nonnegative().optional(),
  predictedReplaceAt: z.string().optional(),
  
  // 電池趨勢資料 (過去 7 天)
  batteryTrend: z.array(z.object({
    t: z.number(),
    v: z.number()
  })).optional(),
  
  lastUpdate: z.string().optional(),
  createdAt: z.string().optional()
})

export type Vehicle = z.infer<typeof VehicleSchema>
export type VehicleStatus = Vehicle['status']
export type ComponentStatus = 'normal' | 'warning' | 'error' | 'offline'
export type MqttStatus = 'online' | 'offline'

export const VehicleListSchema = z.array(VehicleSchema)
export type VehicleList = z.infer<typeof VehicleListSchema>