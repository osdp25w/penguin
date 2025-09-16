// src/config/vehicle.ts
// 車輛相關配置

export const VEHICLE_CONFIG = {
  // 低電量門檻值 (百分比)
  LOW_BATTERY_THRESHOLD: 20,

  // 電池狀態顏色配置
  BATTERY_COLORS: {
    LOW: 'bg-red-500',     // 低電量 (<30%)
    MEDIUM: 'bg-yellow-500', // 中等電量 (30-60%)
    HIGH: 'bg-green-500'   // 高電量 (>60%)
  },

  // 分頁預設設定
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    LIMIT_OPTIONS: [10, 20, 50, 100]
  }
} as const