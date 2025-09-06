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

// 測試不同的 padding 方式
function testDifferentPaddings(plaintext, base64UrlKey) {
  const key = b64uToBuf(base64UrlKey);
  const signingKey = key.subarray(0, 16);
  const encryptionKey = key.subarray(16);
  
  const version = Buffer.from([0x80]);
  const ts = Math.floor(Date.now() / 1000);
  const timestamp = u64beBuf(ts);
  const iv = Buffer.from('1234567890123456'); // 固定 IV 方便比較
  
  const input = Buffer.from(plaintext, 'utf-8');
  console.log('\n原始密碼:', plaintext);
  console.log('原始 bytes:', input.toString('hex'), `(${input.length} bytes)`);
  
  // 方法 1: PKCS#7 padding
  const pkcs7PadLen = 16 - (input.length % 16);
  const pkcs7Padded = Buffer.concat([input, Buffer.alloc(pkcs7PadLen, pkcs7PadLen)]);
  console.log('\n1. PKCS#7 Padding:');
  console.log('   Padded:', pkcs7Padded.toString('hex'), `(${pkcs7Padded.length} bytes)`);
  console.log('   解密後會得到:', JSON.stringify(pkcs7Padded.toString('utf-8')));
  
  // 方法 2: Zero padding
  const zeroPadLen = 16 - (input.length % 16);
  const zeroPadded = Buffer.concat([input, Buffer.alloc(zeroPadLen, 0)]);
  console.log('\n2. Zero Padding:');
  console.log('   Padded:', zeroPadded.toString('hex'), `(${zeroPadded.length} bytes)`);
  console.log('   解密後會得到:', JSON.stringify(zeroPadded.toString('utf-8')));
  
  // 方法 3: 補齊到剛好 16 bytes (加空格)
  const spacePadded = Buffer.from(plaintext.padEnd(16, ' '), 'utf-8');
  console.log('\n3. Space Padding (補到 16):');
  console.log('   Padded:', spacePadded.toString('hex'), `(${spacePadded.length} bytes)`);
  console.log('   解密後會得到:', JSON.stringify(spacePadded.toString('utf-8')));
  
  // 方法 4: 不 padding，但長度必須是 16 的倍數
  if (input.length === 16) {
    console.log('\n4. No Padding (長度剛好 16):');
    console.log('   可以直接加密，不需要 padding');
  }
  
  // 實際加密一個來測試
  console.log('\n實際加密測試 (PKCS#7):');
  const cipher = crypto.createCipheriv('aes-128-cbc', encryptionKey, iv);
  cipher.setAutoPadding(false);
  const ciphertext = Buffer.concat([cipher.update(pkcs7Padded), cipher.final()]);
  
  const msg = Buffer.concat([version, timestamp, iv, ciphertext]);
  const hmac = crypto.createHmac('sha256', signingKey).update(msg).digest();
  const token = Buffer.concat([msg, hmac]);
  console.log('Token:', bufToB64u(token));
}

// 測試
const password = '2m8N625cvmf0';
const key = '***REMOVED***';

testDifferentPaddings(password, key);

// 再測試一個剛好 16 bytes 的密碼
console.log('\n' + '='.repeat(50));
console.log('測試剛好 16 bytes 的密碼:');
testDifferentPaddings('1234567890123456', key);