/**
 * Koala WebSocket 共用 util：讀取 runtime/env 設定與建構 ws(s) URL。
 */
function runtimeConfig() {
    try {
        return (globalThis === null || globalThis === void 0 ? void 0 : globalThis.CONFIG) || {};
    }
    catch (error) {
        console.warn('[KoalaWS] Failed to read runtime CONFIG:', error);
        return {};
    }
}
export function getKoalaBaseUrl() {
    var _a, _b, _c, _d, _e, _f;
    const rt = runtimeConfig();
    const envBase = ((_b = (_a = import.meta) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.VITE_KOALA_BASE_URL) || ((_d = (_c = import.meta) === null || _c === void 0 ? void 0 : _c.env) === null || _d === void 0 ? void 0 : _d.VITE_API_BASE);
    const base = ((_f = (_e = rt.API_BASE) !== null && _e !== void 0 ? _e : envBase) !== null && _f !== void 0 ? _f : 'https://koala.osdp25w.xyz').replace(/\/$/, '');
    return base;
}
export function toWsUrl(url) {
    if (url.startsWith('ws://') || url.startsWith('wss://'))
        return url;
    if (url.startsWith('https://'))
        return 'wss://' + url.slice('https://'.length);
    if (url.startsWith('http://'))
        return 'ws://' + url.slice('http://'.length);
    return 'wss://' + url.replace(/\/$/, '');
}
