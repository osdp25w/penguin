/* ─────────────────────────────────────────────────────────────
 *  src/stores/ml.ts ―― 機器學習預測通用 Store
 *  依賴：Pinia 2.x
 * ──────────────────────────────────────────────────────────── */
import { defineStore } from 'pinia';
import { predictStrategy, predictCarbon, predictPower, predictBatteryRisk } from '@/ml/runners';
/* ╰────────────────────────────────────────────────────────╯ */
export const useML = defineStore('ml', {
    state: () => ({
        loading: false, // 任一請求進行中
        errMsg: '', // 全域錯誤訊息
        /* 預測結果 ------------------------------------------------- */
        strategy: null,
        carbon: null,
        power: null,
        batteries: [] // 電池故障機率
    }),
    actions: {
        /* ────────────── 單一模型 ────────────── */
        async fetchStrategy(p) {
            var _a;
            try {
                this.loading = true;
                const out = await predictStrategy({ distanceKm: p.distance, preference01: p.preference01, terrain01: p.terrain01, wind01: p.wind01 });
                this.strategy = { polyline: out.polyline, estTime: String(out.estTime), estEnergy: String(out.estEnergy) };
                this.errMsg = '';
                return this.strategy;
            }
            catch (e) {
                this.errMsg = (_a = e.message) !== null && _a !== void 0 ? _a : 'strategy failed';
                throw e;
            }
            finally {
                this.loading = false;
            }
        },
        async fetchCarbon(p) {
            var _a;
            try {
                this.loading = true;
                const out = await predictCarbon({ distanceKm: p.distance });
                this.carbon = { saved: out.saved };
                this.errMsg = '';
                return this.carbon;
            }
            catch (e) {
                this.errMsg = (_a = e.message) !== null && _a !== void 0 ? _a : 'carbon failed';
                throw e;
            }
            finally {
                this.loading = false;
            }
        },
        async fetchPower(p) {
            var _a;
            try {
                this.loading = true;
                const out = await predictPower({ speedKph: p.speed });
                this.power = { kWh: out.kWh, nextCharge: out.nextCharge };
                this.errMsg = '';
                return this.power;
            }
            catch (e) {
                this.errMsg = (_a = e.message) !== null && _a !== void 0 ? _a : 'power failed';
                throw e;
            }
            finally {
                this.loading = false;
            }
        },
        /* ────────────── 故障機率 (GET) ────────────── */
        async fetchBatteryRisk(ids = []) {
            var _a;
            try {
                this.loading = true;
                const out = await predictBatteryRisk(ids);
                this.batteries = out;
                this.errMsg = '';
                return out;
            }
            catch (e) {
                this.errMsg = (_a = e.message) !== null && _a !== void 0 ? _a : 'battery risk failed';
                throw e;
            }
            finally {
                this.loading = false;
            }
        },
        /* ────────────── 共用 POST helper ────────────── */
        async _post() { throw new Error('disabled'); }
    }
});
