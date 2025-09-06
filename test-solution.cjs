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

// 智能 padding：補到最接近的 16 倍數，避免額外的 PKCS#7 padding
function smartPad(input) {
  const len = input.length;
  const nextMultiple = Math.ceil(len / 16) * 16;
  const padLen = nextMultiple - len;
  
  if (padLen === 0) {
    // 長度剛好是 16 的倍數，PKCS#7 會加一整個 block
    // 所以我們用空格補一個字符，讓 PKCS#7 加 15 個 0x0f
    return Buffer.from(input + ' '.repeat(15), 'utf-8');
  } else {
    // 用空格補齊到 16 的倍數，讓 PKCS#7 加滿一個 block
    return Buffer.from(input + ' '.repeat(16 - padLen), 'utf-8');
  }
}

function fernetEncryptNoPadding(plaintext, base64UrlKey) {
  const key = b64uToBuf(base64UrlKey);
  const signingKey = key.subarray(0, 16);
  const encryptionKey = key.subarray(16);
  
  const version = Buffer.from([0x80]);
  const ts = Math.floor(Date.now() / 1000);
  const timestamp = u64beBuf(ts);
  const iv = crypto.randomBytes(16);
  
  // 使用智能 padding
  const paddedInput = smartPad(plaintext);
  console.log('原密碼:', JSON.stringify(plaintext));
  console.log('智能補齊後:', JSON.stringify(paddedInput.toString('utf-8')));
  console.log('長度:', paddedInput.length);
  
  // 現在用 PKCS#7 padding（會加滿 16 個字節）
  const pkcs7PadLen = 16 - (paddedInput.length % 16);
  const finalPadded = Buffer.concat([paddedInput, Buffer.alloc(pkcs7PadLen, pkcs7PadLen)]);
  console.log('最終 padded:', JSON.stringify(finalPadded.toString('utf-8')));
  
  const cipher = crypto.createCipheriv('aes-128-cbc', encryptionKey, iv);
  cipher.setAutoPadding(false);
  const ciphertext = Buffer.concat([cipher.update(finalPadded), cipher.final()]);
  
  const msg = Buffer.concat([version, timestamp, iv, ciphertext]);
  const hmac = crypto.createHmac('sha256', signingKey).update(msg).digest();
  const token = Buffer.concat([msg, hmac]);
  return bufToB64u(token);
}

// 測試
const password = '2m8N625cvmf0';
const key = '***REMOVED***';

console.log('測試智能 padding:');
const token = fernetEncryptNoPadding(password, key);
console.log('加密 token:', token);