/* ──────────────────────────────────────────────────────────────
 *  使用者／角色管理（Pinia store）
 * ───────────────────────────────────────────────────────────── */
import { defineStore } from 'pinia'
import type { User, Role } from '@/types'
import { Koala } from '@/services/koala'

export const useUsers = defineStore('users', {
  /* ---------- state ------------------------------------------------ */
  state: () => ({
    loading : false,        // 讀取中
    errMsg  : '',           // 錯誤訊息
    users   : [] as User[], // 使用者清單
    roles   : [] as Role[]  // 角色清單
  }),

  /* ---------- getters ---------------------------------------------- */
  getters: {
    /** 把 roleName 直接映射進每位 user，表格好用 */
    usersWithRole: s =>
      s.users.map(u => ({
        ...u,
        roleName: s.roles.find(r => r.id === u.roleId)?.name ?? '—'
      })),
    
    /** 提供一致的 loading 狀態名稱 */
    isLoading: s => s.loading
  },

  /* ---------- actions ---------------------------------------------- */
  actions: {
    /* ① 同步抓取「使用者 + 角色」(根據角色載入不同 API) ------------------- */
    async fetchAll () {
      try {
        this.loading = true
        console.log('[Users] Fetching user data...')
        
        // 根據實際測試結果的權限設計：
        // - Admin: 可以存取 staff 和 members API
        // - Staff: 兩個都不能存取（但理論上應該能看某些資料）
        // - Member: 使用不同的登入系統
        const authStore = (await import('./auth')).useAuth()
        const userRole = authStore.user?.roleId
        const isAdmin = authStore.isAdmin
        
        console.log('[Users] Current user role:', userRole, 'isAdmin:', isAdmin)
        
        let allUsers: any[] = []
        
        // Admin 可以看所有用戶
        if (isAdmin) {
          console.log('[Users] Admin account detected, loading all users...')
          
          // 載入 staff 資料
          const staff = await Koala.listStaff().catch((err) => {
            console.error('[Users] Failed to load staff:', err)
            return []
          })
          console.log('[Users] Staff data loaded:', staff.length, 'users')
          
          // 載入 members 資料
          const members = await Koala.listMembers().catch((err) => {
            console.error('[Users] Failed to load members:', err)
            return []
          })
          console.log('[Users] Members data loaded:', members.length, 'users')
          
          allUsers = [...staff, ...members]
        } 
        // Staff 理論上應該能看 members（但目前 API 返回 unauthorized）
        else if (userRole === 'staff') {
          console.log('[Users] Staff account detected, attempting to load members...')
          
          // 嘗試載入 members
          const members = await Koala.listMembers().catch((err) => {
            console.error('[Users] Staff cannot load members:', err)
            return []
          })
          
          // 嘗試載入 staff
          const staff = await Koala.listStaff().catch((err) => {
            console.error('[Users] Staff cannot load staff:', err)
            return []
          })
          
          allUsers = [...staff, ...members]
          
          // 如果都失敗，至少顯示一些模擬資料或提示
          if (allUsers.length === 0) {
            console.warn('[Users] Staff account cannot load any users - API permissions issue')
            this.errMsg = 'Staff 帳號目前無法載入用戶資料（API 權限問題）'
          }
        }
        // Member 只能看自己（目前不支援）
        else {
          console.log('[Users] Non-admin/staff account, limited access')
          this.errMsg = '目前角色無法存取用戶管理功能'
        }

        const toUser = async (u: any, kind: 'staff' | 'member'): Promise<User> => {
          // 解密身份證號（如果是加密的）
          let nationalId = u.national_id || ''
          if (nationalId && nationalId.startsWith('gAAAAA')) {
            try {
              const { decryptNationalId } = await import('@/lib/encryption')
              nationalId = await decryptNationalId(nationalId)
            } catch (err) {
              console.warn('Failed to decrypt national ID:', err)
            }
          }
          
          return {
            id       : String(u.id ?? u.user_id ?? u.uuid ?? ''),
            email    : u.email || '',
            fullName : u.full_name || u.username || '',
            roleId   : (u.type === 'admin' ? 'admin' : u.type === 'staff' ? 'staff' : u.type === 'real' ? 'member' : u.type === 'tourist' ? 'visitor' : 'user'),
            active   : u.is_active ?? true,
            createdAt: u.created_at || new Date().toISOString(),
            lastLogin: u.last_login || '',
            phone    : u.phone || '',
            nationalId: nationalId,
            kind
          }
        }

        // 根據來源判斷用戶類型（使用 Promise.all 處理 async）
        this.users = await Promise.all(
          allUsers.map(async u => {
            const hasStaffType = u.type === 'admin' || u.type === 'staff'
            const kind = hasStaffType ? 'staff' : 'member'
            return await toUser(u, kind)
          })
        )

        // Derive roles available from data plus defaults
        const roleSet = new Map<string, string>([
          ['admin','管理員'],
          ['manager','管理者'],
          ['staff','工作人員'],
          ['member','會員'],
          ['visitor','訪客'],
          ['user','一般使用者']
        ])
        for (const u of this.users) {
          if (!roleSet.has(u.roleId)) roleSet.set(u.roleId, u.roleId)
        }
        this.roles = Array.from(roleSet.entries()).map(([id, name]) => ({ id, name, desc: '', scopes: [] }))
        this.errMsg = ''
      } catch (e: any) {
        this.errMsg = e.message ?? 'Fetch users failed'
      } finally {
        this.loading = false
      }
    },

    /* ② 啟用 / 停用 ------------------------------------------------- */
    toggleActive (userId: string) {
      const idx = this.users.findIndex(u => u.id === userId)
      if (idx >= 0) this.users[idx].active = !this.users[idx].active
    },

    /* ③ 新增使用者（前端快照；正式環境請改 POST） ---------------- */
    addUser (payload: User) {
      if (this.users.some(u => u.email === payload.email)) {
        this.errMsg = 'Email 已存在'
        return
      }
      this.users.unshift(payload)
    },

    /* ④ 更新使用者（前端快照；正式環境請改 PATCH） -------------- */
    async updateUser (payload: User) {
      // Persist to Koala if possible, based on kind
      try {
        if ((payload as any).kind === 'staff') {
          await Koala.updateStaff(payload.id, {
            email: payload.email,
            full_name: payload.fullName,
            type: payload.roleId
          })
        } else if ((payload as any).kind === 'member') {
          await Koala.updateMember(payload.id, {
            email: payload.email,
            full_name: payload.fullName,
            type: payload.roleId
          })
        }
      } catch (e) {
        // Swallow backend errors for now but still update locally
        console.warn('Koala update failed, updating locally:', e)
      }
      const idx = this.users.findIndex(u => u.id === payload.id)
      if (idx >= 0) this.users[idx] = { ...payload }
    }
  }
})

/* 讓 `import { useUsers } from '@/stores'` 也能用 */
export default useUsers
