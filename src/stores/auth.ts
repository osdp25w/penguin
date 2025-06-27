import { defineStore } from 'pinia'

export interface User {
  id  : string
  name: string
}

const TOKEN_KEY = 'penguin.jwt'

export const useAuth = defineStore('auth', {
  state : () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    user : null as User | null,
    err  : ''
  }),
  getters: {
    isLogin: s => !!s.token
  },
  actions: {
    async login (email: string, password: string) {
      try {
        const res = await fetch('/api/v1/auth/login', {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({ email, password })
        })
        if (!res.ok) throw new Error('帳號或密碼錯誤')
        const { token, user } = await res.json()

        this.token = token
        this.user  = user
        this.err   = ''
        localStorage.setItem(TOKEN_KEY, token)
      } catch (e: any) {
        this.err = e.message ?? '登入失敗'
        throw e
      }
    },
    logout () {
      this.token = ''
      this.user  = null
      localStorage.removeItem(TOKEN_KEY)
    }
  }
})
