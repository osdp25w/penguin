import { DEFAULTS } from './config'
import { getModelPath, setModelPaths } from './paths'
import { getSession, runSession } from './onnx'
import { toStrategyInput, toCarbonInput, toPowerInput, toBatteryInput, toCadenceGearFeaturesFromTelemetry, type Telemetry } from './featurizer'

export interface StrategyOut { polyline: { lat:number; lon:number }[]; estTime: number; estEnergy: number }
export interface CarbonOut { saved: number }
export interface PowerOut { kWh: number; nextCharge: string }
export interface BatteryOut { id: string; health: number; faultP: number; capacity?: number }

export interface BatteryFeatureInput {
  id?: string
  soc?: number
  socPct?: number
  socPercent?: number
  stateOfCharge?: number
  voltage?: number
  mv10?: number
  packVoltage?: number
  temperature?: number
  temp?: number
  ctrlTemp?: number
}

function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n))}

let batteryMetaPromise: Promise<any> | null = null

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

function isTelemetry(value: unknown): value is Telemetry {
  return !!value && typeof value === 'object' && 'MSG' in (value as any)
}

function toBatteryInputFromFeatures(input?: BatteryFeatureInput | null): number[] {
  if (!input) return toBatteryInput(undefined)

  let soc = input.soc ?? input.socPct ?? input.socPercent ?? input.stateOfCharge
  if (soc == null) soc = 0
  if (soc > 1.5) soc = soc / 100 // assume percentage
  soc = Math.max(0, Math.min(1.2, soc))

  const voltageRaw =
    input.voltage ??
    (typeof input.mv10 === 'number' ? input.mv10 / 10 : undefined) ??
    input.packVoltage
  const voltage = Number((voltageRaw ?? 48).toFixed(2))

  const tempRaw = input.temperature ?? input.temp ?? input.ctrlTemp
  const temperature = Number(((tempRaw ?? 35)).toFixed(2))

  return [Number(soc.toFixed(4)), voltage, temperature]
}

export async function predictBatteryRisk(ids: string[], input?: Telemetry | BatteryFeatureInput | BatteryFeatureInput[]): Promise<BatteryOut[]> {
  const idList = (ids ?? []).map(id => String(id))
  console.log('[BatteryRisk] Starting prediction for IDs:', idList)
  const modelPath = getModelPath('battery')
  console.log('[BatteryRisk] Model path:', modelPath)

  const sess = await getSession(modelPath)
  console.log('[BatteryRisk] Session loaded:', !!sess)

  if (sess) {
    try {
      const inputsArray: { id: string; feats: number[] }[] = []

      if (Array.isArray(input)) {
        const map = new Map<string, BatteryFeatureInput>()
        for (const item of input) {
          if (!item) continue
          const key = String(item.id ?? '')
          if (!key) continue
          map.set(key, item)
        }
        const targets = idList.length ? idList : Array.from(map.keys())
        for (const id of targets) {
          const feats = toBatteryInputFromFeatures(map.get(id))
          inputsArray.push({ id, feats })
        }
        if (!idList.length) idList.push(...targets)
      } else if (input && !isTelemetry(input)) {
        const feats = toBatteryInputFromFeatures(input)
        const targets = idList.length ? idList : ['battery']
        for (const id of targets) inputsArray.push({ id, feats })
        if (!idList.length) idList.push(...targets)
      } else {
        const feats = toBatteryInput(isTelemetry(input) ? input : undefined)
        const targets = idList.length ? idList : ['battery']
        for (const id of targets) inputsArray.push({ id, feats })
        if (!idList.length) idList.push(...targets)
      }

      if (!batteryMetaPromise) {
        const fetcher = typeof fetch === 'function' ? fetch : undefined
        batteryMetaPromise = fetcher
          ? fetcher('/models/battery_capacity_metadata.json').then(r => r.json()).catch(() => ({}))
          : Promise.resolve({})
      }
      const meta = await batteryMetaPromise
      const rated = Number(meta?.rated_capacity) || Number(meta?.capacity_range?.[1]) || 2.0
      const apt = rated * 0.7

      const results: BatteryOut[] = []
      for (const row of inputsArray) {
        const out = await runSession(sess, { input: row.feats })
        console.log('[BatteryRisk] Model output keys:', Object.keys(out || {}))

        const firstKey = Object.keys(out || {})[0]
        const tensor = firstKey ? (out as any)[firstKey] : undefined
        let capacity: number | null = null
        if (tensor && typeof tensor === 'object' && 'data' in tensor) {
          const val = Number(tensor.data?.[0])
          if (Number.isFinite(val)) capacity = val
        }
        if (capacity == null) {
          capacity = Number(firstKey ? (out as any)[firstKey] : 0)
        }
        if (!Number.isFinite(capacity)) capacity = 0.0

        const healthPct = Math.max(0, Math.min(120, (capacity / rated) * 100))
        let fault = 0
        if (capacity < apt) {
          fault = Math.min(1, (apt - capacity) / (rated - apt))
        } else {
          fault = Math.max(0, (rated - capacity) / rated * 0.2)
        }

        results.push({
          id: row.id,
          health: +healthPct.toFixed(1),
          faultP: +Math.max(0, Math.min(1, fault)).toFixed(2),
          capacity: +capacity!.toFixed(3)
        })
      }

      console.log('[BatteryRisk] Model result:', results)
      return results
    } catch (err) {
      console.error('[BatteryRisk] Model error:', err)
    }
  }

  // Heuristic: random but stable per id
  console.log('[BatteryRisk] Using heuristic fallback for IDs:', idList)
  const fallbackResult = (idList.length ? idList : ['battery']).map((id) => {
    const x = (id.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % 100) / 100
    const p = 0.05 + (x * 0.2) // 5% - 25%
    const rated = 2.0
    const capacity = rated * (1 - p * 0.5)
    return { id, health: +(100 - p*100).toFixed(1), faultP: +p.toFixed(2), capacity: +capacity.toFixed(3) }
  })
  console.log('[BatteryRisk] Heuristic result:', fallbackResult)
  return fallbackResult
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
