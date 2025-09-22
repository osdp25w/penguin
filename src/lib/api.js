// src/lib/api.ts
// Lightweight fetch wrapper for Koala APIs with base URL and auth handling
const ACCESS_KEY = 'auth_access_token';
const REFRESH_KEY = 'auth_refresh_token';
const USER_KEY = 'penguin.user';
// 往下兼容
const LEGACY_ACCESS_KEY = 'penguin.jwt';
const LEGACY_REFRESH_KEY = 'penguin.refresh';
function runtime() {
    try {
        return (globalThis === null || globalThis === void 0 ? void 0 : globalThis.CONFIG) || {};
    }
    catch (_a) {
        return {};
    }
}
function getBaseUrl() {
    var _a, _b, _c, _d, _e, _f;
    const rt = runtime();
    const envBase = ((_b = (_a = import.meta) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.VITE_KOALA_BASE_URL) || ((_d = (_c = import.meta) === null || _c === void 0 ? void 0 : _c.env) === null || _d === void 0 ? void 0 : _d.VITE_API_BASE);
    // Use direct URL - no proxy in both dev and production
    const base = ((_f = (_e = rt.API_BASE) !== null && _e !== void 0 ? _e : envBase) !== null && _f !== void 0 ? _f : 'https://koala.osdp25w.xyz').replace(/\/$/, '');
    return base;
}
function getAccessToken() {
    try {
        return localStorage.getItem(ACCESS_KEY) || localStorage.getItem(LEGACY_ACCESS_KEY);
    }
    catch (_a) {
        return null;
    }
}
function getRefreshToken() {
    try {
        return localStorage.getItem(REFRESH_KEY) || localStorage.getItem(LEGACY_REFRESH_KEY);
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
        // 清除舊 keys
        localStorage.removeItem(LEGACY_ACCESS_KEY);
        localStorage.removeItem(LEGACY_REFRESH_KEY);
    }
    catch (_a) { }
}
async function request(path, opts = {}) {
    var _a, _b;
    const base = getBaseUrl();
    // Accept full URL; for absolute API paths ('/api/...') don't prepend base
    let url;
    if (/^https?:/i.test(path))
        url = path;
    else if (path.startsWith('/api')) {
        // Always use base URL for API paths, no relative paths
        url = `${base}${path}`;
    }
    else
        url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
    // Direct call to koala.osdp25w.xyz - no proxy rewriting
    const headers = {
        'Content-Type': 'application/json',
        ...(opts.headers || {})
    };
    const token = getAccessToken();
    if (token)
        headers['Authorization'] = `Bearer ${token}`;
    const exec = async () => fetch(url, { ...opts, headers });
    let res = await exec();
    // 401 handling removed - let auth store handle token refresh via upper layers
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || res.statusText);
    }
    // Handle empty responses
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json'))
        return undefined;
    const data = await res.json();
    // Auto-decrypt sensitive values (client-side)
    const rt = runtime();
    const sensitiveKey = rt.KOALA_SENSITIVE_KEY || ((_b = (_a = import.meta) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.VITE_KOALA_SENSITIVE_KEY);
    if (sensitiveKey) {
        try {
            const dec = await decryptSensitiveDeep(data, sensitiveKey);
            return dec;
        }
        catch (_c) {
            return data;
        }
    }
    return data;
}
// Recursively decrypt any Fernet-looking strings in an object/array
async function decryptSensitiveDeep(input, key) {
    const { fernetDecrypt, looksLikeFernetToken } = await import('@/lib/fernet_client');
    // Collect tokens map for batch decryption
    const tokens = new Set();
    const collect = (val) => {
        if (typeof val === 'string' && looksLikeFernetToken(val))
            tokens.add(val);
        else if (Array.isArray(val))
            val.forEach(collect);
        else if (val && typeof val === 'object')
            Object.values(val).forEach(collect);
    };
    collect(input);
    if (tokens.size === 0)
        return input;
    const mapping = new Map();
    for (const tok of tokens) {
        try {
            mapping.set(tok, await fernetDecrypt(tok, key));
        }
        catch (_a) { }
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
    var _a, _b;
    const base = getBaseUrl();
    const refresh = getRefreshToken();
    if (!refresh) {
        console.warn('[refreshToken] No refresh token available');
        return false;
    }
    try {
        console.log('[refreshToken] Attempting to refresh access token...');
        const res = await fetch(`${base}/api/account/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refresh })
        });
        if (!res.ok) {
            console.warn('[refreshToken] Refresh failed with status:', res.status);
            // If refresh fails, clear tokens to force re-login
            clearAuthStorage();
            return false;
        }
        const data = await res.json();
        console.log('[refreshToken] Response received:', {
            code: data === null || data === void 0 ? void 0 : data.code,
            hasTokens: !!((_a = data === null || data === void 0 ? void 0 : data.data) === null || _a === void 0 ? void 0 : _a.tokens)
        });
        // Handle different response formats
        let access;
        let newRefresh;
        if ((data === null || data === void 0 ? void 0 : data.code) === 2000 && ((_b = data === null || data === void 0 ? void 0 : data.data) === null || _b === void 0 ? void 0 : _b.tokens)) {
            // Standard Koala response format
            access = data.data.tokens.access_token;
            newRefresh = data.data.tokens.refresh_token;
        }
        else if (data === null || data === void 0 ? void 0 : data.access_token) {
            // Alternative format
            access = data.access_token;
            newRefresh = data.refresh_token;
        }
        else if (data === null || data === void 0 ? void 0 : data.token) {
            // Simple format
            access = data.token;
        }
        if (access) {
            setTokens(access, newRefresh || refresh); // Keep old refresh if no new one
            console.log('[refreshToken] Token refreshed successfully');
            return true;
        }
        else {
            console.warn('[refreshToken] No access token in response');
            clearAuthStorage();
            return false;
        }
    }
    catch (error) {
        console.error('[refreshToken] Network error:', error);
        return false;
    }
}
// Enhanced refresh with profile update
export async function refreshTokenWithProfile() {
    const base = getBaseUrl();
    const refresh = getRefreshToken();
    if (!refresh)
        return { success: false };
    try {
        const res = await fetch(`${base}/api/account/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refresh })
        });
        if (!res.ok) {
            clearAuthStorage();
            return { success: false };
        }
        const data = await res.json();
        if ((data === null || data === void 0 ? void 0 : data.code) === 2000 && (data === null || data === void 0 ? void 0 : data.data)) {
            const { tokens, profile } = data.data;
            if (tokens === null || tokens === void 0 ? void 0 : tokens.access_token) {
                setTokens(tokens.access_token, tokens.refresh_token || refresh);
                if (profile)
                    saveUserProfile(profile);
                return { success: true, profile };
            }
        }
        return { success: false };
    }
    catch (_a) {
        return { success: false };
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
