// src/stores/auth.ts
import { defineStore } from 'pinia';
import { Koala } from '@/services/koala';
import { clearAuthStorage, loadUserProfile, saveUserProfile } from '@/lib/api';
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const ROLE_KEY = 'penguin.role';
const LEGACY_TOKEN_KEY = 'penguin.jwt'; // 相容舊版本
// Token 檢查快取，避免頻繁驗證
let tokenCheckCache = null;
/* -------------------------------------------------------------- */
/*  Pinia Store：Auth                                             */
/* -------------------------------------------------------------- */
export const useAuth = defineStore('auth', {
    /* ---------------- State ------------------------------------- */
    state: () => ({
        accessToken: localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY) || '', // 支援舊 token
        refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || '',
        user: (() => {
            var _a, _b, _c, _d;
            // Attempt to restore cached profile if present
            const p = loadUserProfile();
            if (!p)
                return null;
            // 調試：輸出原始 profile 資料
            console.log('[Auth] Raw profile data for role mapping:', {
                id: p.id,
                username: p.username,
                type: p.type,
                profile_type: p.profile_type,
                full_name: p.full_name,
                email: p.email
            });
            const roleId = p.type === 'admin' || ((_a = p.username) === null || _a === void 0 ? void 0 : _a.includes('admin'))
                ? 'admin'
                : p.profile_type === 'staff'
                    ? 'staff'
                    : p.type === 'real'
                        ? 'member'
                        : 'visitor';
            console.log('[Auth] Mapped role:', roleId);
            // 確保 role 存儲到 sessionStorage/localStorage
            try {
                sessionStorage.setItem(ROLE_KEY, roleId);
                localStorage.setItem(ROLE_KEY, roleId);
            }
            catch (e) {
                console.warn('[Auth] Failed to store role to storage:', e);
            }
            const mapped = {
                id: String((_d = (_c = (_b = p.id) !== null && _b !== void 0 ? _b : p.user_id) !== null && _c !== void 0 ? _c : p.uuid) !== null && _d !== void 0 ? _d : ''),
                name: p.full_name || p.username || p.name || '',
                email: p.email || '',
                roleId: roleId,
                avatarUrl: p.avatar_url || p.avatarUrl || undefined,
                phone: p.phone
            };
            return mapped;
        })(),
        err: ''
    }),
    /* ---------------- Getters ----------------------------------- */
    getters: {
        isLogin: (s) => !!s.accessToken,
        isAdmin: (s) => { var _a; return ((_a = s.user) === null || _a === void 0 ? void 0 : _a.roleId) === 'admin'; },
        userName: (s) => { var _a, _b; return (_b = (_a = s.user) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : ''; },
        // 相容性 getter
        token: (s) => s.accessToken
    },
    /* ---------------- Actions ----------------------------------- */
    actions: {
        /* ---------- Token Refresh -------------------------------- */
        async refreshTokens() {
            try {
                console.log('[Auth] Attempting token refresh...');
                if (!this.refreshToken) {
                    throw new Error('No refresh token available');
                }
                const response = await fetch('/api/account/auth/refresh/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        refresh_token: this.refreshToken
                    })
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const data = await response.json();
                if (data.code !== 2000) {
                    throw new Error(data.message || 'Token refresh failed');
                }
                // 更新 tokens
                this.accessToken = data.data.tokens.access_token;
                this.refreshToken = data.data.tokens.refresh_token;
                // 更新本地儲存
                localStorage.setItem(ACCESS_TOKEN_KEY, this.accessToken);
                localStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken);
                // 清除舊 token
                localStorage.removeItem(LEGACY_TOKEN_KEY);
                // 清除 token 檢查快取，因為 token 已更新
                tokenCheckCache = null;
                console.log('[Auth] Token refresh successful');
                return data.data.tokens;
            }
            catch (error) {
                console.error('[Auth] Token refresh failed:', error);
                // Token refresh 失敗時清除所有 token 並退出登入
                this.logout();
                throw error;
            }
        },
        /* ---------- 檢查 Token 是否即將過期 -------------------- */
        isTokenExpiringSoon(token, thresholdMinutes = 5) {
            try {
                // 簡單的 JWT token 解析（不驗證簽名）
                const payload = JSON.parse(atob(token.split('.')[1]));
                const exp = payload.exp * 1000; // Convert to milliseconds
                const now = Date.now();
                const timeUntilExpiry = exp - now;
                const thresholdMs = thresholdMinutes * 60 * 1000;
                return timeUntilExpiry <= thresholdMs;
            }
            catch (error) {
                console.warn('[Auth] Failed to parse token expiry:', error);
                return true; // 當無法解析時假設即將過期
            }
        },
        /* ---------- 自動刷新 Token 如果需要 -------------------- */
        async ensureValidToken() {
            if (!this.accessToken) {
                throw new Error('No access token available');
            }
            // 快取檢查 - 如果 token 相同且還在有效期內，直接返回
            const now = Date.now();
            if ((tokenCheckCache === null || tokenCheckCache === void 0 ? void 0 : tokenCheckCache.token) === this.accessToken && now < tokenCheckCache.validUntil) {
                return this.accessToken;
            }
            // 檢查 token 是否即將過期
            if (this.isTokenExpiringSoon(this.accessToken)) {
                console.log('[Auth] Access token expiring soon, refreshing...');
                await this.refreshTokens();
                // 清除快取，因為 token 已更新
                tokenCheckCache = null;
            }
            // 設定快取 - 30秒內不重複檢查同一個 token
            tokenCheckCache = {
                token: this.accessToken,
                validUntil: now + 30000 // 30秒快取
            };
            return this.accessToken;
        },
        /* ---------- 初始化 Token 狀態 -------------------------- */
        async initTokens() {
            try {
                const accessToken = this.accessToken;
                const refreshToken = this.refreshToken;
                if (accessToken && refreshToken) {
                    // 檢查 access token 是否即將過期，如果是的話嘗試刷新
                    if (this.isTokenExpiringSoon(accessToken)) {
                        console.log('[Auth] Access token expired on init, attempting refresh...');
                        try {
                            await this.refreshTokens();
                        }
                        catch (error) {
                            console.warn('[Auth] Failed to refresh token on init:', error);
                            await this.logout(); // 刷新失敗則登出
                        }
                    }
                }
                else if (accessToken && !refreshToken) {
                    // 只有 access token 沒有 refresh token（可能是舊版本）
                    console.log('[Auth] Found legacy token without refresh token');
                    if (this.isTokenExpiringSoon(accessToken)) {
                        console.log('[Auth] Legacy token expired, logging out');
                        await this.logout();
                    }
                }
            }
            catch (error) {
                console.error('[Auth] Error in initTokens:', error);
                // 不拋出錯誤，避免阻塞應用啟動
            }
        },
        /* ---------- 登入 ------------------------------------------ */
        async login(email, password) {
            var _a, _b, _c;
            try {
                const { access, refresh, profile } = await Koala.login(email, password);
                if (!access)
                    throw new Error('帳號或密碼錯誤');
                if (!refresh) {
                    console.warn('[Auth] No refresh token received from login API');
                }
                // 處理身份證號解密（登入時）
                let idNumber = '';
                if (profile === null || profile === void 0 ? void 0 : profile.national_id) {
                    try {
                        if (profile.national_id.startsWith('gAAAAA')) {
                            const { decryptNationalId } = await import('@/lib/encryption');
                            idNumber = await decryptNationalId(profile.national_id);
                        }
                        else {
                            idNumber = profile.national_id;
                        }
                    }
                    catch (err) {
                        console.warn('Failed to decrypt national ID during login:', err);
                    }
                }
                const mapped = profile ? {
                    id: String((_b = (_a = profile.id) !== null && _a !== void 0 ? _a : profile.user_id) !== null && _b !== void 0 ? _b : ''),
                    name: profile.full_name || profile.username || profile.name || '',
                    email: profile.email || email,
                    // 判斷邏輯：profile_type === 'staff' 表示是 staff 系統，需要進一步查詢實際角色
                    roleId: (() => {
                        var _a;
                        const role = profile.type === 'admin' || ((_a = profile.username) === null || _a === void 0 ? void 0 : _a.includes('admin')) ? 'admin' : profile.profile_type === 'staff' ? 'staff' : profile.type === 'real' ? 'member' : 'visitor';
                        console.log('[Auth] Role mapping:', { profile, mappedRole: role });
                        return role;
                    })(),
                    avatarUrl: profile.avatar_url || undefined,
                    phone: profile.phone,
                    idNumber: idNumber || undefined
                } : null;
                this.accessToken = access;
                this.refreshToken = refresh || ''; // 儲存 refresh token
                this.user = mapped;
                this.err = '';
                // 儲存 profile 到 localStorage，以便頁面重新整理後能還原角色資訊
                if (profile) {
                    saveUserProfile(profile);
                    console.log('[Auth] Profile saved to localStorage:', profile);
                }
                localStorage.setItem(ACCESS_TOKEN_KEY, access);
                if (refresh) {
                    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
                }
                // 清除舊 token
                localStorage.removeItem(LEGACY_TOKEN_KEY);
                if (mapped) {
                    sessionStorage.setItem(ROLE_KEY, mapped.roleId);
                    try {
                        localStorage.setItem(ROLE_KEY, mapped.roleId);
                    }
                    catch (_d) { }
                }
                // 登入成功後，嘗試載入完整的用戶資料
                if ((mapped === null || mapped === void 0 ? void 0 : mapped.id) && access) {
                    try {
                        await this.fetchFullUserProfile();
                    }
                    catch (err) {
                        console.warn('Failed to fetch full user profile after login:', err);
                    }
                }
            }
            catch (e) {
                this.err = (_c = e.message) !== null && _c !== void 0 ? _c : '登入失敗';
                throw e;
            }
        },
        /* ---------- 登出 ------------------------------------------ */
        async logout() {
            try {
                await Koala.logout();
            }
            catch (_a) { }
            this.accessToken = '';
            this.refreshToken = '';
            this.user = null;
            clearAuthStorage();
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            localStorage.removeItem(LEGACY_TOKEN_KEY);
            sessionStorage.removeItem(ROLE_KEY);
            try {
                localStorage.removeItem(ROLE_KEY);
            }
            catch (_b) { }
        },
        /* ---------- 載入完整用戶資料 ------------------------------ */
        async fetchFullUserProfile() {
            var _a;
            if (!this.accessToken || !((_a = this.user) === null || _a === void 0 ? void 0 : _a.id))
                return;
            try {
                const isStaffUser = this.user.roleId === 'admin' || this.user.roleId === 'staff';
                let fullProfile = null;
                if (isStaffUser) {
                    // 使用 Koala.getStaff 載入完整 staff 資料
                    console.log('[fetchFullUserProfile] Loading staff profile for ID:', this.user.id);
                    fullProfile = await Koala.getStaff(this.user.id);
                }
                else {
                    // 使用 Koala.getMember 載入完整 member 資料
                    console.log('[fetchFullUserProfile] Loading member profile for ID:', this.user.id);
                    fullProfile = await Koala.getMember(this.user.id);
                }
                if (fullProfile) {
                    console.log('[fetchFullUserProfile] Loaded full profile:', fullProfile);
                    // 檢查實際的資料結構
                    const actualData = fullProfile.data || fullProfile;
                    console.log('[fetchFullUserProfile] Actual data:', actualData);
                    console.log('[fetchFullUserProfile] phone:', actualData === null || actualData === void 0 ? void 0 : actualData.phone);
                    console.log('[fetchFullUserProfile] national_id:', actualData === null || actualData === void 0 ? void 0 : actualData.national_id);
                    // 處理身份證號解密
                    let idNumber = '';
                    const nationalIdField = actualData === null || actualData === void 0 ? void 0 : actualData.national_id;
                    if (nationalIdField) {
                        console.log('[fetchFullUserProfile] Processing national_id:', nationalIdField);
                        try {
                            if (nationalIdField.startsWith('gAAAAA')) {
                                const { decryptNationalId } = await import('@/lib/encryption');
                                idNumber = await decryptNationalId(nationalIdField);
                                console.log('[fetchFullUserProfile] Decrypted national_id:', idNumber);
                            }
                            else {
                                idNumber = nationalIdField;
                                console.log('[fetchFullUserProfile] Using plain national_id:', idNumber);
                            }
                        }
                        catch (err) {
                            console.warn('Failed to decrypt national ID in full profile:', err);
                        }
                    }
                    else {
                        console.log('[fetchFullUserProfile] No national_id found in API response');
                    }
                    // 更新用戶資料
                    const oldUser = { ...this.user };
                    this.user = {
                        ...this.user,
                        name: (actualData === null || actualData === void 0 ? void 0 : actualData.full_name) || (actualData === null || actualData === void 0 ? void 0 : actualData.username) || this.user.name,
                        email: (actualData === null || actualData === void 0 ? void 0 : actualData.email) || this.user.email,
                        phone: (actualData === null || actualData === void 0 ? void 0 : actualData.phone) || this.user.phone,
                        idNumber: idNumber || this.user.idNumber
                    };
                    console.log('[fetchFullUserProfile] Before update:', oldUser);
                    console.log('[fetchFullUserProfile] After update:', this.user);
                    console.log('[fetchFullUserProfile] Phone updated:', oldUser.phone, '->', this.user.phone);
                    console.log('[fetchFullUserProfile] IdNumber updated:', oldUser.idNumber, '->', this.user.idNumber);
                }
            }
            catch (err) {
                console.warn('[fetchFullUserProfile] Failed to load full profile:', err);
            }
        },
        /* ---------- 獲取個人資料 ---------------------------------- */
        async fetchMe() {
            var _a, _b, _c;
            // Koala collection does not expose a /me endpoint; restore from cache if any
            if (!this.accessToken)
                return;
            const p = loadUserProfile();
            if (p) {
                // 處理身份證號解密（如果有的話）
                let idNumber = '';
                if (p.national_id) {
                    try {
                        if (p.national_id.startsWith('gAAAAA')) {
                            const { decryptNationalId } = await import('@/lib/encryption');
                            idNumber = await decryptNationalId(p.national_id);
                        }
                        else {
                            idNumber = p.national_id;
                        }
                    }
                    catch (err) {
                        console.warn('Failed to decrypt national ID in profile:', err);
                        idNumber = ''; // 不顯示解密失敗的資料
                    }
                }
                const mapped = {
                    id: String((_b = (_a = p.id) !== null && _a !== void 0 ? _a : p.user_id) !== null && _b !== void 0 ? _b : ''),
                    name: p.full_name || p.username || p.name || '',
                    email: p.email || '',
                    roleId: (p.type === 'admin' || ((_c = p.username) === null || _c === void 0 ? void 0 : _c.includes('admin')) ? 'admin' : p.profile_type === 'staff' ? 'staff' : p.type === 'real' ? 'member' : 'visitor'),
                    avatarUrl: p.avatar_url || undefined,
                    phone: p.phone,
                    idNumber: idNumber || undefined
                };
                this.user = mapped;
                // 更新 localStorage 中的 profile
                saveUserProfile(p);
                console.log('[Auth] Profile updated in localStorage after fetchMe');
                try {
                    sessionStorage.setItem(ROLE_KEY, mapped.roleId);
                }
                catch (_d) { }
                return mapped;
            }
        },
        /* ---------- 更新個人資料 ---------------------------------- */
        async updateMe(payload) {
            var _a;
            if (!this.accessToken)
                throw new Error('未登入');
            if (!((_a = this.user) === null || _a === void 0 ? void 0 : _a.id))
                throw new Error('無法獲取用戶 ID');
            // 確保 token 有效
            const validToken = await this.ensureValidToken();
            try {
                // 根據用戶角色選擇對應的 API
                const isStaffUser = this.user.roleId === 'admin' || this.user.roleId === 'staff';
                const apiEndpoint = isStaffUser
                    ? `/api/account/staff/${this.user.id}/`
                    : `/api/account/members/${this.user.id}/`;
                // 映射前端欄位到後端欄位
                const apiPayload = {};
                if (payload.name)
                    apiPayload.full_name = payload.name;
                if (payload.email)
                    apiPayload.email = payload.email;
                if (payload.phone)
                    apiPayload.phone = payload.phone;
                // Staff 系統使用 username，Member 系統可能也有 username 欄位
                if (payload.name)
                    apiPayload.username = payload.name;
                // 身份證號加密處理 (只有 Member 需要)
                if (!isStaffUser && payload.idNumber) {
                    try {
                        const { encryptNationalId, looksEncrypted } = await import('@/lib/encryption');
                        // 檢查是否已經是加密的資料 - 如果是，表示前端有問題，應該傳明文
                        if (looksEncrypted(payload.idNumber)) {
                            console.warn('National ID appears to be already encrypted. This should not happen.');
                            throw new Error('身分證號格式錯誤，請重新輸入明文身分證號');
                        }
                        // 加密明文身分證號
                        console.log('Encrypting national ID for backend:', payload.idNumber);
                        apiPayload.national_id = await encryptNationalId(payload.idNumber);
                        console.log('Encrypted national ID:', apiPayload.national_id);
                    }
                    catch (encErr) {
                        console.error('Failed to encrypt national ID:', encErr);
                        throw new Error('身分證號加密失敗：' + (encErr.message || '未知錯誤'));
                    }
                }
                // 密碼加密處理
                if (payload.password) {
                    try {
                        const { encryptPassword } = await import('@/lib/encryption');
                        // 更新個人資料時使用註冊模式（GENERIC_SECRET_SIGNING_KEY）
                        apiPayload.password = await encryptPassword(payload.password, true);
                    }
                    catch (encErr) {
                        console.warn('Failed to encrypt password:', encErr);
                        throw new Error('密碼加密失敗，請重試');
                    }
                }
                console.log(`[UpdateMe] Using ${isStaffUser ? 'Staff' : 'Member'} API:`, apiEndpoint);
                console.log('[UpdateMe] Payload:', apiPayload);
                const res = await fetch(apiEndpoint, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${validToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(apiPayload)
                });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || errorData.detail || '更新個人資料失敗');
                }
                const updatedData = await res.json();
                console.log('[UpdateMe] Updated data:', updatedData);
                // 更新本地用戶資料
                if (this.user) {
                    this.user.name = updatedData.full_name || updatedData.username || this.user.name;
                    this.user.email = updatedData.email || this.user.email;
                    this.user.phone = updatedData.phone || this.user.phone;
                    // 注意：不直接存儲解密後的身份證號，保持加密狀態
                }
                return this.user;
            }
            catch (e) {
                console.error('Update me error:', e);
                throw e;
            }
        }
    }
});
