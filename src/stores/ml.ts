/* ─────────────────────────────────────────────────────────────
 *  src/stores/ml.ts ―― 機器學習預測通用 Store
 *  依賴：Pinia 2.x
 * ──────────────────────────────────────────────────────────── */
import { defineStore } from 'pinia'

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
    fetchStrategy (p: { distance: number }) {
      return this._post<StrategyResult>('strategy', 'strategy', p)
    },
    fetchCarbon   (p: { distance: number }) {
      return this._post<CarbonResult>('carbon', 'carbon', p)
    },
    fetchPower    (p: { speed: number }) {
      return this._post<PowerResult>('power', 'power', p)
    },

    /* ────────────── 故障機率 (GET) ────────────── */
    async fetchBatteryRisk (): Promise<BatteryRisk[]> {
      try {
        this.loading = true
        const res = await fetch('/api/v1/ml/battery')
        if (!res.ok) throw new Error(res.statusText)

        const data: BatteryRisk[] = await res.json()
        this.batteries = data
        this.errMsg = ''
        return data                          // 呼叫端可直接取得
      } catch (e: any) {
        this.errMsg = e.message ?? 'fetch battery risk failed'
        throw e
      } finally {
        this.loading = false
      }
    },

    /* ────────────── 共用 POST helper ────────────── */
    async _post<R>(
      path    : string,
      key     : 'strategy' | 'carbon' | 'power',
      payload : unknown
    ): Promise<R> {
      try {
        this.loading = true
        const res = await fetch(`/api/v1/ml/${path}`, {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify(payload)
        })
        if (!res.ok) throw new Error(res.statusText)

        const data: R = await res.json()
        ;(this as any)[key] = data          // 動態欄位寫入
        this.errMsg = ''
        return data                         // 回傳解析結果
      } catch (e: any) {
        this.errMsg = e.message ?? 'ML request failed'
        throw e
      } finally {
        this.loading = false
      }
    }
  }
})
