// src/services/koala.ts
import { http, saveUserProfile, apiStorage } from '@/lib/api'
import { looksLikeFernet } from '@/lib/fernet'

function currentRole(): string | null {
  try {
    return (
      sessionStorage.getItem('penguin.role') ||
      localStorage.getItem('penguin.role') ||
      null
    )
  } catch {
    return null
  }
}

function ensureStaffApiAccess(action: string): void {
  const role = currentRole()
  const allowed = role === 'admin' || role === 'staff'
  if (!allowed) {
    console.warn(`[Koala] Blocked staff API "${action}" for role:`, role)
    const err = new Error('FORBIDDEN_STAFF_API')
    ;(err as any).status = 403
    ;(err as any).detail = `Role "${role ?? 'unknown'}" cannot access staff API`
    throw err
  }
}

// Minimal types inferred from Postman examples
export interface KoalaLoginResponse {
  code?: number
  data?: {
    profile?: any
    tokens?: { access_token: string; refresh_token: string }
  }
  token?: string
}

export interface StaffItem {
  id: number | string
  email?: string
  username?: string
  full_name?: string
  type?: string // e.g., 'admin' | 'staff'
  active?: boolean
}

export interface MemberItem {
  id: number | string
  email?: string
  username?: string
  full_name?: string
  type?: string // 'real' | 'tourist' | etc.
  active?: boolean
}

export const Koala = {
  // Auth
  async login(email: string, password: string) {
    let toSend = password
    const rt: any = (globalThis as any)?.CONFIG || {}
    const loginKey = (rt.KOALA_LOGIN_KEY as string | undefined) || (import.meta as any)?.env?.VITE_KOALA_LOGIN_KEY as string | undefined
    const forceTs = import.meta?.env?.VITE_KOALA_FORCE_FERNET_TS as any
    const forceIv = import.meta?.env?.VITE_KOALA_FORCE_FERNET_IV as string | undefined
    const forceCompat = String(import.meta?.env?.VITE_KOALA_FORCE_FERNET_COMPAT || '').toLowerCase() === '1' || String(import.meta?.env?.VITE_KOALA_FORCE_FERNET_COMPAT || '').toLowerCase() === 'true'
    // Encrypt plaintext if a login key is provided and input isn't already Fernet
    if (loginKey && password && !looksLikeFernet(password)) {
      // Helper: ensure we never fall back to sending plaintext
      const mustBeToken = async (): Promise<string> => {
        // DEV + forced ts/iv: deterministic replay (optional for local testing)
        if (import.meta.env.DEV && forceTs && forceIv) {
          const r = await fetch('/local/fernet/replay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: password, ts: Number(forceTs), iv: forceIv, compat: forceCompat })
          })
          if (!r.ok) {
            const txt = await r.text().catch(() => '')
            throw new Error(`REPLAY_FAILED(${r.status}) ${txt}`)
          }
          const j = await r.json().catch(() => ({}))
          if (!j?.token) throw new Error('REPLAY_NO_TOKEN')
          return j.token as string
        }

        // Use browser-side encryption with CryptoJS
        const { fernetEncrypt } = await import('@/lib/fernet_client')
        const loginKey = (window as any).CONFIG?.KOALA_LOGIN_KEY || import.meta.env.VITE_KOALA_LOGIN_KEY

        if (!loginKey) {
          console.error('[Fernet] No login key available for encryption')
          throw new Error('ENCRYPTION_FAILED: Missing encryption key')
        }

        try {
          const encrypted = fernetEncrypt(password, loginKey)
          console.log('[Fernet] Password encrypted using browser-side encryption')
          return encrypted
        } catch (err) {
          console.error('[Fernet] Browser-side encryption failed:', err)
          throw new Error('ENCRYPTION_FAILED: Browser encryption failed')
        }
      }

      try {
        const token = await mustBeToken()
        // Ensure urlsafe base64 is properly padded to length % 4 == 0
        const padLen = (4 - (token.length % 4)) % 4
        toSend = token + (padLen ? '='.repeat(padLen) : '')
        console.log('[Fernet] Password encrypted successfully')
      } catch (encryptError: any) {
        console.error('[Fernet] Encryption failed:', encryptError)
        // Provide user-friendly error message
        throw new Error('無法加密密碼，請重新整理頁面後再試')
      }
    }

    const res = await http.post<KoalaLoginResponse>('/api/account/auth/login/', { email, password: toSend })
    const access = res?.data?.tokens?.access_token || res?.token
    const refresh = res?.data?.tokens?.refresh_token
    const profile = res?.data?.profile
    if (access) {
      try {
        localStorage.setItem(apiStorage.ACCESS_KEY, access)
        if (refresh) localStorage.setItem(apiStorage.REFRESH_KEY, refresh)
      } catch {}
    }
    if (profile) saveUserProfile(profile)
    return { access, refresh, profile }
  },
  async logout() {
    try {
      await http.post('/api/account/auth/logout/')
    } catch {}
  },

  // Registration / availability
  checkAvailability(payload: { email?: string; username?: string }) {
    // API in Postman is GET but with body; using GET with query string for safety
    const qs = new URLSearchParams()
    if (payload.email) qs.set('email', payload.email)
    if (payload.username) qs.set('username', payload.username)
    const q = qs.toString()
    return http.get<{ available: boolean; message?: string }>(`/api/account/register/check-availability/${q ? '?' + q : ''}`)
  },
  register(payload: any) {
    return http.post('/api/account/register/', payload)
  },

  // Members
  async listMembers() {
    const res = await http.get<{code: number, data: {members: MemberItem[], total_count: number}}>('/api/account/members/')
    return res?.data?.members || []
  },
  getMember(id: string | number) {
    return http.get<MemberItem>(`/api/account/members/${id}/`)
  },
  updateMember(id: string | number, patch: Partial<MemberItem>) {
    return http.patch<MemberItem>(`/api/account/members/${id}/`, patch)
  },
  deleteMember(id: string | number) {
    return http.del<void>(`/api/account/members/${id}/`)
  },

  // Staff
  async listStaff() {
    ensureStaffApiAccess('listStaff')
    const res = await http.get<{code: number, data: {staff: StaffItem[], total_count: number}}>('/api/account/staff/')
    return res?.data?.staff || []
  },
  getStaff(id: string | number) {
    ensureStaffApiAccess('getStaff')
    return http.get<StaffItem>(`/api/account/staff/${id}/`)
  },
  updateStaff(id: string | number, patch: Partial<StaffItem>) {
    ensureStaffApiAccess('updateStaff')
    return http.patch<StaffItem>(`/api/account/staff/${id}/`, patch)
  },
  deleteStaff(id: string | number) {
    ensureStaffApiAccess('deleteStaff')
    return http.del<void>(`/api/account/staff/${id}/`)
  }
}
