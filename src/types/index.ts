/* 1️⃣ KPI ---------------------------------------------------------- */
export interface SummaryKpi {
  online   : number
  offline  : number
  distance : number   // km
  carbon   : number   // kg
}
export type SummaryKpis = SummaryKpi

/* 2️⃣ Vehicle ------------------------------------------------------ */
export interface Vehicle {
  id          : string
  name        : string
  soc         : number
  lastSeen    : string               // ISO

  /* ── 新增欄位 (管理 / ML 皆會用) ── */
  motorId?     : string
  batteryId?   : string
  controllerId?: string

  mqttOnline   : boolean
  mqttPort     : number

  lat          : number              // 6-位小數
  lon          : number
}

/* 3️⃣ Battery ------------------------------------------------------ */
export interface Battery {
  id        : string
  vehicleId : string
  health    : number
  temp      : number
}

/* 4️⃣ Battery Stat (趨勢圖) --------------------------------------- */
export interface BatteryStat {
  id        : string
  vehicleId : string
  soc       : number
  temp      : number
  health?   : number
  ts        : string
}

/* 5️⃣ Alert -------------------------------------------------------- */
export type AlertSeverity = 'info' | 'warning' | 'critical'
export interface Alert {
  id        : string
  vehicleId : string
  message   : string
  ts        : string
  severity  : AlertSeverity
}

/* 6️⃣ RBAC --------------------------------------------------------- */
export interface Role {
  id     : string
  name   : string
  desc   : string
  scopes : string[]
}

export interface User {
  id        : string
  email     : string
  fullName  : string
  roleId    : string
  active    : boolean
  createdAt : string
  lastLogin : string
}
