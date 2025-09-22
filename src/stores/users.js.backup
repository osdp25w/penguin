/* ──────────────────────────────────────────────────────────────
 *  使用者／角色管理（Pinia store）
 * ───────────────────────────────────────────────────────────── */
import { defineStore } from 'pinia';
import { Koala } from '@/services/koala';
export const useUsers = defineStore('users', {
    /* ---------- state ------------------------------------------------ */
    state: () => ({
        loading: false, // 讀取中
        errMsg: '', // 錯誤訊息
        users: [], // 使用者清單
        roles: [] // 角色清單
    }),
    /* ---------- getters ---------------------------------------------- */
    getters: {
        /** 把 roleName 直接映射進每位 user，表格好用 */
        usersWithRole: s => s.users.map(u => {
            var _a, _b;
            return ({
                ...u,
                roleName: (_b = (_a = s.roles.find(r => r.id === u.roleId)) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '—'
            });
        }),
        /** 提供一致的 loading 狀態名稱 */
        isLoading: s => s.loading
    },
    /* ---------- actions ---------------------------------------------- */
    actions: {
        /* ① 同步抓取「使用者 + 角色」(根據角色載入不同 API) ------------------- */
        async fetchAll() {
            var _a, _b;
            try {
                this.loading = true;
                console.log('[Users] Fetching user data...');
                // 根據實際測試結果的權限設計：
                // - Admin: 可以存取 staff 和 members API
                // - Staff: 兩個都不能存取（但理論上應該能看某些資料）
                // - Member: 使用不同的登入系統
                const authStore = (await import('./auth')).useAuth();
                const userRole = (_a = authStore.user) === null || _a === void 0 ? void 0 : _a.roleId;
                const isAdmin = authStore.isAdmin;
                console.log('[Users] Current user role:', userRole, 'isAdmin:', isAdmin);
                let allUsers = [];
                // Admin 可以看所有用戶
                if (isAdmin) {
                    console.log('[Users] Admin account detected, loading all users...');
                    // 載入 staff 資料
                    const staff = await Koala.listStaff().catch((err) => {
                        console.error('[Users] Failed to load staff:', err);
                        return [];
                    });
                    console.log('[Users] Staff data loaded:', staff.length, 'users');
                    // 載入 members 資料
                    const members = await Koala.listMembers().catch((err) => {
                        console.error('[Users] Failed to load members:', err);
                        return [];
                    });
                    console.log('[Users] Members data loaded:', members.length, 'users');
                    allUsers = [...staff, ...members];
                }
                // Staff 理論上應該能看 members（但目前 API 返回 unauthorized）
                else if (userRole === 'staff') {
                    console.log('[Users] Staff account detected, attempting to load members...');
                    // 嘗試載入 members
                    const members = await Koala.listMembers().catch((err) => {
                        console.error('[Users] Staff cannot load members:', err);
                        return [];
                    });
                    // 嘗試載入 staff
                    const staff = await Koala.listStaff().catch((err) => {
                        console.error('[Users] Staff cannot load staff:', err);
                        return [];
                    });
                    allUsers = [...staff, ...members];
                    // 如果都失敗，至少顯示一些模擬資料或提示
                    if (allUsers.length === 0) {
                        console.warn('[Users] Staff account cannot load any users - API permissions issue');
                        this.errMsg = 'Staff 帳號目前無法載入用戶資料（API 權限問題）';
                    }
                }
                // Member 只能看自己（目前不支援）
                else {
                    console.log('[Users] Non-admin/staff account, limited access');
                    this.errMsg = '目前角色無法存取用戶管理功能';
                }
                const toUser = async (u, kind) => {
                    var _a, _b, _c, _d;
                    // 解密身份證號（如果是加密的）
                    let nationalId = u.national_id || '';
                    if (nationalId && nationalId.startsWith('gAAAAA')) {
                        try {
                            const { decryptNationalId } = await import('@/lib/encryption');
                            nationalId = await decryptNationalId(nationalId);
                        }
                        catch (err) {
                            console.warn('Failed to decrypt national ID:', err);
                        }
                    }
                    return {
                        id: String((_c = (_b = (_a = u.id) !== null && _a !== void 0 ? _a : u.user_id) !== null && _b !== void 0 ? _b : u.uuid) !== null && _c !== void 0 ? _c : ''),
                        email: u.email || '',
                        fullName: u.full_name || u.username || '',
                        roleId: (u.type === 'admin' ? 'admin' : u.type === 'staff' ? 'staff' : u.type === 'real' ? 'member' : u.type === 'tourist' ? 'visitor' : 'user'),
                        active: (_d = u.is_active) !== null && _d !== void 0 ? _d : true,
                        createdAt: u.created_at || new Date().toISOString(),
                        lastLogin: u.last_login || '',
                        phone: u.phone || '',
                        nationalId: nationalId,
                        kind
                    };
                };
                // 根據來源判斷用戶類型（使用 Promise.all 處理 async）
                this.users = await Promise.all(allUsers.map(async (u) => {
                    const hasStaffType = u.type === 'admin' || u.type === 'staff';
                    const kind = hasStaffType ? 'staff' : 'member';
                    return await toUser(u, kind);
                }));
                // 只保留後端實際支援的角色
                const roleSet = new Map([
                    ['admin', '管理員'], // Staff.admin
                    ['staff', '工作人員'], // Staff.staff
                    ['member', '會員'], // Member.real (有身份證號)
                    ['visitor', '遊客'] // Member.tourist (無身份證號)
                ]);
                for (const u of this.users) {
                    if (!roleSet.has(u.roleId))
                        roleSet.set(u.roleId, u.roleId);
                }
                this.roles = Array.from(roleSet.entries()).map(([id, name]) => ({ id, name, desc: '', scopes: [] }));
                this.errMsg = '';
            }
            catch (e) {
                this.errMsg = (_b = e.message) !== null && _b !== void 0 ? _b : 'Fetch users failed';
            }
            finally {
                this.loading = false;
            }
        },
        /* ② 啟用 / 停用（串接後端 API） --------------------------------- */
        async toggleActive(userId) {
            const idx = this.users.findIndex(u => u.id === userId);
            if (idx < 0)
                return;
            const user = this.users[idx];
            const next = !user.active;
            try {
                this.loading = true;
                this.errMsg = '';
                const patch = { is_active: next };
                const isStaffUser = (user.kind === 'staff') || user.roleId === 'admin' || user.roleId === 'staff';
                if (isStaffUser) {
                    await Koala.updateStaff(user.id, patch);
                }
                else {
                    await Koala.updateMember(user.id, patch);
                }
                this.users[idx].active = next;
            }
            catch (e) {
                console.error('[toggleActive] failed:', e);
                this.errMsg = (e === null || e === void 0 ? void 0 : e.message) || '變更啟用狀態失敗';
            }
            finally {
                this.loading = false;
            }
        },
        /* ③ 新增使用者（前端快照；正式環境請改 POST） ---------------- */
        addUser(payload) {
            if (this.users.some(u => u.email === payload.email)) {
                this.errMsg = 'Email 已存在';
                return;
            }
            this.users.unshift(payload);
        },
        /* ③-1 統一註冊使用者（支持 member, staff, admin, tourist 類型） */
        async registerUser(payload) {
            var _a, _b, _c, _d;
            try {
                this.loading = true;
                this.errMsg = '';
                const { encryptNationalId, encryptPassword } = await import('@/lib/encryption');
                const { formatPhoneToInternational, isValidPhone } = await import('@/lib/phone');
                // 驗證和格式化手機號碼
                if (!isValidPhone(payload.phone)) {
                    throw new Error('手機號碼格式不正確');
                }
                const formattedPhone = formatPhoneToInternational(payload.phone);
                // 加密身份證號（如果提供 - staff/tourist 可能沒有）
                let encId = '';
                if (payload.nationalId) {
                    encId = await encryptNationalId(payload.nationalId);
                }
                // 產生一組初始密碼（也可改為 UI 收集），並使用註冊模式加密
                const rawPwd = Math.random().toString(36).slice(-10);
                const encPwd = await encryptPassword(rawPwd, true); // 使用註冊模式 (GENERIC_SECRET_SIGNING_KEY)
                // 準備 Koala 註冊 payload（依 Postman collection）
                const body = {
                    email: payload.email,
                    full_name: payload.fullName,
                    phone: formattedPhone, // 使用國際格式
                    password: encPwd,
                    type: payload.userType, // 支援 tourist, real, staff, admin
                    // 可選的 username：優先使用 email localpart，否則 full_name
                    username: (payload.email.split('@')[0] || payload.fullName || '').slice(0, 20)
                };
                // 如果有身份證號才加入（tourist 可能沒有）
                if (encId) {
                    body.national_id = encId;
                }
                console.log('[registerUser] Sending payload:', { ...body, password: '***encrypted***' });
                const result = await (await import('@/services/koala')).Koala.register(body);
                console.log('[registerUser] Registration successful:', result);
                // 註冊成功後重新載入用戶列表（確保資料同步）
                await this.fetchAll();
                return result;
            }
            catch (e) {
                console.error('[registerUser] failed:', e);
                // 提供更友善的錯誤訊息
                let errorMsg = '用戶註冊失敗';
                if ((_a = e === null || e === void 0 ? void 0 : e.message) === null || _a === void 0 ? void 0 : _a.includes('email')) {
                    errorMsg = '此信箱已被註冊';
                }
                else if ((_b = e === null || e === void 0 ? void 0 : e.message) === null || _b === void 0 ? void 0 : _b.includes('username')) {
                    errorMsg = '此用戶名已被使用';
                }
                else if ((_c = e === null || e === void 0 ? void 0 : e.message) === null || _c === void 0 ? void 0 : _c.includes('phone')) {
                    errorMsg = '手機號碼格式不正確';
                }
                else if (((_d = e === null || e === void 0 ? void 0 : e.message) === null || _d === void 0 ? void 0 : _d.includes('type')) && (payload.userType === 'staff' || payload.userType === 'admin')) {
                    errorMsg = '目前後端註冊端點可能不支持 Staff/Admin 類型，請聯絡後端開發者擴展 API';
                }
                else if (e === null || e === void 0 ? void 0 : e.message) {
                    errorMsg = e.message;
                }
                this.errMsg = errorMsg;
                throw new Error(errorMsg);
            }
            finally {
                this.loading = false;
            }
        },
        /* ③-1-backward-compatibility 舊版 registerMember 方法（向後兼容） */
        async registerMember(payload) {
            return this.registerUser({
                email: payload.email,
                fullName: payload.fullName,
                phone: payload.phone,
                nationalId: payload.nationalId,
                userType: payload.memberType || 'tourist',
                active: payload.active
            });
        },
        /* ③-2 建立 Staff/Admin 使用統一註冊端點 */
        async createStaff(payload) {
            return this.registerUser({
                email: payload.email,
                fullName: payload.fullName,
                phone: payload.phone || '',
                nationalId: '', // Staff 通常不需要身份證號
                userType: payload.type || 'staff',
                active: payload.active
            });
        },
        /* ④ 編輯保存（串接後端 API，含身分證加密） -------------- */
        async updateUser(payload) {
            var _a, _b;
            try {
                this.loading = true;
                this.errMsg = '';
                const { formatPhoneToInternational, isValidPhone } = await import('@/lib/phone');
                // 驗證手機號碼格式（如果提供）
                let formattedPhone = payload.phone;
                if (payload.phone && !isValidPhone(payload.phone)) {
                    throw new Error('手機號碼格式不正確');
                }
                if (payload.phone) {
                    formattedPhone = formatPhoneToInternational(payload.phone);
                }
                const isStaffUser = payload.kind === 'staff' || payload.roleId === 'admin' || payload.roleId === 'staff';
                const patch = {
                    email: payload.email,
                    full_name: payload.fullName,
                    phone: formattedPhone, // 使用格式化後的手機號碼
                    is_active: payload.active
                };
                if (!isStaffUser) {
                    // Member: 加密身份證（若提供）
                    if (payload.nationalId) {
                        try {
                            const { encryptNationalId } = await import('@/lib/encryption');
                            patch.national_id = await encryptNationalId(payload.nationalId);
                        }
                        catch (e) {
                            console.warn('[updateUser] encrypt nationalId failed:', e);
                        }
                    }
                    // Member: 加密密碼（若提供）
                    if (payload.password) {
                        try {
                            const { encryptPassword } = await import('@/lib/encryption');
                            patch.password = await encryptPassword(payload.password, true); // 使用註冊模式
                        }
                        catch (e) {
                            console.warn('[updateUser] encrypt password failed:', e);
                            throw new Error('密碼加密失敗');
                        }
                    }
                }
                else {
                    // Staff: 後端通常用 type 區分 admin/staff
                    if (payload.roleId === 'admin' || payload.roleId === 'staff') {
                        patch.type = payload.roleId;
                    }
                    // Staff: 加密密碼（若提供）
                    if (payload.password) {
                        try {
                            const { encryptPassword } = await import('@/lib/encryption');
                            patch.password = await encryptPassword(payload.password, true); // 使用註冊模式
                        }
                        catch (e) {
                            console.warn('[updateUser] encrypt password failed:', e);
                            throw new Error('密碼加密失敗');
                        }
                    }
                }
                console.log('[updateUser] Sending patch:', { ...patch, password: patch.password ? '***encrypted***' : undefined });
                if (isStaffUser)
                    await Koala.updateStaff(payload.id, patch);
                else
                    await Koala.updateMember(payload.id, patch);
                const idx = this.users.findIndex(u => u.id === payload.id);
                if (idx >= 0) {
                    // 更新本地狀態，但保留解密後的身份證號用於顯示
                    this.users[idx] = {
                        ...payload,
                        phone: formattedPhone // 保存格式化後的手機號碼
                    };
                }
            }
            catch (e) {
                console.error('[updateUser] failed:', e);
                // 提供更友善的錯誤訊息
                let errorMsg = '更新使用者失敗';
                if ((_a = e === null || e === void 0 ? void 0 : e.message) === null || _a === void 0 ? void 0 : _a.includes('email')) {
                    errorMsg = '此信箱已被使用';
                }
                else if ((_b = e === null || e === void 0 ? void 0 : e.message) === null || _b === void 0 ? void 0 : _b.includes('phone')) {
                    errorMsg = '手機號碼格式不正確';
                }
                else if (e === null || e === void 0 ? void 0 : e.message) {
                    errorMsg = e.message;
                }
                this.errMsg = errorMsg;
                throw new Error(errorMsg);
            }
            finally {
                this.loading = false;
            }
        }
    }
});
/* 讓 `import { useUsers } from '@/stores'` 也能用 */
export default useUsers;
