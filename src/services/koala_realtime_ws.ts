import { useAuth } from '@/stores/auth'
import { useToasts } from '@/stores/toasts'
import { getKoalaBaseUrl, toWsUrl } from './koala_ws_common'

export interface BikeRealtimeStatusUpdate {
  bike_id: string
  lat_decimal?: number | null
  lng_decimal?: number | null
  soc?: number | null
  vehicle_speed?: number | null
  last_seen?: string | null
}

type RealtimeSubscriber = (updates: BikeRealtimeStatusUpdate[]) => void

let socket: WebSocket | null = null
let connecting = false
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
const subscribers = new Set<RealtimeSubscriber>()
let connectionStatusCallback: ((connected: boolean) => void) | null = null

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function notifySubscribers(updates: BikeRealtimeStatusUpdate[]) {
  if (!updates.length) return
  subscribers.forEach((cb) => {
    try {
      cb(updates)
    } catch (error) {
      console.error('[RealtimeWS] Subscriber error:', error)
    }
  })
}

async function ensureConnected(): Promise<void> {
  if (!subscribers.size) return
  if (socket && socket.readyState === WebSocket.OPEN) {
    connectionStatusCallback?.(true)
    return
  }
  if (connecting) return

  connecting = true
  const toasts = useToasts()
  try {
    const auth = useAuth()
    const token = await auth.ensureValidToken().catch(() => auth.accessToken)
    if (!token) {
      console.warn('[RealtimeWS] 無法取得 access token，跳過連線')
      return
    }

    const wsUrl = `${toWsUrl(getKoalaBaseUrl())}/ws/bike/realtime-status/?token=${encodeURIComponent(token)}`
    console.log('[RealtimeWS] Connecting to', wsUrl)

    const ws = new WebSocket(wsUrl)
    socket = ws

    ws.onopen = () => {
      console.log('[RealtimeWS] Connected')
      clearReconnectTimer()
      connectionStatusCallback?.(true)
      toasts.success('即時車輛資料串流已連線')
    }

    ws.onclose = () => {
      console.warn('[RealtimeWS] Connection closed')
      socket = null
      connectionStatusCallback?.(false)
      if (subscribers.size) {
        toasts.warning('即時車輛資料串流中斷，3 秒後將重試')
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null
            ensureConnected().catch((error) => console.error('[RealtimeWS] Reconnect failed:', error))
          }, 3000)
        }
      }
    }

    ws.onerror = (event) => {
      console.error('[RealtimeWS] Socket error', event)
      toasts.error('即時車輛資料串流發生錯誤')
      connectionStatusCallback?.(false)
    }

    ws.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data)
        if (payload?.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }))
          return
        }
        if (payload?.type === 'bike_realtime_status_notification') {
          const data = Array.isArray(payload.data)
            ? payload.data
            : payload.data
              ? [payload.data]
              : []
          notifySubscribers(data)
        }
      } catch (error) {
        console.error('[RealtimeWS] Failed to parse message', error)
      }
    }
  } finally {
    connecting = false
  }
}

function disconnectIntentional() {
  clearReconnectTimer()
  if (socket) {
    try {
      socket.close()
    } catch (error) {
      console.error('[RealtimeWS] Error closing socket', error)
    }
  }
  socket = null
  connectionStatusCallback?.(false)
}

export function setRealtimeStatusConnectionCallback(cb: (connected: boolean) => void) {
  connectionStatusCallback = cb
  if (socket?.readyState === WebSocket.OPEN) cb(true)
}

export function subscribeRealtimeStatus(cb: RealtimeSubscriber): () => void {
  subscribers.add(cb)
  ensureConnected().catch((error) => console.error('[RealtimeWS] Connect failed:', error))

  return () => {
    subscribers.delete(cb)
    if (!subscribers.size) {
      disconnectIntentional()
    }
  }
}
