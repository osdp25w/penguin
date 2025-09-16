import { DEFAULTS } from './config'
import { getModelPath, setModelPaths } from './paths'
import { getSession, runSession } from './onnx'
import { toStrategyInput, toCarbonInput, toPowerInput, toBatteryInput, toCadenceGearFeaturesFromTelemetry, type Telemetry } from './featurizer'

export interface StrategyOut { polyline: { lat:number; lon:number }[]; estTime: number; estEnergy: number }
export interface CarbonOut { saved: number }
export interface PowerOut { kWh: number; nextCharge: string }
export interface BatteryOut { id: string; health: number; faultP: number }

function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n))}

export async function predictStrategy(input: {
  distanceKm: number
  preference01?: number   // 0 舒適, 1 挑戰
  terrain01?: number      // 0 平地, 1 山路
  wind01?: number         // 0 順風, 1 逆風
  telemetry?: Telemetry
}): Promise<StrategyOut> {
  const pref = clamp(input.preference01 ?? 0.3, 0, 1)
  const terr = clamp(input.terrain01 ?? 0.3, 0, 1)
  const wind = clamp(input.wind01 ?? 0.5, 0, 1)
  const feats = toStrategyInput(input.distanceKm, pref, terr, wind, input.telemetry)

  // Try ONNX
  const sess = await getSession(getModelPath('strategy'))
  if (sess) {
    try {
      const out = await runSession(sess, { input: feats })
      const estTime = Number(out?.time?.data?.[0] ?? out?.output?.data?.[0] ?? 0)
      const estEnergy = Number(out?.energy?.data?.[0] ?? out?.output?.data?.[1] ?? 0)
      return { polyline: [], estTime, estEnergy }
    } catch {}
  }

  // Heuristic fallback
  const base = DEFAULTS.baseSpeedKph
  // preference: +20% speed at 1, -10% at 0
  const prefMul = 0.9 + pref * 0.3
  // terrain: -20% speed at 1
  const terrMul = 1 - terr * 0.2
  // wind: -15% speed at 1 (逆風)
  const windMul = 1 - wind * 0.15
  const speed = Math.max(8, base * prefMul * terrMul * windMul)
  const estTime = (input.distanceKm / speed) * 60
  const estEnergy = input.distanceKm * DEFAULTS.energyPerKmKWh * (1 + terr*0.3 + wind*0.2)
  return { polyline: [], estTime: +estTime.toFixed(1), estEnergy: +estEnergy.toFixed(2) }
}

export async function predictCarbon(input: { distanceKm: number; energyPerKmKWh?: number }): Promise<CarbonOut> {
  const energyPerKm = input.energyPerKmKWh ?? DEFAULTS.energyPerKmKWh
  const feats = toCarbonInput(input.distanceKm, energyPerKm)
  const sess = await getSession(getModelPath('carbon'))
  if (sess) {
    try {
      const out = await runSession(sess, { input: feats })
      const saved = Number(out?.saved?.data?.[0] ?? out?.output?.data?.[0] ?? 0)
      return { saved }
    } catch {}
  }
  // Heuristic: CO2_saved = carFactor*km - ebikeFactor*(energyPerKm*km)
  const car = DEFAULTS.carCO2PerKm * input.distanceKm
  const ebike = DEFAULTS.ebikeCO2PerKWh * (energyPerKm * input.distanceKm)
  return { saved: +(car - ebike).toFixed(2) }
}

export async function predictPower(input: { speedKph: number; tempC?: number; wind01?: number; assist?: number }): Promise<PowerOut> {
  const feats = toPowerInput(input.speedKph, input.tempC ?? 25, (input.wind01 ?? 0.5) * 2 - 1, input.assist ?? 1)
  const sess = await getSession(getModelPath('power'))
  if (sess) {
    try {
      const out = await runSession(sess, { input: feats })
      const keys = Object.keys(out || {})
      const first = keys.length ? (out as any)[keys[0]] : undefined
      const kWh = Number(out?.kwh?.data?.[0] ?? out?.output?.data?.[0] ?? first?.data?.[0] ?? 0)
      const next = String(out?.next?.data?.[0] ?? '建議到站點 A 充電')
      return { kWh, nextCharge: next }
    } catch {}
  }
  // Heuristic: kWh roughly proportional to speed^2 for drag plus baseline
  const drag = Math.pow(input.speedKph / 25, 2)
  const kWh = +(drag * 0.2 + 0.1).toFixed(2)
  const next = kWh > 0.25 ? '建議 30 分內充電' : '續航充足'
  return { kWh, nextCharge: next }
}

export async function predictBatteryRisk(ids: string[], t?: Telemetry): Promise<BatteryOut[]> {
  const sess = await getSession(getModelPath('battery'))
  if (sess) {
    try {
      const feats = toBatteryInput(t)
      const out = await runSession(sess, { input: feats })
      const keys = Object.keys(out || {})
      const first = keys.length ? (out as any)[keys[0]] : undefined
      // for classifiers, sometimes output is probability vector; try first element
      let p = Number(out?.prob?.data?.[0])
      if (!Number.isFinite(p)) p = Number(first?.data?.[0])
      if (!Number.isFinite(p)) p = 0.1
      return ids.map((id) => ({ id, health: +(100 - p*100).toFixed(1), faultP: +p.toFixed(2) }))
    } catch {}
  }
  // Heuristic: random but stable per id
  return ids.map((id, i) => {
    const x = (id.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % 100) / 100
    const p = 0.05 + (x * 0.2) // 5% - 25%
    return { id, health: +(100 - p*100).toFixed(1), faultP: +p.toFixed(2) }
  })
}

/*
 * Optional: Use existing bikerproject XGB models (converted to ONNX) if present.
 * Expected files (place under /public/models):
 *  - trained_cadence_XGBRegressor_model.onnx (or _XGBClassifier_)
 *  - trained_gear_rate_XGBRegressor_model.onnx (or _XGBClassifier_)
 */

async function predictWithTreeModel(modelName: string, features: number[]): Promise<number | null> {
  const sess = await getSession(`/models/${modelName}`)
  if (!sess) return null
  try {
    const out = await runSession(sess, { input: features, float_input: features })
    // Take first scalar from outputs
    const firstKey = Object.keys(out)[0]
    const tensor = (out as any)[firstKey]
    const val = Number(tensor?.data?.[0])
    return Number.isFinite(val) ? val : null
  } catch (e) {
    console.warn('[ONNX] predictWithTreeModel failed:', modelName, e)
    return null
  }
}

export async function predictCadenceFromModel(t?: Telemetry): Promise<number | null> {
  const feats = toCadenceGearFeaturesFromTelemetry(t)
  // Try regressor first then classifier
  return (
    await predictWithTreeModel('trained_cadence_XGBRegressor_model.onnx', feats) ??
    await predictWithTreeModel('trained_cadence_XGBClassifier_model.onnx', feats)
  )
}

export async function predictGearRateFromModel(t?: Telemetry): Promise<number | null> {
  const feats = toCadenceGearFeaturesFromTelemetry(t)
  const out = (
    await predictWithTreeModel('trained_gear_rate_XGBRegressor_model.onnx', feats) ??
    await predictWithTreeModel('trained_gear_rate_XGBClassifier_model.onnx', feats)
  )
  return out
}
