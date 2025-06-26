// ────────────────────────────────────
//  公用型別定義  src/types.ts
// ────────────────────────────────────

/* 1️⃣ 儀表板 KPI ------------------------------------------------------- */
export interface SummaryKpi {
  online   : number     // 上線車輛數
  offline  : number     // 離線車輛數
  distance : number     // 今日總里程     km
  carbon   : number     // 今日減碳      kg
}
/** stores/summary.ts 期待的「複數」名稱 */
export type SummaryKpis = SummaryKpi   // 只是別名，方便 import

/* 2️⃣ 車輛 ------------------------------------------------------------- */
export interface Vehicle {
  id       : string
  name     : string
  soc      : number   // State-of-Charge %
  lastSeen : string   // ISO datetime
}

/* 3️⃣ 電池列表（靜態屬性） --------------------------------------------- */
export interface Battery {
  id        : string
  vehicleId : string   // 對應車輛
  health    : number   // 0-100 %
  temp      : number   // °C
}

/* 4️⃣ 電池時序統計（趨勢圖、歷史） ------------------------------------ */
export interface BatteryStat {
  id        : string   // Battery ID
  vehicleId : string   // 分車輛統計
  soc       : number   // %
  temp      : number   // °C
  /** 平均健康度（若趨勢圖需要）—可選，避免編譯錯誤 */
  health?   : number   // %
  ts        : string   // ISO datetime
}

/* 5️⃣ 警報 / 事件 ------------------------------------------------------ */
export type AlertSeverity = 'info' | 'warning' | 'critical'   // 統一用 warning

export interface Alert {
  id        : string
  vehicleId : string
  message   : string
  ts        : string            // ISO datetime
  severity  : AlertSeverity
}
