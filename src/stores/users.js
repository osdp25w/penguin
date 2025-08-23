/* ──────────────────────────────────────────────────────────────
 *  使用者／角色管理（Pinia store）
 * ───────────────────────────────────────────────────────────── */
import { defineStore } from 'pinia';
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
        })
    },
    /* ---------- actions ---------------------------------------------- */
    actions: {
        /* ① 同步抓取「使用者 + 角色」(兩支 API 並行) ------------------- */
        async fetchAll() {
            var _a;
            try {
                this.loading = true;
                const [usrRes, roleRes] = await Promise.all([
                    fetch('/api/v1/users'),
                    fetch('/api/v1/roles')
                ]);
                if (!usrRes.ok || !roleRes.ok)
                    throw new Error('fetch users / roles failed');
                this.users = await usrRes.json();
                this.roles = await roleRes.json();
                this.errMsg = '';
            }
            catch (e) {
                this.errMsg = (_a = e.message) !== null && _a !== void 0 ? _a : 'Fetch users failed';
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
        updateUser(payload) {
            const idx = this.users.findIndex(u => u.id === payload.id);
            if (idx >= 0)
                this.users[idx] = { ...payload };
        }
    }
});
/* 讓 `import { useUsers } from '@/stores'` 也能用 */
export default useUsers;
