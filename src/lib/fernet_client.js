// src/lib/fernet_client.ts
// Client-side Fernet (AES-CBC + HMAC-SHA256) using CryptoJS (window.CryptoJS)
// No WebCrypto usage per requirement.
function b64uToBytes(b64u) {
    const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64u.length + 3) % 4);
    const binary = typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++)
        out[i] = binary.charCodeAt(i);
    return out;
}
function bytesToB64u(bytes) {
    let str = '';
    for (let i = 0; i < bytes.length; i++)
        str += String.fromCharCode(bytes[i]);
    const b64 = typeof btoa !== 'undefined' ? btoa(str) : Buffer.from(str, 'binary').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function u64be(n) {
    const out = new Uint8Array(8);
    const hi = Math.floor(n / 2 ** 32);
    const lo = n >>> 0;
    out[0] = (hi >>> 24) & 0xff;
    out[1] = (hi >>> 16) & 0xff;
    out[2] = (hi >>> 8) & 0xff;
    out[3] = hi & 0xff;
    out[4] = (lo >>> 24) & 0xff;
    out[5] = (lo >>> 16) & 0xff;
    out[6] = (lo >>> 8) & 0xff;
    out[7] = lo & 0xff;
    return out;
}
function wordArrayFrom(bytes) {
    const CryptoJS = globalThis.CryptoJS;
    const words = [];
    for (let i = 0; i < bytes.length; i += 4) {
        words.push((bytes[i] << 24) |
            ((bytes[i + 1] || 0) << 16) |
            ((bytes[i + 2] || 0) << 8) |
            ((bytes[i + 3] || 0)));
    }
    return CryptoJS.lib.WordArray.create(words, bytes.length);
}
function bytesFromWordArray(wa) {
    const words = wa.words;
    const sigBytes = wa.sigBytes;
    const out = new Uint8Array(sigBytes);
    for (let i = 0; i < sigBytes; i++) {
        out[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    return out;
}
function randomIv() {
    // Note: without WebCrypto, this is not cryptographically strong.
    const iv = new Uint8Array(16);
    for (let i = 0; i < 16; i++)
        iv[i] = Math.floor(Math.random() * 256);
    return iv;
}
export function fernetEncrypt(plain, base64UrlKey, timestamp) {
    const CryptoJS = globalThis.CryptoJS;
    if (!CryptoJS)
        throw new Error('CryptoJS not loaded');
    const keyBytes = b64uToBytes(base64UrlKey);
    if (keyBytes.length !== 32)
        throw new Error('Invalid Fernet key length');
    const signingKey = keyBytes.slice(0, 16);
    const encKey = keyBytes.slice(16);
    const iv = randomIv();
    const ver = new Uint8Array([0x80]);
    const ts = u64be(typeof timestamp === 'number' ? timestamp : Math.floor(Date.now() / 1000));
    const ptWa = CryptoJS.enc.Utf8.parse(plain);
    const keyWa = wordArrayFrom(encKey);
    const ivWa = wordArrayFrom(iv);
    const ctWa = CryptoJS.AES.encrypt(ptWa, keyWa, { iv: ivWa, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).ciphertext;
    const ct = bytesFromWordArray(ctWa);
    const msg = new Uint8Array(ver.length + ts.length + iv.length + ct.length);
    msg.set(ver, 0);
    msg.set(ts, ver.length);
    msg.set(iv, ver.length + ts.length);
    msg.set(ct, ver.length + ts.length + iv.length);
    const mac = CryptoJS.HmacSHA256(wordArrayFrom(msg), wordArrayFrom(signingKey));
    const macBytes = bytesFromWordArray(mac);
    const token = new Uint8Array(msg.length + macBytes.length);
    token.set(msg, 0);
    token.set(macBytes, msg.length);
    return bytesToB64u(token);
}
export function fernetDecrypt(token, base64UrlKey) {
    const CryptoJS = globalThis.CryptoJS;
    if (!CryptoJS)
        throw new Error('CryptoJS not loaded');
    const keyBytes = b64uToBytes(base64UrlKey);
    if (keyBytes.length !== 32)
        throw new Error('Invalid Fernet key length');
    const signingKey = keyBytes.slice(0, 16);
    const encKey = keyBytes.slice(16);
    const bytes = b64uToBytes(token);
    if (bytes.length < 1 + 8 + 16 + 32)
        throw new Error('Invalid token length');
    if (bytes[0] !== 0x80)
        throw new Error('Unsupported Fernet version');
    const hmacStart = bytes.length - 32;
    const msg = bytes.slice(0, hmacStart);
    const macBytes = bytes.slice(hmacStart);
    const macCalc = CryptoJS.HmacSHA256(wordArrayFrom(msg), wordArrayFrom(signingKey));
    const macCalcBytes = bytesFromWordArray(macCalc);
    // Constant-time compare (simple):
    let ok = macCalcBytes.length === macBytes.length;
    for (let i = 0; i < macBytes.length && i < macCalcBytes.length; i++)
        ok = ok && (macCalcBytes[i] === macBytes[i]);
    if (!ok)
        throw new Error('HMAC verification failed');
    const iv = msg.slice(1 + 8, 1 + 8 + 16);
    const ct = msg.slice(1 + 8 + 16);
    const pt = CryptoJS.AES.decrypt({ ciphertext: wordArrayFrom(ct) }, wordArrayFrom(encKey), { iv: wordArrayFrom(iv), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    const plain = CryptoJS.enc.Utf8.stringify(pt);
    return plain;
}
export function looksLikeFernetToken(s) {
    return /^[A-Za-z0-9_-]{80,}$/.test(s) && s.startsWith('gA');
}
