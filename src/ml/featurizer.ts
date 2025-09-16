// Map incoming telemetry (MQTT-like) to model features

export interface Telemetry {
  ID: string
  MSG: {
    GT?: number; RT?: number; ST?: number
    LG?: number; LA?: number; HD?: number
    OD?: number; HP?: number; IN?: number; VS?: number
    OP?: number; AI1?: number; DD?: string
    TP1?: number; TP2?: number; MS?: string
    MV?: number; BV?: number; AT?: number
    GQ?: number; VP?: number; PT?: number; CT?: number; CA?: number
    SO?: number; EO?: number; AL?: number; BI?: string; SA?: number
  }
}

export function basicFeatures(t: Telemetry | null | undefined) {
  const m = t?.MSG || {}
  const lat = (m.LA ?? 0) / 1e6
  const lon = (m.LG ?? 0) / 1e6
  const speed = (m.VS ?? 0)
  const soc = (m.SO ?? 0)
  const torque = (m.PT ?? 0) / 100
  const cadence = (m.CA ?? 0) * 0.025
  const assist = (m.AL ?? 0)
  const ctrlTemp = (m.CT ?? 2000) === 2000 ? 35 : (m.CT ?? 35)
  const voltage = (m.MV ?? 0) / 10
  const rssi = (m.GQ ?? 99)
  const signalDbm = rssi === 99 ? -140 : -113 + rssi * 2
  return { lat, lon, speed, soc, torque, cadence, assist, ctrlTemp, voltage, signalDbm }
}

export function toStrategyInput(distanceKm: number, pref01: number, terrain: number, wind: number, t?: Telemetry) {
  const b = basicFeatures(t)
  // features: [distance, soc, speed, terrain, wind, preference, assist]
  return [distanceKm, b.soc, b.speed, terrain, wind, pref01, b.assist]
}

export function toCarbonInput(distanceKm: number, energyPerKm = 0.012) {
  // features: [distance, energyPerKm]
  return [distanceKm, energyPerKm]
}

export function toPowerInput(speed: number, tempC = 25, wind = 0, assist = 1) {
  // features: [speed, tempC, wind, assist]
  return [speed, tempC, wind, assist]
}

export function toBatteryInput(t?: Telemetry) {
  const b = basicFeatures(t)
  // features: [soc, voltage, ctrlTemp, cadence, torque]
  return [b.soc, b.voltage, b.ctrlTemp, b.cadence, b.torque]
}

// XGB models from bikerproject expect 8 features
export function toCadenceGearFeaturesFromTelemetry(t?: Telemetry): number[] {
  const b = basicFeatures(t)
  // Derive/Randomize missing env features
  const avgSpeed = b.speed || 15 + Math.random()*10
  const instant = b.speed
  const slope = (Math.random()*4 - 2) // -2..+2 degrees equivalent
  const temperature = 20 + Math.random()*12 // 20..32 C
  const humidity = 55 + Math.random()*35 // 55..90 %
  const heatIndex = temperature + Math.max(0, (humidity-40)/50) * 5
  const traffic = Math.floor(Math.random()*3) // 0..2
  const heartRate = 85 + Math.random()*70 // bpm
  return [avgSpeed, instant, slope, temperature, humidity, heatIndex, traffic, heartRate]
}
