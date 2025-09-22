// Map incoming telemetry (MQTT-like) to model features
export function basicFeatures(t) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const m = (t === null || t === void 0 ? void 0 : t.MSG) || {};
    const lat = ((_a = m.LA) !== null && _a !== void 0 ? _a : 0) / 1e6;
    const lon = ((_b = m.LG) !== null && _b !== void 0 ? _b : 0) / 1e6;
    const speed = ((_c = m.VS) !== null && _c !== void 0 ? _c : 0);
    const soc = ((_d = m.SO) !== null && _d !== void 0 ? _d : 0);
    const torque = ((_e = m.PT) !== null && _e !== void 0 ? _e : 0) / 100;
    const cadence = ((_f = m.CA) !== null && _f !== void 0 ? _f : 0) * 0.025;
    const assist = ((_g = m.AL) !== null && _g !== void 0 ? _g : 0);
    const ctrlTemp = ((_h = m.CT) !== null && _h !== void 0 ? _h : 2000) === 2000 ? 35 : ((_j = m.CT) !== null && _j !== void 0 ? _j : 35);
    const voltage = ((_k = m.MV) !== null && _k !== void 0 ? _k : 0) / 10;
    const rssi = ((_l = m.GQ) !== null && _l !== void 0 ? _l : 99);
    const signalDbm = rssi === 99 ? -140 : -113 + rssi * 2;
    return { lat, lon, speed, soc, torque, cadence, assist, ctrlTemp, voltage, signalDbm };
}
export function toStrategyInput(distanceKm, pref01, terrain, wind, t) {
    const b = basicFeatures(t);
    // features: [distance, soc, speed, terrain, wind, preference, assist]
    return [distanceKm, b.soc, b.speed, terrain, wind, pref01, b.assist];
}
export function toCarbonInput(distanceKm, energyPerKm = 0.012) {
    // features: [distance, energyPerKm]
    return [distanceKm, energyPerKm];
}
export function toPowerInput(speed, tempC = 25, wind = 0, assist = 1) {
    // features: [speed, tempC, wind, assist]
    return [speed, tempC, wind, assist];
}
export function toBatteryInput(t) {
    const b = basicFeatures(t);
    const socFraction = Math.max(0, Math.min(1.2, (b.soc || 0) / 100));
    const voltage = b.voltage || 48;
    const temp = b.ctrlTemp || 35;
    return [Number(socFraction.toFixed(4)), Number(voltage.toFixed(2)), Number(temp.toFixed(2))];
}
// XGB models from bikerproject expect 8 features
export function toCadenceGearFeaturesFromTelemetry(t) {
    const b = basicFeatures(t);
    // Derive/Randomize missing env features
    const avgSpeed = b.speed || 15 + Math.random() * 10;
    const instant = b.speed;
    const slope = (Math.random() * 4 - 2); // -2..+2 degrees equivalent
    const temperature = 20 + Math.random() * 12; // 20..32 C
    const humidity = 55 + Math.random() * 35; // 55..90 %
    const heatIndex = temperature + Math.max(0, (humidity - 40) / 50) * 5;
    const traffic = Math.floor(Math.random() * 3); // 0..2
    const heartRate = 85 + Math.random() * 70; // bpm
    return [avgSpeed, instant, slope, temperature, humidity, heatIndex, traffic, heartRate];
}
