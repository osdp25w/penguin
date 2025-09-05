// src/lib/fernet.ts
// Minimal Fernet encryption for browser using Web Crypto API
// Token format: base64url( version(1) || timestamp(8) || iv(16) || ciphertext || hmac(32) )

function b64uToBytes(b64u: string): Uint8Array {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64u.length + 3) % 4)
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

function bytesToB64u(bytes: Uint8Array): string {
  let str = ''
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i])
  const b64 = btoa(str)
  return b64.replace(/\+/g, '-').replace(/\//g, '_')
}

function pkcs7Pad(data: Uint8Array, blockSize = 16): Uint8Array {
  const padLen = blockSize - (data.length % blockSize)
  const out = new Uint8Array(data.length + padLen)
  out.set(data)
  out.fill(padLen, data.length)
  return out
}

function concatBytes(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((n, a) => n + a.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const a of arrs) { out.set(a, off); off += a.length }
  return out
}

function u64be(n: number): Uint8Array {
  const out = new Uint8Array(8)
  const hi = Math.floor(n / 2 ** 32)
  const lo = n >>> 0
  out[0] = (hi >>> 24) & 0xff
  out[1] = (hi >>> 16) & 0xff
  out[2] = (hi >>> 8) & 0xff
  out[3] = hi & 0xff
  out[4] = (lo >>> 24) & 0xff
  out[5] = (lo >>> 16) & 0xff
  out[6] = (lo >>> 8) & 0xff
  out[7] = lo & 0xff
  return out
}

async function importAesKey(key: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['encrypt'])
}

async function importHmacKey(key: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
}

export async function fernetEncrypt(plaintext: string, base64UrlKey: string): Promise<string> {
  if (!('crypto' in globalThis) || !('subtle' in crypto)) {
    throw new Error('WebCrypto not available in this environment')
  }
  const keyBytes = b64uToBytes(base64UrlKey)
  if (keyBytes.length !== 32) throw new Error('Invalid Fernet key length')

  // Split into signing and encryption keys (16 + 16 bytes)
  const signingKey = keyBytes.slice(0, 16)
  const encryptionKey = keyBytes.slice(16)

  const aesKey = await importAesKey(encryptionKey)
  const macKey = await importHmacKey(signingKey)

  // Prepare header
  const version = new Uint8Array([0x80])
  const ts = Math.floor(Date.now() / 1000)
  const timestamp = u64be(ts)
  const iv = crypto.getRandomValues(new Uint8Array(16))

  // Encode and pad
  const enc = new TextEncoder()
  const padded = pkcs7Pad(enc.encode(plaintext))

  // Encrypt
  const ctBuf = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, aesKey, padded)
  const ciphertext = new Uint8Array(ctBuf)

  const msg = concatBytes(version, timestamp, iv, ciphertext)
  const hmacBuf = await crypto.subtle.sign('HMAC', macKey, msg)
  const hmac = new Uint8Array(hmacBuf)

  const token = concatBytes(msg, hmac)
  return bytesToB64u(token)
}

export function looksLikeFernet(token: string): boolean {
  // Quick heuristic: Fernet tokens are base64url and often start with 'gAAAAA'
  return /^[A-Za-z0-9_-]+={0,2}$/.test(token) && token.startsWith('gAAAAA')
}

function pkcs7Unpad(data: Uint8Array): Uint8Array {
  const pad = data[data.length - 1]
  const len = data.length - pad
  if (pad <= 0 || pad > 16 || len < 0) return data
  // Basic check: all last pad bytes equal pad value
  for (let i = 1; i <= pad; i++) if (data[data.length - i] !== pad) return data
  return data.subarray(0, len)
}

export async function fernetDecrypt(token: string, base64UrlKey: string): Promise<string> {
  if (!('crypto' in globalThis) || !('subtle' in crypto)) {
    throw new Error('WebCrypto not available in this environment')
  }
  const tokenBytes = b64uToBytes(token)
  if (tokenBytes.length < 1 + 8 + 16 + 32) throw new Error('Invalid token length')

  const ver = tokenBytes[0]
  if (ver !== 0x80) throw new Error('Unsupported Fernet version')

  const ts = tokenBytes.subarray(1, 9)              // unused
  const iv = tokenBytes.subarray(9, 25)
  const hmacStart = tokenBytes.length - 32
  const msg = tokenBytes.subarray(0, hmacStart)
  const hmac = tokenBytes.subarray(hmacStart)
  const ciphertext = tokenBytes.subarray(25, hmacStart)

  const keyBytes = b64uToBytes(base64UrlKey)
  if (keyBytes.length !== 32) throw new Error('Invalid Fernet key length')
  const signingKey = keyBytes.subarray(0, 16)
  const encryptionKey = keyBytes.subarray(16)

  // Verify HMAC
  const macKey = await importHmacKey(signingKey)
  const ok = await crypto.subtle.verify('HMAC', macKey, hmac, msg)
  if (!ok) throw new Error('HMAC verification failed')

  // Decrypt
  const aesKey = await importAesKey(encryptionKey)
  const ptBuf = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, aesKey, ciphertext)
  const unpadded = pkcs7Unpad(new Uint8Array(ptBuf))
  const dec = new TextDecoder()
  return dec.decode(unpadded)
}
