const crypto = require('crypto');

function b64uToBuf(b64u) {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64u.length + 3) % 4);
  return Buffer.from(b64, 'base64');
}

function bufToB64u(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

function u64beBuf(n) {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(0, 0);
  buf.writeUInt32BE(n >>> 0, 4);
  return buf;
}

// 最簡單的方案：直接用空格補齊到 16，不加 PKCS#7
function fernetEncryptSimple(plaintext, base64UrlKey) {
  const key = b64uToBuf(base64UrlKey);
  const signingKey = key.subarray(0, 16);
  const encryptionKey = key.subarray(16);
  
  const version = Buffer.from([0x80]);
  const ts = Math.floor(Date.now() / 1000);
  const timestamp = u64beBuf(ts);
  const iv = crypto.randomBytes(16);
  
  // 用特殊標記補齊到 16，後端可以根據標記截斷
  let paddedText = plaintext;
  while (paddedText.length % 16 !== 0) {
    paddedText += '\x01';  // 用 \x01 當作 padding 標記
  }
  
  const input = Buffer.from(paddedText, 'utf-8');
  console.log('原密碼:', JSON.stringify(plaintext));
  console.log('補齊後:', JSON.stringify(paddedText));
  console.log('補齊後 hex:', input.toString('hex'));
  console.log('長度:', input.length);
  
  const cipher = crypto.createCipheriv('aes-128-cbc', encryptionKey, iv);
  cipher.setAutoPadding(false);  // 關閉自動 padding
  const ciphertext = Buffer.concat([cipher.update(input), cipher.final()]);
  
  const msg = Buffer.concat([version, timestamp, iv, ciphertext]);
  const hmac = crypto.createHmac('sha256', signingKey).update(msg).digest();
  const token = Buffer.concat([msg, hmac]);
  return bufToB64u(token);
}

// 測試解密看看結果
function testDecrypt(token, key) {
  const tokenBuf = b64uToBuf(token);
  const keyBuf = b64uToBuf(key);
  
  const signingKey = keyBuf.subarray(0, 16);
  const encryptionKey = keyBuf.subarray(16);
  
  const iv = tokenBuf.subarray(9, 25);
  const hmacStart = tokenBuf.length - 32;
  const ciphertext = tokenBuf.subarray(25, hmacStart);
  
  const decipher = crypto.createDecipheriv('aes-128-cbc', encryptionKey, iv);
  decipher.setAutoPadding(false);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  
  const plaintext = decrypted.toString('utf-8');
  console.log('解密結果:', JSON.stringify(plaintext));
  // 移除 \x01 padding
  const cleaned = plaintext.replace(/\x01+$/, '');
  console.log('清理後:', JSON.stringify(cleaned));
  return cleaned;
}

// 測試
const password = '2m8N625cvmf0';
const key = '***REMOVED***';

console.log('測試自定義 padding:');
const token = fernetEncryptSimple(password, key);
console.log('加密 token:', token);

console.log('\n驗證解密:');
testDecrypt(token, key);