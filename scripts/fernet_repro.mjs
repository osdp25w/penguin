// scripts/fernet_repro.mjs
// Deterministically reproduce a given Fernet token by reusing its timestamp and IV.
// Node 18+ (ESM). Usage examples:
//   node scripts/fernet_repro.mjs \
//     --key ***REMOVED*** \
//     --text 2m8N625cvmf0 \
//     --token gAAAAABotFm5bXDASLt1gog0gFzdWwYW6JxBnmncnC0WQVSMl3zT8qdFfnMwAqZjHSjc0xMKZAQyOGTOdd2JGBRF7Lr0mivJWw==

import crypto from 'node:crypto'

// Defaults (can be overridden by CLI)
const DEFAULT_KEY = '***REMOVED***'
const DEFAULT_TEXT = '2m8N625cvmf0'
const DEFAULT_REF_TOKEN = 'gAAAAABotFm5bXDASLt1gog0gFzdWwYW6JxBnmncnC0WQVSMl3zT8qdFfnMwAqZjHSjc0xMKZAQyOGTOdd2JGBRF7Lr0mivJWw=='

function parseArgs(argv) {
  const out = {}
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--key') out.key = argv[++i]
    else if (a === '--text') out.text = argv[++i]
    else if (a === '--token') out.token = argv[++i]
    else if (a === '--ts') out.ts = Number(argv[++i])
    else if (a === '--iv') out.iv = argv[++i]
    else if (a === '--compat') out.compat = true
  }
  return out
}

const args = parseArgs(process.argv)
const FERNET_KEY = args.key || DEFAULT_KEY
const PLAINTEXT = args.text || DEFAULT_TEXT
const REF_TOKEN = args.token || DEFAULT_REF_TOKEN

const b64uToBuf = (s) => {
  const r = s.length % 4
  const pad = r === 2 ? '==' : r === 3 ? '=' : r === 1 ? '===' : ''
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}
const bufToB64u = (b) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_') // keep '='

const pkcs7pad = (buf) => {
  const rem = buf.length % 16
  const padLen = rem === 0 ? 16 : 16 - rem
  return Buffer.concat([buf, Buffer.alloc(padLen, padLen)])
}

function deriveKeys(fernetKeyB64u, swap = false) {
  const key = b64uToBuf(fernetKeyB64u)
  if (key.length !== 32) throw new Error('Fernet key must be 32 bytes')
  let signKey = key.subarray(0, 16)
  let encKey = key.subarray(16)
  if (swap) [signKey, encKey] = [encKey, signKey]
  return { signKey, encKey }
}

function parseFernet(token) {
  const raw = b64uToBuf(token)
  if (raw[0] !== 0x80) throw new Error('Unsupported version')
  const tsHi = raw.readUInt32BE(1)
  const tsLo = raw.readUInt32BE(5)
  const ts = tsHi * 2 ** 32 + tsLo
  const iv = raw.subarray(9, 25)
  return { ts, iv }
}

function u64be(ts) {
  const buf = Buffer.alloc(8)
  const hi = Math.floor(ts / 2 ** 32)
  const lo = ts >>> 0
  buf.writeUInt32BE(hi, 0)
  buf.writeUInt32BE(lo, 4)
  return buf
}

function encryptDeterministic({ keyB64u, text, ts, ivHex, compat = false }) {
  const { signKey, encKey } = deriveKeys(keyB64u, compat)
  const version = Buffer.from([0x80])
  const tsBuf = u64be(ts)
  const iv = Buffer.from(ivHex, 'hex')
  const cipher = crypto.createCipheriv('aes-128-cbc', encKey, iv)
  cipher.setAutoPadding(false)
  const padded = pkcs7pad(Buffer.from(text, 'utf8'))
  const ciphertext = Buffer.concat([cipher.update(padded), cipher.final()])
  const body = Buffer.concat([version, tsBuf, iv, ciphertext])
  const mac = crypto.createHmac('sha256', signKey).update(body).digest()
  return bufToB64u(Buffer.concat([body, mac]))
}

// Main
const { ts, iv } = args.ts && args.iv
  ? { ts: Number(args.ts), iv: Buffer.from(args.iv.replace(/^0x/, ''), 'hex') }
  : parseFernet(REF_TOKEN)

const token = encryptDeterministic({
  keyB64u: FERNET_KEY,
  text: PLAINTEXT,
  ts,
  ivHex: iv.toString('hex'),
  compat: !!args.compat
})

console.log('key    :', FERNET_KEY)
console.log('text   :', PLAINTEXT)
console.log('ts     :', ts)
console.log('iv(hex):', iv.toString('hex'))
console.log('token  :', token)

