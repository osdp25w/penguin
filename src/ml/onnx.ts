// Lightweight ONNX Runtime Web loader (CDN) with graceful fallback

declare global {
  interface Window { ort?: any }
}

let ortReady: Promise<any> | null = null

export async function ensureOrt(): Promise<any> {
  if (window.ort) return window.ort
  if (!ortReady) {
    ortReady = new Promise((resolve, reject) => {
      const tryLoad = (src: string, next?: () => void) => {
        const s = document.createElement('script')
        s.src = src
        s.async = true
        s.onload = () => resolve(window.ort)
        s.onerror = () => {
          if (next) next()
          else reject(new Error('Failed to load onnxruntime-web'))
        }
        document.head.appendChild(s)
      }
      // Pin a recent version with Map/Sequence support; fallback to alt bundle name
      tryLoad('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/ort.min.js', () =>
        tryLoad('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/ort.web.min.js')
      )
    })
  }
  try {
    return await ortReady
  } catch {
    // allow fallback
    return undefined
  }
}

const sessions: Record<string, any> = {}
const sessionLocks: Record<string, Promise<any>> = {}

export async function getSession(modelUrl: string): Promise<any | null> {
  try {
    const ort = await ensureOrt()
    if (!ort) return null
    if (sessions[modelUrl]) return sessions[modelUrl]
    const sess = await ort.InferenceSession.create(modelUrl, {
      executionProviders: ['wasm']
    })
    sessions[modelUrl] = sess
    return sess
  } catch (e) {
    // 靜默失敗，交由上層使用啟發式回退
    return null
  }
}

// 創建序列化執行的包裝函數
async function runSessionWithLock(sessionKey: string, runFn: () => Promise<any>): Promise<any> {
  // 如果有正在執行的任務，等待它完成
  while (sessionLocks[sessionKey]) {
    await sessionLocks[sessionKey].catch(() => {}) // 忽略前一個任務的錯誤
  }

  // 創建新的鎖
  let releaseLock: (() => void) | null = null
  sessionLocks[sessionKey] = new Promise<void>(resolve => {
    releaseLock = () => resolve()
  })

  try {
    const result = await runFn()
    return result
  } finally {
    // 釋放鎖
    const release = releaseLock
    if (release) release()
    delete sessionLocks[sessionKey]
  }
}

export async function runSession(sess: any, feeds: Record<string, any>): Promise<Record<string, any>> {
  const ort = await ensureOrt()
  if (!ort || !sess) throw new Error('ORT not available')

  // 使用 session 的唯一標識來序列化執行
  const sessionKey = sess.handler?._sessionId || 'default'

  return runSessionWithLock(sessionKey, async () => {
    const entries = Object.entries(feeds)
    if (entries.length === 0) throw new Error('No feeds provided')
    const arr = entries[0][1]
    const data = Array.isArray(arr) ? new Float32Array(arr as number[]) : (arr as Float32Array)
    const tensor = new ort.Tensor('float32', data, [1, data.length])
    const inputNames: string[] = (sess.inputNames && sess.inputNames.length ? sess.inputNames : ['float_input'])
    const inputTensors: Record<string, any> = {}
    for (const name of inputNames) inputTensors[name] = tensor
    const outputs = await sess.run(inputTensors)

    // Convert ONNX outputs to a more accessible format
    // Some models return Map/Sequence types that need special handling
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(outputs)) {
      try {
        // If it's a tensor, extract the data
        if (value && typeof value === 'object' && 'data' in value) {
          result[key] = value
        } else {
          // For Map/Sequence outputs, store as-is
          result[key] = value
        }
      } catch {
        // If there's any error accessing the value, store as-is
        result[key] = value
      }
    }
    return result
  })
}
