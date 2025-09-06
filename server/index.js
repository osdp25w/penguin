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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Fernet service running on port ${PORT}`);
});
