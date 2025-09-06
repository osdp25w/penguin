/* ─────────────────────────────────────────────────────────────
 *  src/stores/ml.ts ―― 機器學習預測通用 Store
 *  依賴：Pinia 2.x
 * ──────────────────────────────────────────────────────────── */
import { defineStore } from 'pinia';
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
        fetchStrategy(p) {
            return this._post('strategy', 'strategy', p);
        },
        fetchCarbon(p) {
            return this._post('carbon', 'carbon', p);
        },
        fetchPower(p) {
            return this._post('power', 'power', p);
        },
        /* ────────────── 故障機率 (GET) ────────────── */
        async fetchBatteryRisk() {
            var _a;
            try {
                this.loading = true;
                const res = await fetch('/api/v1/ml/battery');
                if (!res.ok)
                    throw new Error(res.statusText);
                const data = await res.json();
                this.batteries = data;
                this.errMsg = '';
                return data; // 呼叫端可直接取得
            }
            catch (e) {
                this.errMsg = (_a = e.message) !== null && _a !== void 0 ? _a : 'fetch battery risk failed';
                throw e;
            }
            finally {
                this.loading = false;
            }
        },
        /* ────────────── 共用 POST helper ────────────── */
        async _post(path, key, payload) {
            var _a;
            try {
                this.loading = true;
                const res = await fetch(`/api/v1/ml/${path}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok)
                    throw new Error(res.statusText);
                const data = await res.json();
                this[key] = data; // 動態欄位寫入
                this.errMsg = '';
                return data; // 回傳解析結果
            }
            catch (e) {
                this.errMsg = (_a = e.message) !== null && _a !== void 0 ? _a : 'ML request failed';
                throw e;
            }
            finally {
                this.loading = false;
            }
        }
    }
});
