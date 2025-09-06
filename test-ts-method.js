// node 18+
import crypto from 'crypto';

const keyB64u = '***REMOVED***';
const plaintext = '2m8N625cvmf0';

const b64uToBuf = (s) => {
  const pad = s.length % 4 === 2 ? '==' : s.length % 4 === 3 ? '=' : '';
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
};
const bufToB64u = (b) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_'); // 保留 '='

const pkcs7pad = (b) => {
  const rem = b.length % 16;
  const padLen = rem === 0 ? 16 : 16 - rem;
  return Buffer.concat([b, Buffer.alloc(padLen, padLen)]);
};

// 自定義 padding：用 \x01 補齊到 16 的倍數，不用 PKCS#7
const customPad = (b) => {
  const rem = b.length % 16;
  if (rem === 0) return b; // 已經是 16 的倍數
  const padLen = 16 - rem;
  return Buffer.concat([b, Buffer.alloc(padLen, 0x01)]); // 用 \x01 填充
};

function fernetEncrypt(keyB64u, text) {
  const key = b64uToBuf(keyB64u);               // 32 bytes
  const signKey = key.subarray(0, 16);          // HMAC key
  const encKey  = key.subarray(16, 32);         // AES-128-CBC key

  const version = Buffer.from([0x80]);
  const ts = Math.floor(Date.now() / 1000);
  const tsBuf = Buffer.alloc(8); tsBuf.writeBigUInt64BE(BigInt(ts));

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-128-cbc', encKey, iv);
  cipher.setAutoPadding(false);
  const padded = pkcs7pad(Buffer.from(text, 'utf8'));
  const ct = Buffer.concat([cipher.update(padded), cipher.final()]);

  const body = Buffer.concat([version, tsBuf, iv, ct]);
  const mac = crypto.createHmac('sha256', signKey).update(body).digest();

  return bufToB64u(Buffer.concat([body, mac])); // 這就是 Fernet token
}

function fernetEncryptCustom(keyB64u, text) {
  const key = b64uToBuf(keyB64u);               // 32 bytes
  const signKey = key.subarray(0, 16);          // HMAC key
  const encKey  = key.subarray(16, 32);         // AES-128-CBC key

  const version = Buffer.from([0x80]);
  const ts = Math.floor(Date.now() / 1000);
  const tsBuf = Buffer.alloc(8); tsBuf.writeBigUInt64BE(BigInt(ts));

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-128-cbc', encKey, iv);
  cipher.setAutoPadding(false);
  
  // 使用自定義 padding 而不是 PKCS#7
  const padded = customPad(Buffer.from(text, 'utf8'));
  console.log('原始密碼:', text);
  console.log('原始 hex:', Buffer.from(text, 'utf8').toString('hex'));
  console.log('自定義 padding 後:', JSON.stringify(padded.toString('utf8')));
  console.log('自定義 padding hex:', padded.toString('hex'));
  
  const ct = Buffer.concat([cipher.update(padded), cipher.final()]);

  const body = Buffer.concat([version, tsBuf, iv, ct]);
  const mac = crypto.createHmac('sha256', signKey).update(body).digest();

  return bufToB64u(Buffer.concat([body, mac])); // 這就是 Fernet token
}

// 解密函數來驗證結果
function fernetDecrypt(keyB64u, token) {
  const key = b64uToBuf(keyB64u);
  const signKey = key.subarray(0, 16);
  const encKey = key.subarray(16, 32);
  
  const tokenBuf = b64uToBuf(token);
  const body = tokenBuf.subarray(0, -32);
  const mac = tokenBuf.subarray(-32);
  
  // 驗證 HMAC
  const expectedMac = crypto.createHmac('sha256', signKey).update(body).digest();
  if (!crypto.timingSafeEqual(mac, expectedMac)) {
    throw new Error('HMAC verification failed');
  }
  
  const iv = body.subarray(9, 25);
  const ct = body.subarray(25);
  
  const decipher = crypto.createDecipheriv('aes-128-cbc', encKey, iv);
  decipher.setAutoPadding(false);
  const decrypted = Buffer.concat([decipher.update(ct), decipher.final()]);
  
  console.log('解密後原始 hex:', decrypted.toString('hex'));
  console.log('解密後內容:', JSON.stringify(decrypted.toString('utf8')));
  
  // 移除自定義 padding
  const cleaned = decrypted.toString('utf8').replace(/\x01+$/, '');
  console.log('移除 padding 後:', JSON.stringify(cleaned));
  
  return cleaned;
}

console.log('=== 原始 PKCS#7 方法 ===');
const originalToken = fernetEncrypt(keyB64u, plaintext);
console.log('Token:', originalToken);

console.log('\n=== 自定義 padding 方法 ===');
const customToken = fernetEncryptCustom(keyB64u, plaintext);
console.log('Token:', customToken);

console.log('\n=== 驗證解密 ===');
try {
  const result = fernetDecrypt(keyB64u, customToken);
  console.log('最終結果:', result);
  console.log('是否正確:', result === plaintext);
} catch (error) {
  console.error('解密失敗:', error.message);
}