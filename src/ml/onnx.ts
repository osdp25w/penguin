// Lightweight ONNX Runtime Web loader (CDN) with graceful fallback

declare global {
  interface Window { ort?: any }
}

let ortReady: Promise<any> | null = null

export async function ensureOrt(): Promise<any> {
  if (window.ort) return window.ort
  if (!ortReady) {
    ortReady = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js'
      s.async = true
      s.onload = () => resolve(window.ort)
      s.onerror = () => reject(new Error('Failed to load onnxruntime-web'))
      document.head.appendChild(s)
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

export async function runSession(sess: any, feeds: Record<string, any>): Promise<Record<string, any>> {
  const ort = await ensureOrt()
  if (!ort || !sess) throw new Error('ORT not available')
  const entries = Object.entries(feeds)
  if (entries.length === 0) throw new Error('No feeds provided')
  const arr = entries[0][1]
  const data = Array.isArray(arr) ? new Float32Array(arr as number[]) : (arr as Float32Array)
  const tensor = new ort.Tensor('float32', data, [1, data.length])
  const inputNames: string[] = (sess.inputNames && sess.inputNames.length ? sess.inputNames : ['float_input'])
  const inputTensors: Record<string, any> = {}
  for (const name of inputNames) inputTensors[name] = tensor
  const outputs = await sess.run(inputTensors)
  return outputs as any
}
