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
        async fetchBatteryRisk(ids = [], stats) {
            var _a, _b;
            try {
                this.loading = true;
                let batteryStats = stats;
                if (!(batteryStats === null || batteryStats === void 0 ? void 0 : batteryStats.length)) {
                    try {
                        const res = await fetch('/api/v1/batteries');
                        if (res.ok) {
                            batteryStats = await res.json();
                        }
                    }
                    catch (err) {
                        console.warn('[ML] Failed to fetch batteries for risk model:', err);
                    }
                }
                let featureInputs;
                if (batteryStats === null || batteryStats === void 0 ? void 0 : batteryStats.length) {
                    featureInputs = batteryStats
                        .map((item) => {
                        var _a, _b;
                        const id = String((_b = (_a = item.id) !== null && _a !== void 0 ? _a : item.vehicleId) !== null && _b !== void 0 ? _b : '').trim();
                        if (!id)
                            return null;
                        const stat = {
                            id,
                            soc: typeof item.soc === 'number' ? item.soc : undefined,
                            temperature: typeof item.temp === 'number' ? item.temp : undefined,
                        };
                        const anyItem = item;
                        if (typeof anyItem.voltage === 'number')
                            stat.voltage = anyItem.voltage;
                        else if (typeof anyItem.mv10 === 'number')
                            stat.mv10 = anyItem.mv10;
                        else if (typeof anyItem.mv === 'number')
                            stat.voltage = anyItem.mv;
                        if (typeof anyItem.ctrlTemp === 'number')
                            stat.ctrlTemp = anyItem.ctrlTemp;
                        return stat;
                    })
                        .filter((v) => !!v);
                }
                const targetIds = ids.length
                    ? ids
                    : (_a = featureInputs === null || featureInputs === void 0 ? void 0 : featureInputs.map((item) => item.id).filter(Boolean)) !== null && _a !== void 0 ? _a : [];
                const out = await predictBatteryRisk(targetIds, featureInputs && featureInputs.length ? featureInputs : undefined);
                this.batteries = out;
                this.errMsg = '';
                return out;
            }
            catch (e) {
                this.errMsg = (_b = e.message) !== null && _b !== void 0 ? _b : 'battery risk failed';
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
