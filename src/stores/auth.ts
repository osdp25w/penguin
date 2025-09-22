// src/stores/auth.ts
import { defineStore } from 'pinia'
import { Koala } from '@/services/koala'
import { clearAuthStorage, loadUserProfile, saveUserProfile, refreshToken as apiRefreshToken, refreshTokenWithProfile } from '@/lib/api'

/* -------------------------------------------------------------- */
/*  型別定義                                                       */
/* -------------------------------------------------------------- */
export interface User {
  id        : string
  name      : string
  email     : string
  roleId    : 'admin' | 'staff' | 'member' | 'visitor'  // 只保留後端支援的角色
  phone?    : string
  avatarUrl?: string
  idNumber? : string  // 身份證號（解密後用於顯示）
}

const ACCESS_TOKEN_KEY = 'auth_access_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'
const ROLE_KEY  = 'penguin.role'
const LEGACY_TOKEN_KEY = 'penguin.jwt' // 相容舊版本

// Token 檢查快取，避免頻繁驗證
let tokenCheckCache: { token: string; validUntil: number } | null = null

function mapKoalaProfileToRole(profile: any): User['roleId'] {
  if (!profile) return 'visitor'

  const type = String(profile.type ?? '').toLowerCase()
  const profileType = String(profile.profile_type ?? '').toLowerCase()
  const username = String(profile.username ?? '')

  if (type === 'admin' || username.includes('admin')) return 'admin'
  if (type === 'staff' || profileType === 'staff') return 'staff'
  if (
    profileType.includes('member') ||
    type === 'real' ||
    type === 'member'
  ) {
    return 'member'
  }

  // 其他類型（tourist/visitor/null）一律當作 visitor
  return 'visitor'
}

/* -------------------------------------------------------------- */
/*  Pinia Store：Auth                                             */
/* -------------------------------------------------------------- */
export const useAuth = defineStore('auth', {
  /* ---------------- State ------------------------------------- */
  state : () => ({
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY) || '', // 支援舊 token
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || '',
    user : ((): User | null => {
      // Attempt to restore cached profile if present
      const p = loadUserProfile<any>()
      if (!p) return null

      // 調試：輸出原始 profile 資料
      console.log('[Auth] Raw profile data for role mapping:', {
        id: p.id,
        username: p.username,
        type: p.type,
        profile_type: p.profile_type,
        full_name: p.full_name,
        email: p.email
      })

      const roleId = mapKoalaProfileToRole(p)

      console.log('[Auth] Mapped role:', roleId)

      // 確保 role 存儲到 sessionStorage/localStorage
      try {
        sessionStorage.setItem(ROLE_KEY, roleId)
        localStorage.setItem(ROLE_KEY, roleId)
      } catch (e) {
        console.warn('[Auth] Failed to store role to storage:', e)
      }

      const mapped: User = {
        id: String(p.id ?? p.user_id ?? p.uuid ?? ''),
        name: p.full_name || p.username || p.name || '',
        email: p.email || '',
        roleId: roleId as any,
        avatarUrl: p.avatar_url || p.avatarUrl || undefined,
        phone: p.phone
      }
      return mapped
    })(),
    err  : ''
  }),

  /* ---------------- Getters ----------------------------------- */
  getters: {
    isLogin : (s) => !!s.accessToken,
    isAdmin : (s) => s.user?.roleId === 'admin',
    userName: (s) => s.user?.name ?? '',
    // 相容性 getter
    token: (s) => s.accessToken
  },

  /* ---------------- Actions ----------------------------------- */
  actions: {
    /* ---------- Token Refresh -------------------------------- */
    async refreshTokens() {
      try {
        console.log('[Auth] Attempting token refresh...')

        if (!this.refreshToken) {
          throw new Error('No refresh token available')
        }

        // 優先使用帶 base URL 的 helper，兼容直接後端格式
        const res = await refreshTokenWithProfile().catch(() => ({ success: false }))
        if (!res.success) {
          const ok = await apiRefreshToken()
          if (!ok) throw new Error('Token refresh failed')
        }

        // 從本地儲存讀回最新 tokens（helper 已存入 storage）
        this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || ''
        this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || this.refreshToken
        // 清除舊 token
        localStorage.removeItem(LEGACY_TOKEN_KEY)

        // 清除 token 檢查快取，因為 token 已更新
        tokenCheckCache = null

        console.log('[Auth] Token refresh successful')
        return { access_token: this.accessToken, refresh_token: this.refreshToken }
      } catch (error: any) {
        console.error('[Auth] Token refresh failed:', error)
        // Token refresh 失敗時清除所有 token 並退出登入
        this.logout()
        throw error
      }
    },

    /* ---------- 檢查 Token 是否即將過期 -------------------- */
    isTokenExpiringSoon(token: string, thresholdMinutes: number = 5): boolean {
      try {
        // 簡單的 JWT token 解析（不驗證簽名）
        const payload = JSON.parse(atob(token.split('.')[1]))
        const exp = payload.exp * 1000 // Convert to milliseconds
        const now = Date.now()
        const timeUntilExpiry = exp - now
        const thresholdMs = thresholdMinutes * 60 * 1000

        return timeUntilExpiry <= thresholdMs
      } catch (error) {
        console.warn('[Auth] Failed to parse token expiry:', error)
        return true // 當無法解析時假設即將過期
      }
    },

    /* ---------- 自動刷新 Token 如果需要 -------------------- */
    async ensureValidToken(): Promise<string> {
      if (!this.accessToken) {
        throw new Error('No access token available')
      }

      // 快取檢查 - 如果 token 相同且還在有效期內，直接返回
      const now = Date.now()
      if (tokenCheckCache?.token === this.accessToken && now < tokenCheckCache.validUntil) {
        return this.accessToken
      }

      // 檢查 token 是否即將過期
      if (this.isTokenExpiringSoon(this.accessToken)) {
        console.log('[Auth] Access token expiring soon, refreshing...')
        await this.refreshTokens()
        // 清除快取，因為 token 已更新
        tokenCheckCache = null
      }

      // 設定快取 - 30秒內不重複檢查同一個 token
      tokenCheckCache = {
        token: this.accessToken,
        validUntil: now + 30000 // 30秒快取
      }

      return this.accessToken
    },

    /* ---------- 初始化 Token 狀態 -------------------------- */
    async initTokens() {
      try {
        const accessToken = this.accessToken
        const refreshToken = this.refreshToken

        if (accessToken && refreshToken) {
          // 檢查 access token 是否即將過期，如果是的話嘗試刷新
          if (this.isTokenExpiringSoon(accessToken)) {
            console.log('[Auth] Access token expired on init, attempting refresh...')
            try {
              await this.refreshTokens()
            } catch (error) {
              console.warn('[Auth] Failed to refresh token on init:', error)
              await this.logout() // 刷新失敗則登出
            }
          }
        } else if (accessToken && !refreshToken) {
          // 只有 access token 沒有 refresh token（可能是舊版本）
          console.log('[Auth] Found legacy token without refresh token')
          if (this.isTokenExpiringSoon(accessToken)) {
            console.log('[Auth] Legacy token expired, logging out')
            await this.logout()
          }
        }
      } catch (error) {
        console.error('[Auth] Error in initTokens:', error)
        // 不拋出錯誤，避免阻塞應用啟動
      }
    },

    /* ---------- 登入 ------------------------------------------ */
    async login (email: string, password: string) {
      try {
        const { access, refresh, profile } = await Koala.login(email, password)
        if (!access) throw new Error('帳號或密碼錯誤')
        if (!refresh) {
          console.warn('[Auth] No refresh token received from login API')
        }

        // 處理身份證號解密（登入時）
        let idNumber = ''
        if (profile?.national_id) {
          try {
            if (profile.national_id.startsWith('gAAAAA')) {
              const { decryptNationalId } = await import('@/lib/encryption')
              idNumber = await decryptNationalId(profile.national_id)
            } else {
              idNumber = profile.national_id
            }
          } catch (err) {
            console.warn('Failed to decrypt national ID during login:', err)
          }
        }

        const mappedRole = mapKoalaProfileToRole(profile)

        const mapped: User | null = profile ? {
          id: String(profile.id ?? profile.user_id ?? ''),
          name: profile.full_name || profile.username || profile.name || '',
          email: profile.email || email,
          roleId: mappedRole,
          avatarUrl: profile.avatar_url || undefined,
          phone: profile.phone,
          idNumber: idNumber || undefined
        } : null

        this.accessToken = access
        this.refreshToken = refresh || '' // 儲存 refresh token
        this.user  = mapped
        this.err   = ''

        // 儲存 profile 到 localStorage，以便頁面重新整理後能還原角色資訊
        if (profile) {
          saveUserProfile(profile)
          console.log('[Auth] Profile saved to localStorage:', profile)
        }
        localStorage.setItem(ACCESS_TOKEN_KEY, access)
        if (refresh) {
          localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
        }
        // 清除舊 token
        localStorage.removeItem(LEGACY_TOKEN_KEY)
        if (mapped) {
          sessionStorage.setItem(ROLE_KEY, mapped.roleId)
          try { localStorage.setItem(ROLE_KEY, mapped.roleId) } catch {}
          console.log('[Auth] Role mapping - login:', {
            profile,
            mappedRole
          })
        }

        // 登入成功後，嘗試載入完整的用戶資料
        if (mapped?.id && access) {
          try {
            await this.fetchFullUserProfile()
          } catch (err) {
            console.warn('Failed to fetch full user profile after login:', err)
          }
        }
        // Toast: login success
        try { (await import('@/stores/toasts')).useToasts().success('登入成功') } catch {}
      } catch (e: any) {
        this.err = e.message ?? '登入失敗'
        try { (await import('@/stores/toasts')).useToasts().error(this.err || '登入失敗') } catch {}
        throw e
      }
    },

    /* ---------- 登出 ------------------------------------------ */
    async logout () {
      try { await Koala.logout() } catch {}
      this.accessToken = ''
      this.refreshToken = ''
      this.user  = null
      clearAuthStorage()
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(LEGACY_TOKEN_KEY)
      sessionStorage.removeItem(ROLE_KEY)
      try { localStorage.removeItem(ROLE_KEY) } catch {}
      try { (await import('@/stores/toasts')).useToasts().info('已登出') } catch {}
    },

    /* ---------- 載入完整用戶資料 ------------------------------ */
    async fetchFullUserProfile() {
      if (!this.accessToken || !this.user?.id) return

      try {
        const isStaffUser = this.user.roleId === 'admin' || this.user.roleId === 'staff'
        let fullProfile = null

        if (isStaffUser) {
          // 使用 Koala.getStaff 載入完整 staff 資料
          console.log('[fetchFullUserProfile] Loading staff profile for ID:', this.user.id)
          fullProfile = await Koala.getStaff(this.user.id)
        } else {
          // 使用 Koala.getMember 載入完整 member 資料
          console.log('[fetchFullUserProfile] Loading member profile for ID:', this.user.id)  
          fullProfile = await Koala.getMember(this.user.id)
        }

        if (fullProfile) {
          console.log('[fetchFullUserProfile] Loaded full profile:', fullProfile)
          
          // 檢查實際的資料結構
          const actualData = fullProfile.data || fullProfile
          console.log('[fetchFullUserProfile] Actual data:', actualData)
          console.log('[fetchFullUserProfile] phone:', actualData?.phone)
          console.log('[fetchFullUserProfile] national_id:', actualData?.national_id)

          // 處理身份證號解密
          let idNumber = ''
          const nationalIdField = actualData?.national_id
          if (nationalIdField) {
            console.log('[fetchFullUserProfile] Processing national_id:', nationalIdField)
            try {
              if (nationalIdField.startsWith('gAAAAA')) {
                const { decryptNationalId } = await import('@/lib/encryption')
                idNumber = await decryptNationalId(nationalIdField)
                console.log('[fetchFullUserProfile] Decrypted national_id:', idNumber)
              } else {
                idNumber = nationalIdField
                console.log('[fetchFullUserProfile] Using plain national_id:', idNumber)
              }
            } catch (err) {
              console.warn('Failed to decrypt national ID in full profile:', err)
            }
          } else {
            console.log('[fetchFullUserProfile] No national_id found in API response')
          }

          // 更新用戶資料
          const newRole = mapKoalaProfileToRole(actualData)
          const oldUser = { ...this.user }
          this.user = {
            ...this.user,
            name: actualData?.full_name || actualData?.username || this.user.name,
            email: actualData?.email || this.user.email,
            phone: actualData?.phone || this.user.phone,
            idNumber: idNumber || this.user.idNumber,
            roleId: newRole || this.user.roleId
          }

          if (newRole && newRole !== oldUser.roleId) {
            try {
              sessionStorage.setItem(ROLE_KEY, newRole)
              localStorage.setItem(ROLE_KEY, newRole)
            } catch {}
            console.log('[fetchFullUserProfile] Role updated from profile:', {
              oldRole: oldUser.roleId,
              newRole,
              profile: actualData
            })
          }

          console.log('[fetchFullUserProfile] Before update:', oldUser)
          console.log('[fetchFullUserProfile] After update:', this.user)
          console.log('[fetchFullUserProfile] Phone updated:', oldUser.phone, '->', this.user.phone)
          console.log('[fetchFullUserProfile] IdNumber updated:', oldUser.idNumber, '->', this.user.idNumber)
        }
      } catch (err) {
        console.warn('[fetchFullUserProfile] Failed to load full profile:', err)
      }
    },

    /* ---------- 獲取個人資料 ---------------------------------- */
    async fetchMe() {
      // Koala collection does not expose a /me endpoint; restore from cache if any
      if (!this.accessToken) return
      const p = loadUserProfile<any>()
      if (p) {
        // 處理身份證號解密（如果有的話）
        let idNumber = ''
        if (p.national_id) {
          try {
            if (p.national_id.startsWith('gAAAAA')) {
              const { decryptNationalId } = await import('@/lib/encryption')
              idNumber = await decryptNationalId(p.national_id)
            } else {
              idNumber = p.national_id
            }
          } catch (err) {
            console.warn('Failed to decrypt national ID in profile:', err)
            idNumber = '' // 不顯示解密失敗的資料
          }
        }

        const mappedRole = mapKoalaProfileToRole(p)

        const mapped: User = {
          id: String(p.id ?? p.user_id ?? ''),
          name: p.full_name || p.username || p.name || '',
          email: p.email || '',
          roleId: mappedRole,
          avatarUrl: p.avatar_url || undefined,
          phone: p.phone,
          idNumber: idNumber || undefined
        }
        this.user = mapped

        // 更新 localStorage 中的 profile
        saveUserProfile(p)
        console.log('[Auth] Profile updated in localStorage after fetchMe')

        try {
          sessionStorage.setItem(ROLE_KEY, mapped.roleId)
          localStorage.setItem(ROLE_KEY, mapped.roleId)
        } catch {}
        console.log('[Auth] Role mapping - fetchMe:', {
          profile: p,
          mappedRole
        })
        return mapped
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
      idNumber?: string
    }) {
      if (!this.accessToken) throw new Error('未登入')
      if (!this.user?.id) throw new Error('無法獲取用戶 ID')

      // 確保 token 有效
      const validToken = await this.ensureValidToken()

      try {
        // 根據用戶角色選擇對應的 API
        const isStaffUser = this.user.roleId === 'admin' || this.user.roleId === 'staff'
        const apiEndpoint = isStaffUser 
          ? `/api/account/staff/${this.user.id}/`
          : `/api/account/members/${this.user.id}/`

        // 映射前端欄位到後端欄位
        const apiPayload: any = {}
        
        if (payload.name) apiPayload.full_name = payload.name
        if (payload.email) apiPayload.email = payload.email
        if (payload.phone) apiPayload.phone = payload.phone
        
        // Staff 系統使用 username，Member 系統可能也有 username 欄位
        if (payload.name) apiPayload.username = payload.name

        // 身份證號加密處理 (只有 Member 需要)
        if (!isStaffUser && payload.idNumber) {
          try {
            const { encryptNationalId, looksEncrypted } = await import('@/lib/encryption')

            // 檢查是否已經是加密的資料 - 如果是，表示前端有問題，應該傳明文
            if (looksEncrypted(payload.idNumber)) {
              console.warn('National ID appears to be already encrypted. This should not happen.')
              throw new Error('身分證號格式錯誤，請重新輸入明文身分證號')
            }

            // 加密明文身分證號
            console.log('Encrypting national ID for backend:', payload.idNumber)
            apiPayload.national_id = await encryptNationalId(payload.idNumber)
            console.log('Encrypted national ID:', apiPayload.national_id)
          } catch (encErr: any) {
            console.error('Failed to encrypt national ID:', encErr)
            throw new Error('身分證號加密失敗：' + (encErr.message || '未知錯誤'))
          }
        }

        // 密碼加密處理
        if (payload.password) {
          try {
            const { encryptPassword } = await import('@/lib/encryption')
            // 更新個人資料時使用註冊模式（GENERIC_SECRET_SIGNING_KEY）
            apiPayload.password = await encryptPassword(payload.password, true)
          } catch (encErr) {
            console.warn('Failed to encrypt password:', encErr)
            throw new Error('密碼加密失敗，請重試')
          }
        }

        console.log(`[UpdateMe] Using ${isStaffUser ? 'Staff' : 'Member'} API:`, apiEndpoint)
        console.log('[UpdateMe] Payload:', apiPayload)

        const res = await fetch(apiEndpoint, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${validToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(apiPayload)
        })
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.message || errorData.detail || '更新個人資料失敗')
        }

        const updatedData = await res.json()
        console.log('[UpdateMe] Updated data:', updatedData)

        // 更新本地用戶資料
        if (this.user) {
          this.user.name = updatedData.full_name || updatedData.username || this.user.name
          this.user.email = updatedData.email || this.user.email
          this.user.phone = updatedData.phone || this.user.phone
          // 注意：不直接存儲解密後的身份證號，保持加密狀態
        }
        
        return this.user
      } catch (e: any) {
        console.error('Update me error:', e)
        throw e
      }
    }
  }
})
