// scripts/fernet_encrypt.mjs
// Node 18+ Fernet token generator (non-deterministic)
// Usage:
//   node scripts/fernet_encrypt.mjs \
//     --key ***REMOVED*** \
//     --text 2m8N625cvmf0

import crypto from 'node:crypto'

function parseArgs(argv = process.argv) {
  const out = {}
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--key') out.key = argv[++i]
    else if (a === '--text') out.text = argv[++i]
  }
  return out
}

// Base64url helpers (keep '=')
const b64uToBuf = (s) => {
  const r = s.length % 4
  const pad = r === 2 ? '==' : r === 3 ? '=' : r === 1 ? '===' : ''
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}
const bufToB64u = (b) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_')

const pkcs7pad = (buf) => {
  const rem = buf.length % 16
  const padLen = rem === 0 ? 16 : 16 - rem
  return Buffer.concat([buf, Buffer.alloc(padLen, padLen)])
}

/**
 * Fernet encrypt (version 0x80) with AES-128-CBC + HMAC-SHA256
 * keyB64u: 32-bytes URL-safe base64 Fernet key
 * text: plaintext string to encrypt
 * returns: Fernet token (base64url, with '=')
 */
export function fernetEncrypt(keyB64u, text) {
  const key = b64uToBuf(keyB64u)
  if (key.length !== 32) throw new Error('Fernet key must be 32 bytes')
  const signKey = key.subarray(0, 16)   // HMAC key
  const encKey  = key.subarray(16, 32)  // AES-128-CBC key

  const version = Buffer.from([0x80])
  const ts = Math.floor(Date.now() / 1000)
  const tsBuf = Buffer.alloc(8)
  tsBuf.writeBigUInt64BE(BigInt(ts))

  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-128-cbc', encKey, iv)
  cipher.setAutoPadding(false)
  const padded = pkcs7pad(Buffer.from(text, 'utf8'))
  const ct = Buffer.concat([cipher.update(padded), cipher.final()])

  const body = Buffer.concat([version, tsBuf, iv, ct])
  const mac  = crypto.createHmac('sha256', signKey).update(body).digest()
  return bufToB64u(Buffer.concat([body, mac]))
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs()
  const key = args.key || '***REMOVED***'
  const text = args.text || '2m8N625cvmf0'
  console.log(fernetEncrypt(key, text))
}

