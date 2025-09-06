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
                // Derive roles available from data plus defaults
                const roleSet = new Map([
                    ['admin', '管理員'],
                    ['manager', '管理者'],
                    ['staff', '工作人員'],
                    ['member', '會員'],
                    ['visitor', '訪客'],
                    ['user', '一般使用者']
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
        /* ② 啟用 / 停用 ------------------------------------------------- */
        toggleActive(userId) {
            const idx = this.users.findIndex(u => u.id === userId);
            if (idx >= 0)
                this.users[idx].active = !this.users[idx].active;
        },
        /* ③ 新增使用者（前端快照；正式環境請改 POST） ---------------- */
        addUser(payload) {
            if (this.users.some(u => u.email === payload.email)) {
                this.errMsg = 'Email 已存在';
                return;
            }
            this.users.unshift(payload);
        },
        /* ④ 更新使用者（前端快照；正式環境請改 PATCH） -------------- */
        async updateUser(payload) {
            // Persist to Koala if possible, based on kind
            try {
                if (payload.kind === 'staff') {
                    await Koala.updateStaff(payload.id, {
                        email: payload.email,
                        full_name: payload.fullName,
                        type: payload.roleId
                    });
                }
                else if (payload.kind === 'member') {
                    await Koala.updateMember(payload.id, {
                        email: payload.email,
                        full_name: payload.fullName,
                        type: payload.roleId
                    });
                }
            }
            catch (e) {
                // Swallow backend errors for now but still update locally
                console.warn('Koala update failed, updating locally:', e);
            }
            const idx = this.users.findIndex(u => u.id === payload.id);
            if (idx >= 0)
                this.users[idx] = { ...payload };
        }
    }
});
/* 讓 `import { useUsers } from '@/stores'` 也能用 */
export default useUsers;
