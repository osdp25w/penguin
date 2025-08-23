// src/stores/auth.ts
import { defineStore } from 'pinia'

/* -------------------------------------------------------------- */
/*  型別定義                                                       */
/* -------------------------------------------------------------- */
export interface User {
  id        : string
  name      : string
  email     : string
  roleId    : 'admin' | 'manager' | 'user'
  phone?    : string
  avatarUrl?: string
}

const TOKEN_KEY = 'penguin.jwt'
const ROLE_KEY  = 'penguin.role'

/* -------------------------------------------------------------- */
/*  Pinia Store：Auth                                             */
/* -------------------------------------------------------------- */
export const useAuth = defineStore('auth', {
  /* ---------------- State ------------------------------------- */
  state : () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    user : null as User | null,
    err  : ''
  }),

  /* ---------------- Getters ----------------------------------- */
  getters: {
    isLogin : (s) => !!s.token,
    isAdmin : (s) => s.user?.roleId === 'admin',
    userName: (s) => s.user?.name ?? ''
  },

  /* ---------------- Actions ----------------------------------- */
  actions: {
    /* ---------- 登入 ------------------------------------------ */
    async login (email: string, password: string) {
      try {
        const res = await fetch('/api/v1/auth/login', {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({ email, password })
        })
        if (!res.ok) throw new Error('帳號或密碼錯誤')

        /* 後端回傳 { token, user }（user 內含 roleId） */
        const { token, user } = await res.json() as { token: string; user: User }

        /* 狀態 & localStorage / sessionStorage */
        this.token = token
        this.user  = user
        this.err   = ''
        localStorage.setItem(TOKEN_KEY, token)
        /** 讓 router 守衛可以快速讀取角色（不必先載 Store） */
        sessionStorage.setItem(ROLE_KEY, user.roleId)
      } catch (e: any) {
        this.err = e.message ?? '登入失敗'
        throw e
      }
    },

    /* ---------- 登出 ------------------------------------------ */
    logout () {
      this.token = ''
      this.user  = null
      localStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(ROLE_KEY)
    },

    /* ---------- 獲取個人資料 ---------------------------------- */
    async fetchMe() {
      if (!this.token) return

      try {
        const res = await fetch('/api/v1/me', {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json' 
          }
        })
        if (!res.ok) throw new Error('獲取個人資料失敗')

        const user = await res.json() as User
        this.user = user
        return user
      } catch (e: any) {
        console.error('Fetch me error:', e)
        throw e
      }
    },

    /* ---------- 更新個人資料 ---------------------------------- */
    async updateMe(payload: {
      name?: string
      email?: string
      phone?: string
      avatarUrl?: string
      currentPassword?: string
      password?: string
    }) {
      if (!this.token) throw new Error('未登入')

      try {
        const res = await fetch('/api/v1/me', {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(payload)
        })
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.message || '更新個人資料失敗')
        }

        const updatedUser = await res.json() as User
        this.user = updatedUser
        
        return updatedUser
      } catch (e: any) {
        console.error('Update me error:', e)
        throw e
      }
    }
  }
})
