const crypto = require('crypto');

function b64uToBuf(b64u) {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64u.length + 3) % 4);
  return Buffer.from(b64, 'base64');
}

function pkcs7Unpad(buf) {
  const pad = buf[buf.length - 1];
  const len = buf.length - pad;
  if (pad <= 0 || pad > 16 || len < 0) return buf;
  // Check all padding bytes
  for (let i = 1; i <= pad; i++) {
    if (buf[buf.length - i] !== pad) return buf;
  }
  return buf.subarray(0, len);
}

function fernetDecrypt(token, base64UrlKey) {
  const tokenBuf = b64uToBuf(token);
  if (tokenBuf.length < 1 + 8 + 16 + 32) throw new Error('Invalid token length');
  
  const ver = tokenBuf[0];
  if (ver !== 0x80) throw new Error('Unsupported Fernet version');
  
  const ts = tokenBuf.subarray(1, 9);
  const iv = tokenBuf.subarray(9, 25);
  const hmacStart = tokenBuf.length - 32;
  const msg = tokenBuf.subarray(0, hmacStart);
  const hmac = tokenBuf.subarray(hmacStart);
  const ciphertext = tokenBuf.subarray(25, hmacStart);
  
  const key = b64uToBuf(base64UrlKey);
  if (key.length !== 32) throw new Error('Invalid key length');
  
  // 標準 Fernet: signing=前16, encryption=後16
  const signingKey = key.subarray(0, 16);
  const encryptionKey = key.subarray(16);
  
  // Verify HMAC
  const mac = crypto.createHmac('sha256', signingKey).update(msg).digest();
  if (!crypto.timingSafeEqual(mac, hmac)) {
    console.log('HMAC verification failed, trying swapped keys...');
    // 試試交換的 key 順序
    const signingKey2 = key.subarray(16);
    const encryptionKey2 = key.subarray(0, 16);
    const mac2 = crypto.createHmac('sha256', signingKey2).update(msg).digest();
    if (!crypto.timingSafeEqual(mac2, hmac)) {
      throw new Error('HMAC verification failed with both key orders');
    }
    // 使用交換的 key
    const decipher = crypto.createDecipheriv('aes-128-cbc', encryptionKey2, iv);
    decipher.setAutoPadding(false);
    const padded = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const unpadded = pkcs7Unpad(padded);
    return { 
      plaintext: unpadded.toString('utf-8'),
      rawPadded: padded.toString('utf-8'),
      paddingBytes: padded.length - unpadded.length,
      keyOrder: 'swapped'
    };
  }
  
  // Decrypt with standard key order
  const decipher = crypto.createDecipheriv('aes-128-cbc', encryptionKey, iv);
  decipher.setAutoPadding(false);
  const padded = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  const unpadded = pkcs7Unpad(padded);
  
  return { 
    plaintext: unpadded.toString('utf-8'),
    rawPadded: padded.toString('utf-8'),
    paddingBytes: padded.length - unpadded.length,
    keyOrder: 'standard'
  };
}

// 測試
const token = 'gAAAAABovE_AMKNqrjsu7yQorKiMmJGV6P2bXsua4JW06OpYqTGbGMLSjhcCTi03yoZSBTCtmyPr4sofKp3JFIIZI50dXnibqulw_DjpeKkx9Ea63wR97Es=';
const key = '***REMOVED***';

try {
  const result = fernetDecrypt(token, key);
  console.log('解密結果:');
  console.log('- 明文:', JSON.stringify(result.plaintext));
  console.log('- 原始（含 padding）:', JSON.stringify(result.rawPadded));
  console.log('- Padding 字節數:', result.paddingBytes);
  console.log('- Key 順序:', result.keyOrder);
  console.log('- 明文長度:', result.plaintext.length);
  console.log('- 明文 bytes:', Buffer.from(result.plaintext).toString('hex'));
  
  // 顯示 padding bytes
  if (result.paddingBytes > 0) {
    const padded = Buffer.from(result.rawPadded, 'utf-8');
    const paddingValues = [];
    for (let i = padded.length - result.paddingBytes; i < padded.length; i++) {
      paddingValues.push(`\\x${padded[i].toString(16).padStart(2, '0')}`);
    }
    console.log('- Padding 內容:', paddingValues.join(''));
  }
} catch (error) {
  console.error('解密失敗:', error.message);
}