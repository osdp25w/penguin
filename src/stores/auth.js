// src/stores/auth.ts
import { defineStore } from 'pinia';
const TOKEN_KEY = 'penguin.jwt';
const ROLE_KEY = 'penguin.role';
/* -------------------------------------------------------------- */
/*  Pinia Store：Auth                                             */
/* -------------------------------------------------------------- */
export const useAuth = defineStore('auth', {
    /* ---------------- State ------------------------------------- */
    state: () => ({
        token: localStorage.getItem(TOKEN_KEY) || '',
        user: null,
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
            var _a;
            try {
                const res = await fetch('/api/v1/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                if (!res.ok)
                    throw new Error('帳號或密碼錯誤');
                /* 後端回傳 { token, user }（user 內含 roleId） */
                const { token, user } = await res.json();
                /* 狀態 & localStorage / sessionStorage */
                this.token = token;
                this.user = user;
                this.err = '';
                localStorage.setItem(TOKEN_KEY, token);
                /** 讓 router 守衛可以快速讀取角色（不必先載 Store） */
                sessionStorage.setItem(ROLE_KEY, user.roleId);
            }
            catch (e) {
                this.err = (_a = e.message) !== null && _a !== void 0 ? _a : '登入失敗';
                throw e;
            }
        },
        /* ---------- 登出 ------------------------------------------ */
        logout() {
            this.token = '';
            this.user = null;
            localStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(ROLE_KEY);
        }
    }
});
