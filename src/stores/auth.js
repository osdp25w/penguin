// src/stores/auth.ts
import { defineStore } from 'pinia';
import { Koala } from '@/services/koala';
import { clearAuthStorage, loadUserProfile } from '@/lib/api';
const TOKEN_KEY = 'penguin.jwt';
const ROLE_KEY = 'penguin.role';
/* -------------------------------------------------------------- */
/*  Pinia Store：Auth                                             */
/* -------------------------------------------------------------- */
export const useAuth = defineStore('auth', {
    /* ---------------- State ------------------------------------- */
    state: () => ({
        token: localStorage.getItem(TOKEN_KEY) || '',
        user: (() => {
            var _a, _b, _c, _d;
            // Attempt to restore cached profile if present
            const p = loadUserProfile();
            if (!p)
                return null;
            const mapped = {
                id: String((_c = (_b = (_a = p.id) !== null && _a !== void 0 ? _a : p.user_id) !== null && _b !== void 0 ? _b : p.uuid) !== null && _c !== void 0 ? _c : ''),
                name: p.full_name || p.username || p.name || '',
                email: p.email || '',
                roleId: (((_d = p.username) === null || _d === void 0 ? void 0 : _d.includes('admin')) ? 'admin' : p.profile_type === 'staff' ? 'staff' : p.type === 'manager' ? 'manager' : 'user'),
                avatarUrl: p.avatar_url || p.avatarUrl || undefined,
                phone: p.phone
            };
            return mapped;
        })(),
        err: ''
    }),
    /* ---------------- Getters ----------------------------------- */
    getters: {
        isLogin: (s) => !!s.token,
        isAdmin: (s) => { var _a; return ((_a = s.user) === null || _a === void 0 ? void 0 : _a.roleId) === 'admin'; },
        userName: (s) => { var _a, _b; return (_b = (_a = s.user) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : ''; }
    },
    /* ---------------- Actions ----------------------------------- */
    actions: {
        /* ---------- 登入 ------------------------------------------ */
        async login(email, password) {
            var _a, _b, _c, _d;
            try {
                const { access, refresh, profile } = await Koala.login(email, password);
                if (!access)
                    throw new Error('帳號或密碼錯誤');
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
                    // 由於登入時沒有返回實際角色，暫時根據 username 判斷
                    roleId: (((_c = profile.username) === null || _c === void 0 ? void 0 : _c.includes('admin')) ? 'admin' : profile.profile_type === 'staff' ? 'staff' : profile.type === 'manager' ? 'manager' : 'user'),
                    avatarUrl: profile.avatar_url || undefined,
                    phone: profile.phone,
                    idNumber: idNumber || undefined
                } : null;
                this.token = access;
                this.user = mapped;
                this.err = '';
                localStorage.setItem(TOKEN_KEY, access);
                if (mapped) {
                    sessionStorage.setItem(ROLE_KEY, mapped.roleId);
                    try {
                        localStorage.setItem(ROLE_KEY, mapped.roleId);
                    }
                    catch (_e) { }
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
                this.err = (_d = e.message) !== null && _d !== void 0 ? _d : '登入失敗';
                throw e;
            }
        },
        /* ---------- 登出 ------------------------------------------ */
        async logout() {
            try {
                await Koala.logout();
            }
            catch (_a) { }
            this.token = '';
            this.user = null;
            clearAuthStorage();
            sessionStorage.removeItem(ROLE_KEY);
            try {
                localStorage.removeItem(ROLE_KEY);
            }
            catch (_b) { }
        },
        /* ---------- 載入完整用戶資料 ------------------------------ */
        async fetchFullUserProfile() {
            var _a;
            if (!this.token || !((_a = this.user) === null || _a === void 0 ? void 0 : _a.id))
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
            if (!this.token)
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
                    roleId: (((_c = p.username) === null || _c === void 0 ? void 0 : _c.includes('admin')) ? 'admin' : p.profile_type === 'staff' ? 'staff' : p.type === 'manager' ? 'manager' : 'user'),
                    avatarUrl: p.avatar_url || undefined,
                    phone: p.phone,
                    idNumber: idNumber || undefined
                };
                this.user = mapped;
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
            if (!this.token)
                throw new Error('未登入');
            if (!((_a = this.user) === null || _a === void 0 ? void 0 : _a.id))
                throw new Error('無法獲取用戶 ID');
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
                        const { encryptNationalId } = await import('@/lib/encryption');
                        apiPayload.national_id = await encryptNationalId(payload.idNumber);
                    }
                    catch (encErr) {
                        console.warn('Failed to encrypt national ID:', encErr);
                        apiPayload.national_id = payload.idNumber; // 回退到未加密
                    }
                }
                // 密碼加密處理
                if (payload.password) {
                    try {
                        const { encryptPassword } = await import('@/lib/encryption');
                        apiPayload.password = await encryptPassword(payload.password);
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
                        'Authorization': `Bearer ${this.token}`,
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
