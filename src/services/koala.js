// src/services/koala.ts
import { http, saveUserProfile, apiStorage } from '@/lib/api';
import { looksLikeFernet } from '@/lib/fernet'; // fernetEncrypt 已禁用，使用伺服器端加密
export const Koala = {
    // Auth
    async login(email, password) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        let toSend = password;
        const rt = (globalThis || window).CONFIG || {};
        const loginKey = (rt === null || rt === void 0 ? void 0 : rt.KOALA_LOGIN_KEY) || ((_b = (_a = import.meta) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.VITE_KOALA_LOGIN_KEY);
        const forceTs = (_d = (_c = import.meta) === null || _c === void 0 ? void 0 : _c.env) === null || _d === void 0 ? void 0 : _d.VITE_KOALA_FORCE_FERNET_TS;
        const forceIv = (_f = (_e = import.meta) === null || _e === void 0 ? void 0 : _e.env) === null || _f === void 0 ? void 0 : _f.VITE_KOALA_FORCE_FERNET_IV;
        const forceCompat = String(((_h = (_g = import.meta) === null || _g === void 0 ? void 0 : _g.env) === null || _h === void 0 ? void 0 : _h.VITE_KOALA_FORCE_FERNET_COMPAT) || '').toLowerCase() === '1' || String(((_k = (_j = import.meta) === null || _j === void 0 ? void 0 : _j.env) === null || _k === void 0 ? void 0 : _k.VITE_KOALA_FORCE_FERNET_COMPAT) || '').toLowerCase() === 'true';
        // Encrypt plaintext if a login key is provided and input isn't already Fernet
        if (loginKey && password && !looksLikeFernet(password)) {
            // Helper: ensure we never fall back to sending plaintext
            const mustBeToken = async () => {
                // DEV + forced ts/iv: deterministic replay is mandatory
                if (import.meta.env.DEV && forceTs && forceIv) {
                    const r = await fetch('/local/fernet/replay', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: password, ts: Number(forceTs), iv: forceIv, compat: forceCompat })
                    });
                    if (!r.ok) {
                        const txt = await r.text().catch(() => '');
                        throw new Error(`REPLAY_FAILED(${r.status}) ${txt}`);
                    }
                    const j = await r.json().catch(() => ({}));
                    if (!(j === null || j === void 0 ? void 0 : j.token))
                        throw new Error('REPLAY_NO_TOKEN');
                    return j.token;
                }
                // In development, prioritize local endpoint for reliability
                if (import.meta.env.DEV) {
                    try {
                        const r = await fetch('/local/fernet', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: password })
                        });
                        if (r.ok) {
                            const j = await r.json();
                            if ((j === null || j === void 0 ? void 0 : j.token) && j.token !== password) {
                                console.log('[Fernet] Encrypted via local endpoint');
                                return j.token;
                            }
                        }
                        else {
                            console.warn('Local encrypt not ok:', r.status);
                        }
                    }
                    catch (err) {
                        console.warn('Local encrypt endpoint failed:', err);
                    }
                }
                // Use server-side encryption only (Node crypto implementation) for full parity
                try {
                    const r = await fetch('/api/fernet/encrypt', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: password })
                    });
                    if (r.ok) {
                        const j = await r.json();
                        if (j?.token && j.token !== password) {
                            console.log('[Fernet] Encrypted via server endpoint: /api/fernet/encrypt');
                            return j.token;
                        }
                    }
                    else {
                        console.warn('Server encrypt not ok:', r.status);
                    }
                }
                catch (err) {
                    console.warn('Server encrypt endpoint failed:', err);
                }
                // No fallback — enforce server-side encryption
                throw new Error('ENCRYPTION_FAILED: Server encryption unavailable');
            };
            try {
                const token = await mustBeToken();
                // Ensure base64url padding to length % 4 == 0
                const padLen = (4 - (token.length % 4)) % 4;
                toSend = token + (padLen ? '='.repeat(padLen) : '');
                console.log('[Fernet] Password encrypted successfully');
            }
            catch (encryptError) {
                console.error('[Fernet] Encryption failed:', encryptError);
                // Provide user-friendly error message
                throw new Error('無法加密密碼，請重新整理頁面後再試');
            }
        }
        const res = await http.post('/api/account/auth/login/', { email, password: toSend });
        const access = ((_m = (_l = res === null || res === void 0 ? void 0 : res.data) === null || _l === void 0 ? void 0 : _l.tokens) === null || _m === void 0 ? void 0 : _m.access_token) || (res === null || res === void 0 ? void 0 : res.token);
        const refresh = (_p = (_o = res === null || res === void 0 ? void 0 : res.data) === null || _o === void 0 ? void 0 : _o.tokens) === null || _p === void 0 ? void 0 : _p.refresh_token;
        const profile = (_q = res === null || res === void 0 ? void 0 : res.data) === null || _q === void 0 ? void 0 : _q.profile;
        if (access) {
            try {
                localStorage.setItem(apiStorage.ACCESS_KEY, access);
                if (refresh)
                    localStorage.setItem(apiStorage.REFRESH_KEY, refresh);
            }
            catch (_r) { }
        }
        if (profile)
            saveUserProfile(profile);
        return { access, refresh, profile };
    },
    async logout() {
        try {
            await http.post('/api/account/auth/logout/');
        }
        catch (_a) { }
    },
    // Registration / availability
    checkAvailability(payload) {
        // API in Postman is GET but with body; using GET with query string for safety
        const qs = new URLSearchParams();
        if (payload.email)
            qs.set('email', payload.email);
        if (payload.username)
            qs.set('username', payload.username);
        const q = qs.toString();
        return http.get(`/api/account/register/check-availability/${q ? '?' + q : ''}`);
    },
    register(payload) {
        return http.post('/api/account/register/', payload);
    },
    // Members
    async listMembers() {
        var _a;
        const res = await http.get('/api/account/members/');
        return ((_a = res === null || res === void 0 ? void 0 : res.data) === null || _a === void 0 ? void 0 : _a.members) || [];
    },
    getMember(id) {
        return http.get(`/api/account/members/${id}/`);
    },
    updateMember(id, patch) {
        return http.patch(`/api/account/members/${id}/`, patch);
    },
    deleteMember(id) {
        return http.del(`/api/account/members/${id}/`);
    },
    // Staff
    async listStaff() {
        var _a;
        const res = await http.get('/api/account/staff/');
        return ((_a = res === null || res === void 0 ? void 0 : res.data) === null || _a === void 0 ? void 0 : _a.staff) || [];
    },
    getStaff(id) {
        return http.get(`/api/account/staff/${id}/`);
    },
    updateStaff(id, patch) {
        return http.patch(`/api/account/staff/${id}/`, patch);
    },
    deleteStaff(id) {
        return http.del(`/api/account/staff/${id}/`);
    }
};
