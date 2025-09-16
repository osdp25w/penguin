/* ─────────────────────────────────────────────────────────────
 *  src/stores/ml.ts ―― 機器學習預測通用 Store
 *  依賴：Pinia 2.x
 * ──────────────────────────────────────────────────────────── */
import { defineStore } from 'pinia'
import { predictStrategy, predictCarbon, predictPower, predictBatteryRisk } from '@/ml/runners'

/* ╭────────────────────── 型別定義 ───────────────────────╮ */
export interface StrategyResult {
  polyline  : { lat: number; lon: number }[]   // 建議路線
  estTime   : string                           // 預計行程 (分鐘)
  estEnergy : string                           // 預計能耗 (kWh)
}

export interface CarbonResult  { saved: number }               // 減碳量 (kg)
export interface PowerResult   { kWh: number; nextCharge: string } // 騎乘耗電
export interface BatteryRisk   { id: string; health: number; faultP: number }
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
    async fetchBatteryRisk (ids: string[] = []): Promise<BatteryRisk[]> {
      try {
        this.loading = true
        const out = await predictBatteryRisk(ids)
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
