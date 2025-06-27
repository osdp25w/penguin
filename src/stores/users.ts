/* ──────────────────────────────────────────────────────────────
 *  src/stores/users.ts
 *  - 使用者／角色管理 (Pinia store)
 *  ──────────────────────────────────────────────────────────── */
import { defineStore }  from 'pinia'
import type { User, Role } from '@/types'

export const useUsers = defineStore('users', {
  /* ---------- state ------------------------------------------------ */
  state: () => ({
    isLoading : false,        // 目前是否載入中
    errMsg    : '',           // 失敗訊息
    users     : [] as User[], // 使用者清單
    roles     : [] as Role[]  // 角色清單
  }),

  /* ---------- getters ---------------------------------------------- */
  getters: {
    /** 方便表格顯示：把 roleName 映射進每位 user */
    usersWithRole: s =>
      s.users.map(u => ({
        ...u,
        roleName: s.roles.find(r => r.id === u.roleId)?.name ?? '—'
      }))
  },

  /* ---------- actions ---------------------------------------------- */
  actions: {
    /* 讀取「所有使用者 + 角色」(兩支 API 並行) --------------------- */
    async fetchAll () {
      try {
        this.isLoading = true

        const [usrRes, roleRes] = await Promise.all([
          fetch('/api/v1/users'),
          fetch('/api/v1/roles')
        ])
        if (!usrRes.ok || !roleRes.ok) throw new Error('fetch users / roles failed')

        this.users = await usrRes.json()
        this.roles = await roleRes.json()
        this.errMsg = ''
      } catch (e: any) {
        this.errMsg = e.message ?? 'Fetch users failed'
      } finally {
        this.isLoading = false
      }
    },

    /* --- 基本操作：啟用 / 停用 ----------------------------------- */
    toggleActive (userId: string) {
      const idx = this.users.findIndex(u => u.id === userId)
      if (idx >= 0) this.users[idx].active = !this.users[idx].active
    },

    /* --- 新增使用者 (前端快照；真環境請改為 POST) --------------- */
    addUser (payload: User) {
      /** 先檢查 email 唯一性（簡易） */
      if (this.users.some(u => u.email === payload.email)) {
        this.errMsg = 'Email 已存在'
        return
      }
      this.users.unshift(payload)
    },

    /* --- 更新使用者 (前端快照；真環境請改為 PATCH) --------------- */
    updateUser (payload: User) {
      const idx = this.users.findIndex(u => u.id === payload.id)
      if (idx >= 0) this.users[idx] = { ...payload }
    }
  }
})
