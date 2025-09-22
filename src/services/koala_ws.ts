import { useAuth } from '@/stores/auth'
import { useToasts } from '@/stores/toasts'
import { useAlerts } from '@/stores/alerts'

let socket: WebSocket | null = null
let connecting = false
let reconnectTimer: number | null = null
let connectionStatusCallback: ((connected: boolean) => void) | null = null

export function setConnectionStatusCallback(cb: (connected: boolean) => void) {
  connectionStatusCallback = cb
}

function runtime(): any {
  try { return (globalThis as any)?.CONFIG || {} } catch { return {} }
}

function baseUrl(): string {
  const rt = runtime()
  const envBase = (import.meta as any)?.env?.VITE_KOALA_BASE_URL || (import.meta as any)?.env?.VITE_API_BASE
  const base = (rt.API_BASE ?? envBase ?? 'https://koala.osdp25w.xyz').replace(/\/$/, '')
  return base
}

function toWs(u: string): string {
  if (u.startsWith('ws://') || u.startsWith('wss://')) return u
  if (u.startsWith('https://')) return 'wss://' + u.slice('https://'.length)
  if (u.startsWith('http://')) return 'ws://' + u.slice('http://'.length)
  return 'wss://' + u
}

export async function ensureKoalaWsConnected(): Promise<void> {
  const auth = useAuth()
  const role = auth.user?.roleId || sessionStorage.getItem('penguin.role') || localStorage.getItem('penguin.role')

  if (!(role === 'admin' || role === 'staff' || role === 'member')) {
    console.log('[KoalaWS] Skipping WebSocket connection for role:', role)
    connectionStatusCallback?.(false)
    return
  }

  if (socket || connecting) {
    if (socket?.readyState === WebSocket.OPEN) {
      connectionStatusCallback?.(true)
    }
    return
  }

  connecting = true
  const toasts = useToasts()
  const alerts = useAlerts()
  try {
    console.log('[KoalaWS] Attempting WebSocket connection for role:', role)
    const token = await auth.ensureValidToken().catch(() => auth.accessToken)
    if (!token) {
      connecting = false
      return
    }
    const wsUrl = `${toWs(baseUrl())}/ws/bike/error-logs/?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(wsUrl)
    socket = ws

    ws.onopen = () => {
      toasts.success('Koala 即時連線已建立')
      if (connectionStatusCallback) connectionStatusCallback(true)
      if (reconnectTimer) { clearTimeout(reconnectTimer as unknown as number); reconnectTimer = null }
    }
    ws.onclose = () => {
      socket = null
      toasts.warning('Koala 即時連線中斷，將自動重試...')
      if (connectionStatusCallback) connectionStatusCallback(false)
      // auto-reconnect with backoff
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null
          ensureKoalaWsConnected()
        }, 3000) as unknown as number
      }
    }
    ws.onerror = () => {
      toasts.error('Koala 即時連線發生錯誤')
      if (connectionStatusCallback) connectionStatusCallback(false)
    }
    ws.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data)
        if (payload?.type === 'ping') {
          // reply pong
          ws.send(JSON.stringify({ type: 'pong' }))
          return
        }
        if (payload?.type === 'bike_error_log_notification') {
          const d = payload.data || {}
          const title = d.title || '車輛異常通知'
          const bike = d.bike_id || d.bike || 'unknown'
          const level = (d.level || 'info') as 'info'|'warning'|'error'|'critical'
          // push toast
          const map: Record<string, any> = { info: 'info', warning: 'warning', error: 'error', critical: 'error' }
          useToasts().push(map[level] || 'info', `#${bike} ${title}`, '異常提醒', 6000)
          // also inject into alert list (best-effort)
          try {
            alerts.list.unshift({
              id: crypto.randomUUID(),
              siteId: 'unknown',
              vehicleId: String(bike),
              type: 'general',
              message: title,
              severity: level === 'critical' ? 'critical' : (level as any),
              resolved: false,
              createdAt: new Date().toISOString()
            } as any)
          } catch {}
        }
      } catch {}
    }
  } finally {
    connecting = false
  }
}
