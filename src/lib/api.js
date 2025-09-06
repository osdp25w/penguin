// src/lib/api.ts
// Lightweight fetch wrapper for Koala APIs with base URL and auth handling
const ACCESS_KEY = 'penguin.jwt';
const REFRESH_KEY = 'penguin.refresh';
const USER_KEY = 'penguin.user';
function runtime() { try { return (globalThis || window).CONFIG || {}; } catch { return {}; } }
function getBaseUrl() {
    var _a, _b;
    const rt = runtime();
    const envBase = ((_b = (_a = import.meta) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.VITE_KOALA_BASE_URL) || (import.meta.env === null || import.meta.env === void 0 ? void 0 : import.meta.env.VITE_API_BASE);
    if (import.meta && import.meta.env && import.meta.env.DEV) {
        let base = envBase !== null && envBase !== void 0 ? envBase : '/koala';
        if (/^https?:/i.test(base))
            base = '/koala';
        return String(base).replace(/\/$/, '');
    }
    const base = (rt.API_BASE || envBase || '').replace(/\/$/, '');
    return base;
}
function getAccessToken() {
    try {
        return localStorage.getItem(ACCESS_KEY);
    }
    catch (_a) {
        return null;
    }
}
function getRefreshToken() {
    try {
        return localStorage.getItem(REFRESH_KEY);
    }
    catch (_a) {
        return null;
    }
}
function setTokens(access, refresh) {
    try {
        if (access)
            localStorage.setItem(ACCESS_KEY, access);
        if (refresh)
            localStorage.setItem(REFRESH_KEY, refresh);
    }
    catch (_a) { }
}
export function clearAuthStorage() {
    try {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
    }
    catch (_a) { }
}
async function request(path, opts = {}) {
    var _a, _b;
    const base = getBaseUrl();
    // Accept full URL; if path starts with '/api', don't prepend base
    let url;
    if (/^https?:/i.test(path))
        url = path;
    else if (path.startsWith('/api'))
        url = path;
    else
        url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
    // Last-resort rewrite: if running from local/LAN dev and URL points to Koala domain, rewrite to proxy
    try {
        const isLocal = typeof window !== 'undefined' && /^http:\/\/(localhost|127\.0\.0\.1|10\.|172\.(1[6-9]|2\d|3[0-1])|192\.168\.)/i.test(window.location.origin);
        if (isLocal && /^https?:\/\/koala\.osdp25w\.xyz\//i.test(url)) {
            const u = new URL(url);
            url = `/koala${u.pathname}${u.search}`;
        }
    }
    catch (_c) { }
    const headers = {
        'Content-Type': 'application/json',
        ...(opts.headers || {})
    };
    const token = getAccessToken();
    if (token)
        headers['Authorization'] = `Bearer ${token}`;
    const exec = async () => fetch(url, { ...opts, headers });
    let res = await exec();
    if (res.status === 401) {
        // Try refresh once
        const ok = await refreshToken();
        if (ok) {
            const newToken = getAccessToken();
            if (newToken)
                headers['Authorization'] = `Bearer ${newToken}`;
            res = await exec();
        }
    }
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || res.statusText);
    }
    // Handle empty responses
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json'))
        return undefined;
    const data = await res.json();
    // Auto-decrypt sensitive values if a key is provided
    const rt = runtime();
    const sensitiveKey = (rt === null || rt === void 0 ? void 0 : rt.KOALA_SENSITIVE_KEY) || ((_b = (_a = import.meta) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.VITE_KOALA_SENSITIVE_KEY);
    if (sensitiveKey) {
        try {
            const dec = await decryptSensitiveDeep(data, sensitiveKey);
            return dec;
        }
        catch (_d) {
            // ignore decryption errors, return raw data
            return data;
        }
    }
    return data;
}
// Recursively decrypt any Fernet-looking strings in an object/array
async function decryptSensitiveDeep(input, key) {
    const { fernetDecrypt, looksLikeFernet } = await import('@/lib/fernet');
    // Collect tokens map for batch decryption
    const tokens = new Set();
    const collect = (val) => {
        if (typeof val === 'string' && looksLikeFernet(val))
            tokens.add(val);
        else if (Array.isArray(val))
            val.forEach(collect);
        else if (val && typeof val === 'object')
            Object.values(val).forEach(collect);
    };
    collect(input);
    if (tokens.size === 0)
        return input;
    const isSecure = globalThis.isSecureContext === true;
    const mapping = new Map();
    if (isSecure) {
        for (const t of tokens) {
            try {
                mapping.set(t, await fernetDecrypt(t, key));
            }
            catch ( /* keep raw */_a) { /* keep raw */ }
        }
    }
    else if (import.meta.env.DEV) {
        try {
            const r = await fetch('/local/fernet/decrypt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tokens: Array.from(tokens), key })
            });
            if (r.ok) {
                const j = await r.json();
                const arr = (j === null || j === void 0 ? void 0 : j.values) || [];
                Array.from(tokens).forEach((tok, i) => {
                    const dec = arr[i];
                    if (typeof dec === 'string')
                        mapping.set(tok, dec);
                });
            }
        }
        catch (_b) {
            // fallthrough
        }
    }
    const replace = (val) => {
        if (typeof val === 'string' && mapping.has(val))
            return mapping.get(val);
        if (Array.isArray(val))
            return val.map(replace);
        if (val && typeof val === 'object') {
            const out = Array.isArray(val) ? [] : { ...val };
            for (const k of Object.keys(val))
                out[k] = replace(val[k]);
            return out;
        }
        return val;
    };
    return replace(input);
}
export const http = {
    get: (path, init) => request(path, { method: 'GET', ...(init || {}) }),
    post: (path, body, init) => request(path, { method: 'POST', body: body == null ? undefined : JSON.stringify(body), ...(init || {}) }),
    patch: (path, body, init) => request(path, { method: 'PATCH', body: body == null ? undefined : JSON.stringify(body), ...(init || {}) }),
    put: (path, body, init) => request(path, { method: 'PUT', body: body == null ? undefined : JSON.stringify(body), ...(init || {}) }),
    del: (path, init) => request(path, { method: 'DELETE', ...(init || {}) })
};
// Token refresh flow
export async function refreshToken() {
    var _a, _b, _c, _d;
    const base = getBaseUrl();
    const refresh = getRefreshToken();
    if (!refresh)
        return false;
    try {
        const res = await fetch(`${base}/api/account/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refresh })
        });
        if (!res.ok)
            return false;
        const data = await res.json();
        const access = ((_b = (_a = data === null || data === void 0 ? void 0 : data.data) === null || _a === void 0 ? void 0 : _a.tokens) === null || _b === void 0 ? void 0 : _b.access_token) || (data === null || data === void 0 ? void 0 : data.access_token) || (data === null || data === void 0 ? void 0 : data.token);
        const newRefresh = ((_d = (_c = data === null || data === void 0 ? void 0 : data.data) === null || _c === void 0 ? void 0 : _c.tokens) === null || _d === void 0 ? void 0 : _d.refresh_token) || (data === null || data === void 0 ? void 0 : data.refresh_token);
        if (access)
            setTokens(access, newRefresh);
        return !!access;
    }
    catch (_e) {
        return false;
    }
}
export function saveUserProfile(profile) {
    try {
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
    }
    catch (_a) { }
}
export function loadUserProfile() {
    try {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    catch (_a) {
        return null;
    }
}
export const apiStorage = {
    ACCESS_KEY,
    REFRESH_KEY,
    USER_KEY
};
