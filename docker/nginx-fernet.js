#!/usr/bin/env node
// Nginx 用的 Fernet 加密腳本
const crypto = require('crypto');

function b64uToBuf(b64u) {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64u.length + 3) % 4);
  return Buffer.from(b64, 'base64');
}

function bufToB64u(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

function pkcs7Pad(buf, blockSize = 16) {
  const padLen = blockSize - (buf.length % blockSize);
  const padding = Buffer.alloc(padLen, padLen);
  return Buffer.concat([buf, padding]);
}

function u64beBuf(n) {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(0, 0);
  buf.writeUInt32BE(n >>> 0, 4);
  return buf;
}

function fernetEncrypt(plaintext, base64UrlKey) {
  const key = b64uToBuf(base64UrlKey);
  if (key.length !== 32) throw new Error('Invalid Fernet key length');
  
  const signingKey = key.subarray(0, 16);
  const encryptionKey = key.subarray(16);
  
  const version = Buffer.from([0x80]);
  const ts = Math.floor(Date.now() / 1000);
  const timestamp = u64beBuf(ts);
  const iv = crypto.randomBytes(16);
  
  const input = Buffer.from(plaintext, 'utf-8');
  const padded = pkcs7Pad(input);
  const cipher = crypto.createCipheriv('aes-128-cbc', encryptionKey, iv);
  cipher.setAutoPadding(false);
  const ciphertext = Buffer.concat([cipher.update(padded), cipher.final()]);
  
  const msg = Buffer.concat([version, timestamp, iv, ciphertext]);
  const hmac = crypto.createHmac('sha256', signingKey).update(msg).digest();
  const token = Buffer.concat([msg, hmac]);
  return bufToB64u(token);
}

// 從標準輸入讀取 JSON
let input = '';
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const { text, key } = data;
    
    if (!text || !key) {
      console.error(JSON.stringify({ error: 'Missing text or key' }));
      process.exit(1);
    }
    
    const token = fernetEncrypt(text, key);
    console.log(JSON.stringify({ token }));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
});