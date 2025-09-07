const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const b64uToBuf = (s) => {
  const pad = s.length % 4 === 2 ? '==' : s.length % 4 === 3 ? '=' : '';
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
};

const bufToB64u = (b) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

const pkcs7pad = (b) => {
  const rem = b.length % 16;
  const padLen = rem === 0 ? 16 : 16 - rem;
  return Buffer.concat([b, Buffer.alloc(padLen, padLen)]);
};

const pkcs7unpad = (b) => {
  const padLen = b[b.length - 1];
  if (padLen < 1 || padLen > 16) throw new Error('Invalid padding');
  for (let i = b.length - padLen; i < b.length; i++) {
    if (b[i] !== padLen) throw new Error('Invalid padding');
  }
  return b.subarray(0, b.length - padLen);
};

function fernetDecrypt(keyB64u, tokenB64u) {
  const key = b64uToBuf(keyB64u);
  if (key.length !== 32) throw new Error('Invalid Fernet key length');
  const signKey = key.subarray(0, 16);
  const encKey = key.subarray(16, 32);
  
  const tokenBuf = b64uToBuf(tokenB64u);
  if (tokenBuf.length < 57) throw new Error('Invalid token length');
  
  // Parse token structure: version(1) + timestamp(8) + iv(16) + ciphertext + mac(32)
  const version = tokenBuf[0];
  if (version !== 0x80) throw new Error('Invalid token version');
  
  const tsBuf = tokenBuf.subarray(1, 9);
  const iv = tokenBuf.subarray(9, 25);
  const ct = tokenBuf.subarray(25, tokenBuf.length - 32);
  const mac = tokenBuf.subarray(tokenBuf.length - 32);
  
  // Verify HMAC
  const body = tokenBuf.subarray(0, tokenBuf.length - 32);
  const expectedMac = crypto.createHmac('sha256', signKey).update(body).digest();
  
  if (!mac.equals(expectedMac)) {
    throw new Error('HMAC verification failed');
  }
  
  // Decrypt
  const decipher = crypto.createDecipheriv('aes-128-cbc', encKey, iv);
  decipher.setAutoPadding(false);
  const padded = Buffer.concat([decipher.update(ct), decipher.final()]);
  const plaintext = pkcs7unpad(padded);
  
  return plaintext.toString('utf8');
}

function fernetEncrypt(keyB64u, text) {
  const key = b64uToBuf(keyB64u);               // 32 bytes
  if (key.length !== 32) throw new Error('Invalid Fernet key length');
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

  return bufToB64u(Buffer.concat([body, mac]));
}

// Fernet 加密端點（使用服務環境變數中的 KOALA_LOGIN_KEY）
app.post('/api/fernet/encrypt', (req, res) => {
  try {
    const { text } = req.body;
    const key = process.env.KOALA_LOGIN_KEY;

    if (!text) {
      return res.status(400).json({ error: 'Missing text' });
    }
    if (!key) {
      return res.status(500).json({ error: 'Server key not configured' });
    }

    const token = fernetEncrypt(key, text);
    res.json({ token });
  } catch (error) {
    console.error('Encryption error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fernet 解密端點（批量解密，支持不同金鑰）
app.post('/api/fernet/decrypt', (req, res) => {
  try {
    const { tokens, key } = req.body;

    if (!tokens || !Array.isArray(tokens)) {
      return res.status(400).json({ error: 'Missing tokens array' });
    }

    // 在開發環境使用前端提供的金鑰，生產環境使用服務器端金鑰
    const decryptKey = key || process.env.KOALA_SENSITIVE_KEY;
    
    if (!decryptKey) {
      return res.status(500).json({ error: 'Server key not configured' });
    }

    const values = tokens.map(token => {
      try {
        return fernetDecrypt(decryptKey, token);
      } catch (error) {
        console.error('Decrypt error for token:', token.substring(0, 20) + '...', error.message);
        return token; // 解密失敗時返回原始值
      }
    });

    res.json({ values });
  } catch (error) {
    console.error('Batch decryption error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Fernet service running on port ${PORT}`);
});
