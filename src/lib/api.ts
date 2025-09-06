// src/lib/api.ts
// Lightweight fetch wrapper for Koala APIs with base URL and auth handling

const ACCESS_KEY = 'penguin.jwt'
const REFRESH_KEY = 'penguin.refresh'
const USER_KEY   = 'penguin.user'

function runtime(): any {
  try { return (globalThis as any)?.CONFIG || {} } catch { return {} }
}

function getBaseUrl() {
  const rt = runtime()
  const envBase = (import.meta as any)?.env?.VITE_KOALA_BASE_URL || (import.meta as any)?.env?.VITE_API_BASE
  // Development: prefer local proxy to avoid CORS
  if ((import.meta as any)?.env?.DEV) {
    let base = envBase ?? '/koala'
    if (/^https?:/i.test(base)) base = '/koala'
    return String(base).replace(/\/$/, '')
  }
  // Production: prefer runtime config (same-origin by default)
  const base = (rt.API_BASE ?? envBase ?? '').replace(/\/$/, '')
  return base
}

function getAccessToken(): string | null {
  try { return localStorage.getItem(ACCESS_KEY) } catch { return null }
}

function getRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH_KEY) } catch { return null }
}

function setTokens(access?: string, refresh?: string) {
  try {
    if (access) localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  } catch {}
}

export function clearAuthStorage() {
  try {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {}
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const base = getBaseUrl()
  // Accept full URL; for absolute API paths ('/api/...') don't prepend base
  let url: string
  if (/^https?:/i.test(path)) url = path
  else if (path.startsWith('/api')) {
    // Check if base already contains /api to avoid duplication
    if (base && base.includes('/api')) {
      // Remove /api from path to avoid duplication
      url = `${base}${path.replace('/api', '')}`
    } else {
      url = path
    }
  }
  else url = `${base}${path.startsWith('/') ? '' : '/'}${path}`
  // Last-resort rewrite: if running from local/LAN dev and URL points to Koala domain, rewrite to proxy
  try {
    const isLocal = typeof window !== 'undefined' && /^https?:\/\/(localhost|127\.0\.0\.1|10\.|172\.(1[6-9]|2\d|3[0-1])|192\.168\.)/i.test(window.location.origin)
    if (isLocal && /^https?:\/\/koala\.osdp25w\.xyz\//i.test(url)) {
      const u = new URL(url)
      url = `/koala${u.pathname}${u.search}`
    }
  } catch {}

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as any || {})
  }

  const token = getAccessToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const exec = async () => fetch(url, { ...opts, headers })

  let res = await exec()
  if (res.status === 401) {
    // Try refresh once
    const ok = await refreshToken()
    if (ok) {
      const newToken = getAccessToken()
      if (newToken) headers['Authorization'] = `Bearer ${newToken}`
      res = await exec()
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || res.statusText)
  }

  // Handle empty responses
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) return undefined as unknown as T
  const data = await res.json()

  // Auto-decrypt sensitive values if a key is provided
  const rt = runtime()
  const sensitiveKey = (rt.KOALA_SENSITIVE_KEY as string | undefined) || ((import.meta as any)?.env?.VITE_KOALA_SENSITIVE_KEY as string | undefined)
  if (sensitiveKey) {
    try {
      const dec = await decryptSensitiveDeep(data, sensitiveKey)
      return dec as T
    } catch {
      // ignore decryption errors, return raw data
      return data as T
    }
  }
  return data as T
}

// Recursively decrypt any Fernet-looking strings in an object/array
async function decryptSensitiveDeep(input: any, key: string): Promise<any> {
  const { fernetDecrypt, looksLikeFernet } = await import('@/lib/fernet')

  // Collect tokens map for batch decryption
  const tokens = new Set<string>()
  const collect = (val: any) => {
    if (typeof val === 'string' && looksLikeFernet(val)) tokens.add(val)
    else if (Array.isArray(val)) val.forEach(collect)
    else if (val && typeof val === 'object') Object.values(val).forEach(collect)
  }
  collect(input)
  if (tokens.size === 0) return input

  const isSecure = (globalThis as any).isSecureContext === true

  const mapping = new Map<string, string>()
  if (isSecure) {
    for (const t of tokens) {
      try { mapping.set(t, await fernetDecrypt(t, key)) } catch { /* keep raw */ }
    }
  } else if (import.meta.env.DEV) {
    try {
      const r = await fetch('/local/fernet/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: Array.from(tokens), key })
      })
      if (r.ok) {
        const j = await r.json()
        const arr: string[] = j?.values || []
        Array.from(tokens).forEach((tok, i) => {
          const dec = arr[i]
          if (typeof dec === 'string') mapping.set(tok, dec)
        })
      }
    } catch {
      // fallthrough
    }
  }

  const replace = (val: any): any => {
    if (typeof val === 'string' && mapping.has(val)) return mapping.get(val)
    if (Array.isArray(val)) return val.map(replace)
    if (val && typeof val === 'object') {
      const out: any = Array.isArray(val) ? [] : { ...val }
      for (const k of Object.keys(val)) out[k] = replace(val[k])
      return out
    }
    return val
  }

  return replace(input)
}

export const http = {
  get : <T>(path: string, init?: RequestInit) => request<T>(path, { method: 'GET', ...(init||{}) }),
  post: <T>(path: string, body?: any, init?: RequestInit) => request<T>(path, { method: 'POST', body: body==null? undefined : JSON.stringify(body), ...(init||{}) }),
  patch:<T>(path: string, body?: any, init?: RequestInit) => request<T>(path, { method: 'PATCH', body: body==null? undefined : JSON.stringify(body), ...(init||{}) }),
  put : <T>(path: string, body?: any, init?: RequestInit) => request<T>(path, { method: 'PUT',  body: body==null? undefined : JSON.stringify(body), ...(init||{}) }),
  del : <T>(path: string, init?: RequestInit) => request<T>(path, { method: 'DELETE', ...(init||{}) })
}

// Token refresh flow
export async function refreshToken(): Promise<boolean> {
  const base = getBaseUrl()
  const refresh = getRefreshToken()
  if (!refresh) return false

  try {
    const res = await fetch(`${base}/api/account/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh })
    })
    if (!res.ok) return false
    const data: any = await res.json()
    const access = data?.data?.tokens?.access_token || data?.access_token || data?.token
    const newRefresh = data?.data?.tokens?.refresh_token || data?.refresh_token
    if (access) setTokens(access, newRefresh)
    return !!access
  } catch {
    return false
  }
}

export function saveUserProfile(profile: any) {
  try { localStorage.setItem(USER_KEY, JSON.stringify(profile)) } catch {}
}

export function loadUserProfile<T = any>(): T | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch { return null }
}

export const apiStorage = {
  ACCESS_KEY,
  REFRESH_KEY,
  USER_KEY
}
