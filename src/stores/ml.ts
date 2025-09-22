/* ─────────────────────────────────────────────────────────────
 *  src/stores/ml.ts ―― 機器學習預測通用 Store
 *  依賴：Pinia 2.x
 * ──────────────────────────────────────────────────────────── */
import { defineStore } from 'pinia'
import { predictStrategy, predictCarbon, predictPower, predictBatteryRisk, type BatteryFeatureInput } from '@/ml/runners'
import type { BatteryStat } from '@/types'

/* ╭────────────────────── 型別定義 ───────────────────────╮ */
export interface StrategyResult {
  polyline  : { lat: number; lon: number }[]   // 建議路線
  estTime   : string                           // 預計行程 (分鐘)
  estEnergy : string                           // 預計能耗 (kWh)
}

export interface CarbonResult  { saved: number }               // 減碳量 (kg)
export interface PowerResult   { kWh: number; nextCharge: string } // 騎乘耗電
export interface BatteryRisk   { id: string; health: number; faultP: number; capacity?: number }
/* ╰────────────────────────────────────────────────────────╯ */

export const useML = defineStore('ml', {
  state: () => ({
    loading : false,          // 任一請求進行中
    errMsg  : '',             // 全域錯誤訊息

    /* 預測結果 ------------------------------------------------- */
    strategy : null as StrategyResult | null,
    carbon   : null as CarbonResult  | null,
    power    : null as PowerResult   | null,
    batteries: []  as BatteryRisk[]               // 電池故障機率
  }),

  actions: {
    /* ────────────── 單一模型 ────────────── */
    async fetchStrategy (p: { distance: number; preference01?: number; terrain01?: number; wind01?: number }) {
      try {
        this.loading = true
        const out = await predictStrategy({ distanceKm: p.distance, preference01: p.preference01, terrain01: p.terrain01, wind01: p.wind01 })
        this.strategy = { polyline: out.polyline, estTime: String(out.estTime), estEnergy: String(out.estEnergy) }
        this.errMsg = ''
        return this.strategy
      } catch (e:any) {
        this.errMsg = e.message ?? 'strategy failed'
        throw e
      } finally { this.loading = false }
    },
    async fetchCarbon   (p: { distance: number }) {
      try {
        this.loading = true
        const out = await predictCarbon({ distanceKm: p.distance })
        this.carbon = { saved: out.saved }
        this.errMsg = ''
        return this.carbon
      } catch (e:any) {
        this.errMsg = e.message ?? 'carbon failed'
        throw e
      } finally { this.loading = false }
    },
    async fetchPower    (p: { speed: number }) {
      try {
        this.loading = true
        const out = await predictPower({ speedKph: p.speed })
        this.power = { kWh: out.kWh, nextCharge: out.nextCharge }
        this.errMsg = ''
        return this.power
      } catch (e:any) {
        this.errMsg = e.message ?? 'power failed'
        throw e
      } finally { this.loading = false }
    },

    /* ────────────── 故障機率 (GET) ────────────── */
    async fetchBatteryRisk (ids: string[] = [], stats?: BatteryStat[]): Promise<BatteryRisk[]> {
      try {
        this.loading = true
        let batteryStats = stats

        if (!batteryStats?.length) {
          try {
            const res = await fetch('/api/v1/batteries')
            if (res.ok) {
              batteryStats = await res.json() as BatteryStat[]
            }
          } catch (err) {
            console.warn('[ML] Failed to fetch batteries for risk model:', err)
          }
        }

        let featureInputs: BatteryFeatureInput[] | undefined
        if (batteryStats?.length) {
          featureInputs = batteryStats
            .map((item) => {
              const id = String(item.id ?? item.vehicleId ?? '').trim()
              if (!id) return null
              const stat: BatteryFeatureInput = {
                id,
                soc: typeof item.soc === 'number' ? item.soc : undefined,
                temperature: typeof item.temp === 'number' ? item.temp : undefined,
              }
              const anyItem = item as any
              if (typeof anyItem.voltage === 'number') stat.voltage = anyItem.voltage
              else if (typeof anyItem.mv10 === 'number') stat.mv10 = anyItem.mv10
              else if (typeof anyItem.mv === 'number') stat.voltage = anyItem.mv
              if (typeof anyItem.ctrlTemp === 'number') stat.ctrlTemp = anyItem.ctrlTemp
              return stat
            })
            .filter((v): v is BatteryFeatureInput => !!v)
        }

        const targetIds = ids.length
          ? ids
          : featureInputs?.map((item) => item.id!).filter(Boolean) ?? []

        const out = await predictBatteryRisk(targetIds, featureInputs && featureInputs.length ? featureInputs : undefined)
        this.batteries = out
        this.errMsg = ''
        return out
      } catch (e:any) {
        this.errMsg = e.message ?? 'battery risk failed'
        throw e
      } finally { this.loading = false }
    },

    /* ────────────── 共用 POST helper ────────────── */
    async _post<R>() { throw new Error('disabled') }
  }
})
