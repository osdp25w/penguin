import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import { spawnSync } from 'node:child_process'

/* --- 在 ESM 取代 __dirname --- */
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

function devFernetPlugin(loginKey?: string) {
  return {
    name: 'dev-fernet-endpoint',
    apply: 'serve' as const,
    configureServer(server) {
      server.middlewares.use('/local/fernet', async (req, res, next) => {
        try {
          if (!loginKey) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'LOGIN_KEY_NOT_SET' }))
            return
          }
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const raw = Buffer.concat(chunks).toString('utf-8')
          const body = raw ? JSON.parse(raw) : {}
          const url = req.url || '/'
          const pathname = url.split('?')[0]

          if (req.method === 'POST' && (pathname === '/' || pathname === '')) {
            const text: string = body?.text || body?.password || ''
            const customKey: string = body?.key || loginKey // 允許使用自訂金鑰
            if (!text) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'MISSING_TEXT' }))
              return
            }
            const token = await fernetEncryptNode(text, customKey)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ token }))
            return
          }

          if (req.method === 'POST' && pathname === '/compat') {
            const text: string = body?.text || body?.password || ''
            if (!text) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'MISSING_TEXT' }))
              return
            }
            const token = await fernetEncryptNodeCompat(text, loginKey)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ token }))
            return
          }

          if (req.method === 'POST' && pathname === '/decrypt') {
            const tokens: string[] = Array.isArray(body?.tokens) ? body.tokens : []
            const customKey: string = body?.key || loginKey // 允許使用自訂金鑰進行解密
            if (!tokens.length) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'MISSING_TOKENS' }))
              return
            }
            const values = tokens.map(t => {
              try { return fernetDecryptNode(t, customKey) } catch { return t }
            })
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ values }))
            return
          }

          // Replay: produce token with same ts+iv as target token (for deterministic comparison)
          if (req.method === 'POST' && pathname === '/replay') {
            const text: string = body?.text || body?.password || ''
            const target: string = body?.token || ''
            const compat: boolean = !!body?.compat
            const tsParam = body?.ts
            const ivParam = body?.iv
            if (!text || (!target && (tsParam == null || !ivParam))) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'MISSING_TEXT_AND_TS_IV_OR_TOKEN' }))
              return
            }
            try {
              let ts: number, iv: Buffer
              if (tsParam != null && ivParam) {
                ts = Number(tsParam)
                if (!Number.isFinite(ts)) throw new Error('Invalid ts')
                const hex = String(ivParam).replace(/^0x/, '')
                if (!/^[0-9a-fA-F]{32}$/.test(hex)) throw new Error('Invalid iv hex (need 16 bytes)')
                iv = Buffer.from(hex, 'hex')
              } else {
                const parsed = parseFernetHeader(target)
                ts = parsed.ts
                iv = parsed.iv
              }
              const token = compat
                ? await fernetEncryptWith(ts, iv, text, loginKey, /*swapHalves*/ true)
                : await fernetEncryptWith(ts, iv, text, loginKey, /*swapHalves*/ false)
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ token }))
            } catch (e: any) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: e?.message || 'REPLAY_FAIL' }))
            }
            return
          }

          return next()
        } catch (err: any) {
          console.error('[dev] /local/fernet error:', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err?.message || 'FERNET_ENDPOINT_FAIL' }))
        }
      })
    }
  }
}

function b64uToBuf(b64u: string): Buffer {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64u.length + 3) % 4)
  return Buffer.from(b64, 'base64')
}

function bufToB64u(buf: Buffer): string {
  // Keep padding '=' to align with common Fernet token format
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
}

function pkcs7Pad(buf: Buffer, blockSize = 16): Buffer {
  const padLen = blockSize - (buf.length % blockSize)
  const padding = Buffer.alloc(padLen, padLen)
  return Buffer.concat([buf, padding])
}

function u64beBuf(n: number): Buffer {
  const buf = Buffer.alloc(8)
  // n fits in 32 bits for current epoch seconds; high 32 bits are zero
  buf.writeUInt32BE(0, 0)
  buf.writeUInt32BE(n >>> 0, 4)
  return buf
}

async function fernetEncryptNode(plaintext: string, base64UrlKey: string): Promise<string> {
  const key = b64uToBuf(base64UrlKey)
  if (key.length !== 32) throw new Error('Invalid Fernet key length')
  const signingKey = key.subarray(0, 16)
  const encryptionKey = key.subarray(16)

  const version = Buffer.from([0x80])
  const ts = Math.floor(Date.now() / 1000)
  const timestamp = u64beBuf(ts)
  const iv = crypto.randomBytes(16)

  const input = Buffer.from(plaintext, 'utf-8')
  const padded = pkcs7Pad(input)
  const cipher = crypto.createCipheriv('aes-128-cbc', encryptionKey, iv)
  cipher.setAutoPadding(false)
  const ciphertext = Buffer.concat([cipher.update(padded), cipher.final()])

  const msg = Buffer.concat([version, timestamp, iv, ciphertext])
  const hmac = crypto.createHmac('sha256', signingKey).update(msg).digest()
  const token = Buffer.concat([msg, hmac])
  return bufToB64u(token)
}

// Compatibility variant: swap signing/encryption halves to test backend expectations
async function fernetEncryptNodeCompat(plaintext: string, base64UrlKey: string): Promise<string> {
  const key = b64uToBuf(base64UrlKey)
  if (key.length !== 32) throw new Error('Invalid Fernet key length')
  // Swap halves
  const encryptionKey = key.subarray(0, 16)
  const signingKey = key.subarray(16)

  const version = Buffer.from([0x80])
  const ts = Math.floor(Date.now() / 1000)
  const timestamp = u64beBuf(ts)
  const iv = crypto.randomBytes(16)

  const input = Buffer.from(plaintext, 'utf-8')
  const padded = pkcs7Pad(input)
  const cipher = crypto.createCipheriv('aes-128-cbc', encryptionKey, iv)
  cipher.setAutoPadding(false)
  const ciphertext = Buffer.concat([cipher.update(padded), cipher.final()])

  const msg = Buffer.concat([version, timestamp, iv, ciphertext])
  const hmac = crypto.createHmac('sha256', signingKey).update(msg).digest()
  const token = Buffer.concat([msg, hmac])
  return bufToB64u(token)
}

function fernetDecryptNode(token: string, base64UrlKey: string): string {
  const buf = b64uToBuf(token)
  if (buf.length < 1 + 8 + 16 + 32) throw new Error('Invalid token length')
  const ver = buf[0]
  if (ver !== 0x80) throw new Error('Unsupported Fernet version')
  const iv = buf.subarray(9, 25)
  const hmacStart = buf.length - 32
  const msg = buf.subarray(0, hmacStart)
  const hmac = buf.subarray(hmacStart)
  const ciphertext = buf.subarray(25, hmacStart)

  const key = b64uToBuf(base64UrlKey)
  if (key.length !== 32) throw new Error('Invalid key length')
  const signingKey = key.subarray(0, 16)
  const encryptionKey = key.subarray(16)

  const mac = crypto.createHmac('sha256', signingKey).update(msg).digest()
  if (!crypto.timingSafeEqual(mac, hmac)) throw new Error('HMAC verification failed')

  const decipher = crypto.createDecipheriv('aes-128-cbc', encryptionKey, iv)
  decipher.setAutoPadding(false)
  const padded = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  const pad = padded[padded.length - 1]
  const unpadded = padded.subarray(0, padded.length - pad)
  return unpadded.toString('utf-8')
}

function ensureHttpsCreds(env: Record<string, string>) {
  try {
    const kp = path.resolve(__dirname, 'cert/dev.key')
    const cp = path.resolve(__dirname, 'cert/dev.crt')

    if (env.VITE_AUTO_CERT === '1') {
      // collect local IPs
      const ifs = os.networkInterfaces()
      const ips = new Set<string>(['127.0.0.1'])
      for (const ni of Object.values(ifs)) {
        if (!ni) continue
        for (const a of ni) {
          if (a.family === 'IPv4' && !a.internal) ips.add(a.address)
        }
      }
      const altNames = [
        'DNS.1 = localhost',
        ...Array.from(ips).map((ip, i) => `IP.${i + 1} = ${ip}`)
      ].join('\n')

      const conf = `
[ req ]
default_bits       = 2048
prompt             = no
default_md         = sha256
x509_extensions    = v3_req
distinguished_name = dn

[ dn ]
CN = dev.local

[ v3_req ]
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[ alt_names ]
${altNames}
`.trim()
      const autoConf = path.resolve(__dirname, 'cert/dev.auto.cnf')
      fs.mkdirSync(path.resolve(__dirname, 'cert'), { recursive: true })
      fs.writeFileSync(autoConf, conf)
      const gen = spawnSync('openssl', [
        'req','-x509','-nodes','-days','3650','-newkey','rsa:2048',
        '-keyout', kp, '-out', cp, '-config', autoConf
      ], { stdio: 'ignore' })
      if (gen.status === 0) {
        return { key: fs.readFileSync(kp), cert: fs.readFileSync(cp) }
      }
    }

    if (fs.existsSync(kp) && fs.existsSync(cp)) {
      return { key: fs.readFileSync(kp), cert: fs.readFileSync(cp) }
    }
  } catch {}
  return null
}

function parseFernetHeader(token: string): { ts: number; iv: Buffer } {
  const buf = b64uToBuf(token)
  if (buf.length < 1 + 8 + 16 + 32) throw new Error('Invalid token length')
  if (buf[0] !== 0x80) throw new Error('Unsupported Fernet version')
  const tsBuf = buf.subarray(1, 9)
  const iv = buf.subarray(9, 25)
  const ts = tsBuf.readUInt32BE(4) // high 32bits zero; read low 32 bits
  return { ts, iv }
}

async function fernetEncryptWith(ts: number, iv: Buffer, plaintext: string, base64UrlKey: string, swapHalves = false): Promise<string> {
  const key = b64uToBuf(base64UrlKey)
  if (key.length !== 32) throw new Error('Invalid Fernet key length')
  let signingKey = key.subarray(0, 16)
  let encryptionKey = key.subarray(16)
  if (swapHalves) {
    const t = signingKey; signingKey = encryptionKey; encryptionKey = t
  }
  const version = Buffer.from([0x80])
  const timestamp = u64beBuf(ts)
  const input = Buffer.from(plaintext, 'utf-8')
  const padded = pkcs7Pad(input)
  const cipher = crypto.createCipheriv('aes-128-cbc', encryptionKey, iv)
  cipher.setAutoPadding(false)
  const ciphertext = Buffer.concat([cipher.update(padded), cipher.final()])
  const msg = Buffer.concat([version, timestamp, iv, ciphertext])
  const hmac = crypto.createHmac('sha256', signingKey).update(msg).digest()
  return bufToB64u(Buffer.concat([msg, hmac]))
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const loginKey = env.VITE_KOALA_LOGIN_KEY
  const httpsCreds = ensureHttpsCreds(env)
  return {
    plugins: [
      vue(),
      UnoCSS(),
      devFernetPlugin(loginKey) // dev-only Fernet endpoint for insecure contexts
    ],

  /* 路徑別名 */
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },

  /* 若有 SCSS 變數／mixin 可在這裡全域注入 */
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/styles/_variables.scss" as *;`
      }
    }
  },

    /* 本機開發伺服器（與 Docker Nginx 無衝突） */
    server: {
      host: '0.0.0.0',
      port: 5173,
      https: httpsCreds || undefined,
      // Removed proxy - frontend now calls koala.osdp25w.xyz directly
    },

  /* 建置輸出 */
  build: {
    outDir: 'dist',
    sourcemap: false,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // 更穩定的 chunk 命名策略，確保與部署環境相容
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          // 手動分割關鍵組件到固定 chunk，避免動態導入問題
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-ui': ['@headlessui/vue']
          // 移除 admin-pages 手動分割，讓 Vite 自動處理
        }
      }
    }
  },

  /* 確保 base path 正確配置 */
  base: '/',

    /* 只注入 VITE_ 開頭的環境變數 */
    envPrefix: 'VITE_'
  }
})
