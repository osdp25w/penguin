export * from './site'
export * from './vehicle'  
export * from './alert'

/* Legacy types - keeping for compatibility */
export interface SummaryKpi {
  online   : number
  offline  : number
  distance : number   // km
  carbon   : number   // kg
}
export type SummaryKpis = SummaryKpi

export interface Battery {
  id        : string
  vehicleId : string
  health    : number
  temp      : number
}

export interface BatteryStat {
  id        : string
  vehicleId : string
  soc       : number
  temp      : number
  health?   : number
  ts        : string
}

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
