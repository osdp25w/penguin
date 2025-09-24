/**
 * Koala WebSocket 共用 util：讀取 runtime/env 設定與建構 ws(s) URL。
 */
function runtimeConfig() {
  try {
    return globalThis?.CONFIG || {}
  } catch (error) {
    console.warn('[KoalaWS] Failed to read runtime CONFIG:', error)
    return {}
  }
}

export function getKoalaBaseUrl() {
  const rt = runtimeConfig()
  const envBase = import.meta?.env?.VITE_KOALA_BASE_URL || import.meta?.env?.VITE_API_BASE
  const base = (rt.API_BASE ?? envBase ?? 'https://koala.osdp25w.xyz').replace(/\/$/, '')
  return base
}

export function toWsUrl(url) {
  if (url.startsWith('ws://') || url.startsWith('wss://')) return url
  if (url.startsWith('https://')) return 'wss://' + url.slice('https://'.length)
  if (url.startsWith('http://')) return 'ws://' + url.slice('http://'.length)
  return 'wss://' + url.replace(/\/$/, '')
}
