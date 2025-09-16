import { DEFAULTS } from './config';
import { getModelPath } from './paths';
import { getSession, runSession } from './onnx';
import { toStrategyInput, toCarbonInput, toPowerInput, toBatteryInput, toCadenceGearFeaturesFromTelemetry } from './featurizer';
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
export async function predictStrategy(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const pref = clamp((_a = input.preference01) !== null && _a !== void 0 ? _a : 0.3, 0, 1);
    const terr = clamp((_b = input.terrain01) !== null && _b !== void 0 ? _b : 0.3, 0, 1);
    const wind = clamp((_c = input.wind01) !== null && _c !== void 0 ? _c : 0.5, 0, 1);
    const feats = toStrategyInput(input.distanceKm, pref, terr, wind, input.telemetry);
    // Try ONNX
    const sess = await getSession(getModelPath('strategy'));
    if (sess) {
        try {
            const out = await runSession(sess, { input: feats });
            const estTime = Number((_j = (_f = (_e = (_d = out === null || out === void 0 ? void 0 : out.time) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e[0]) !== null && _f !== void 0 ? _f : (_h = (_g = out === null || out === void 0 ? void 0 : out.output) === null || _g === void 0 ? void 0 : _g.data) === null || _h === void 0 ? void 0 : _h[0]) !== null && _j !== void 0 ? _j : 0);
            const estEnergy = Number((_q = (_m = (_l = (_k = out === null || out === void 0 ? void 0 : out.energy) === null || _k === void 0 ? void 0 : _k.data) === null || _l === void 0 ? void 0 : _l[0]) !== null && _m !== void 0 ? _m : (_p = (_o = out === null || out === void 0 ? void 0 : out.output) === null || _o === void 0 ? void 0 : _o.data) === null || _p === void 0 ? void 0 : _p[1]) !== null && _q !== void 0 ? _q : 0);
            return { polyline: [], estTime, estEnergy };
        }
        catch (_r) { }
    }
    // Heuristic fallback
    const base = DEFAULTS.baseSpeedKph;
    // preference: +20% speed at 1, -10% at 0
    const prefMul = 0.9 + pref * 0.3;
    // terrain: -20% speed at 1
    const terrMul = 1 - terr * 0.2;
    // wind: -15% speed at 1 (逆風)
    const windMul = 1 - wind * 0.15;
    const speed = Math.max(8, base * prefMul * terrMul * windMul);
    const estTime = (input.distanceKm / speed) * 60;
    const estEnergy = input.distanceKm * DEFAULTS.energyPerKmKWh * (1 + terr * 0.3 + wind * 0.2);
    return { polyline: [], estTime: +estTime.toFixed(1), estEnergy: +estEnergy.toFixed(2) };
}
export async function predictCarbon(input) {
    var _a, _b, _c, _d, _e, _f, _g;
    const energyPerKm = (_a = input.energyPerKmKWh) !== null && _a !== void 0 ? _a : DEFAULTS.energyPerKmKWh;
    const feats = toCarbonInput(input.distanceKm, energyPerKm);
    const sess = await getSession(getModelPath('carbon'));
    if (sess) {
        try {
            const out = await runSession(sess, { input: feats });
            const saved = Number((_g = (_d = (_c = (_b = out === null || out === void 0 ? void 0 : out.saved) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : (_f = (_e = out === null || out === void 0 ? void 0 : out.output) === null || _e === void 0 ? void 0 : _e.data) === null || _f === void 0 ? void 0 : _f[0]) !== null && _g !== void 0 ? _g : 0);
            return { saved };
        }
        catch (_h) { }
    }
    // Heuristic: CO2_saved = carFactor*km - ebikeFactor*(energyPerKm*km)
    const car = DEFAULTS.carCO2PerKm * input.distanceKm;
    const ebike = DEFAULTS.ebikeCO2PerKWh * (energyPerKm * input.distanceKm);
    return { saved: +(car - ebike).toFixed(2) };
}
export async function predictPower(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    const feats = toPowerInput(input.speedKph, (_a = input.tempC) !== null && _a !== void 0 ? _a : 25, ((_b = input.wind01) !== null && _b !== void 0 ? _b : 0.5) * 2 - 1, (_c = input.assist) !== null && _c !== void 0 ? _c : 1);
    const sess = await getSession(getModelPath('power'));
    if (sess) {
        try {
            const out = await runSession(sess, { input: feats });
            const keys = Object.keys(out || {});
            const first = keys.length ? out[keys[0]] : undefined;
            const kWh = Number((_l = (_j = (_f = (_e = (_d = out === null || out === void 0 ? void 0 : out.kwh) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e[0]) !== null && _f !== void 0 ? _f : (_h = (_g = out === null || out === void 0 ? void 0 : out.output) === null || _g === void 0 ? void 0 : _g.data) === null || _h === void 0 ? void 0 : _h[0]) !== null && _j !== void 0 ? _j : (_k = first === null || first === void 0 ? void 0 : first.data) === null || _k === void 0 ? void 0 : _k[0]) !== null && _l !== void 0 ? _l : 0);
            const next = String((_p = (_o = (_m = out === null || out === void 0 ? void 0 : out.next) === null || _m === void 0 ? void 0 : _m.data) === null || _o === void 0 ? void 0 : _o[0]) !== null && _p !== void 0 ? _p : '建議到站點 A 充電');
            return { kWh, nextCharge: next };
        }
        catch (_q) { }
    }
    // Heuristic: kWh roughly proportional to speed^2 for drag plus baseline
    const drag = Math.pow(input.speedKph / 25, 2);
    const kWh = +(drag * 0.2 + 0.1).toFixed(2);
    const next = kWh > 0.25 ? '建議 30 分內充電' : '續航充足';
    return { kWh, nextCharge: next };
}
export async function predictBatteryRisk(ids, t) {
    var _a, _b, _c;
    const sess = await getSession(getModelPath('battery'));
    if (sess) {
        try {
            const feats = toBatteryInput(t);
            const out = await runSession(sess, { input: feats });
            const keys = Object.keys(out || {});
            const first = keys.length ? out[keys[0]] : undefined;
            // for classifiers, sometimes output is probability vector; try first element
            let p = Number((_b = (_a = out === null || out === void 0 ? void 0 : out.prob) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b[0]);
            if (!Number.isFinite(p))
                p = Number((_c = first === null || first === void 0 ? void 0 : first.data) === null || _c === void 0 ? void 0 : _c[0]);
            if (!Number.isFinite(p))
                p = 0.1;
            return ids.map((id) => ({ id, health: +(100 - p * 100).toFixed(1), faultP: +p.toFixed(2) }));
        }
        catch (_d) { }
    }
    // Heuristic: random but stable per id
    return ids.map((id, i) => {
        const x = (id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 100) / 100;
        const p = 0.05 + (x * 0.2); // 5% - 25%
        return { id, health: +(100 - p * 100).toFixed(1), faultP: +p.toFixed(2) };
    });
}
/*
 * Optional: Use existing bikerproject XGB models (converted to ONNX) if present.
 * Expected files (place under /public/models):
 *  - trained_cadence_XGBRegressor_model.onnx (or _XGBClassifier_)
 *  - trained_gear_rate_XGBRegressor_model.onnx (or _XGBClassifier_)
 */
async function predictWithTreeModel(modelName, features) {
    var _a;
    const sess = await getSession(`/models/${modelName}`);
    if (!sess)
        return null;
    try {
        const out = await runSession(sess, { input: features, float_input: features });
        // Take first scalar from outputs
        const firstKey = Object.keys(out)[0];
        const tensor = out[firstKey];
        const val = Number((_a = tensor === null || tensor === void 0 ? void 0 : tensor.data) === null || _a === void 0 ? void 0 : _a[0]);
        return Number.isFinite(val) ? val : null;
    }
    catch (e) {
        console.warn('[ONNX] predictWithTreeModel failed:', modelName, e);
        return null;
    }
}
export async function predictCadenceFromModel(t) {
    var _a;
    const feats = toCadenceGearFeaturesFromTelemetry(t);
    // Try regressor first then classifier
    return ((_a = await predictWithTreeModel('trained_cadence_XGBRegressor_model.onnx', feats)) !== null && _a !== void 0 ? _a : await predictWithTreeModel('trained_cadence_XGBClassifier_model.onnx', feats));
}
export async function predictGearRateFromModel(t) {
    var _a;
    const feats = toCadenceGearFeaturesFromTelemetry(t);
    const out = ((_a = await predictWithTreeModel('trained_gear_rate_XGBRegressor_model.onnx', feats)) !== null && _a !== void 0 ? _a : await predictWithTreeModel('trained_gear_rate_XGBClassifier_model.onnx', feats));
    return out;
}
