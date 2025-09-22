// src/lib/encryption.ts
// 處理敏感資料和密碼的加解密功能
// 改為完全使用瀏覽器端加解密（CryptoJS），不使用 WebCrypto、不呼叫 /api/fernet
import { fernetEncrypt as clientFernetEncrypt, fernetDecrypt as clientFernetDecrypt } from '@/lib/fernet_client';
/**
 * 加密國民身份證號 (使用 VITE_KOALA_SENSITIVE_KEY)
 */
export async function encryptNationalId(nationalId) {
    var _a, _b, _c;
    const sensitiveKey = ((_b = (_a = import.meta) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.VITE_KOALA_SENSITIVE_KEY) || ((_c = globalThis === null || globalThis === void 0 ? void 0 : globalThis.CONFIG) === null || _c === void 0 ? void 0 : _c.KOALA_SENSITIVE_KEY);
    if (!sensitiveKey)
        throw new Error('Missing VITE_KOALA_SENSITIVE_KEY for client-side encryption');
    return clientFernetEncrypt(nationalId, sensitiveKey);
}
/**
 * 解密國民身份證號 (使用 VITE_KOALA_SENSITIVE_KEY)
 */
export async function decryptNationalId(encryptedNationalId) {
    var _a, _b, _c;
    const sensitiveKey = ((_b = (_a = import.meta) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.VITE_KOALA_SENSITIVE_KEY) || ((_c = globalThis === null || globalThis === void 0 ? void 0 : globalThis.CONFIG) === null || _c === void 0 ? void 0 : _c.KOALA_SENSITIVE_KEY);
    if (!sensitiveKey)
        return encryptedNationalId;
    try {
        return clientFernetDecrypt(encryptedNationalId, sensitiveKey);
    }
    catch (_d) {
        return encryptedNationalId;
    }
}
/**
 * 加密密碼 (登入使用 VITE_KOALA_LOGIN_KEY，註冊/更新使用 VITE_KOALA_SENSITIVE_KEY)
 */
export async function encryptPassword(password, useForRegistration = false) {
    var _a, _b, _c, _d;
    const rt = (globalThis === null || globalThis === void 0 ? void 0 : globalThis.CONFIG) || {};
    const key = useForRegistration
        ? (rt.KOALA_SENSITIVE_KEY || ((_b = (_a = import.meta) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.VITE_KOALA_SENSITIVE_KEY))
        : (rt.KOALA_LOGIN_KEY || ((_d = (_c = import.meta) === null || _c === void 0 ? void 0 : _c.env) === null || _d === void 0 ? void 0 : _d.VITE_KOALA_LOGIN_KEY));
    if (!key)
        throw new Error('Missing Fernet key for client-side encryption');
    return clientFernetEncrypt(password, key);
}
/**
 * 檢查字串是否看起來像是加密的資料
 */
export function looksEncrypted(value) {
    // Fernet token 的基本特徵：base64url 編碼，通常以 'gAAAAA' 開頭
    return /^[A-Za-z0-9_-]+={0,2}$/.test(value) &&
        value.length > 50 &&
        value.startsWith('gAAAAA');
}
/**
 * 遮罩敏感資料用於顯示 (例如：A123456789 -> A123****89)
 */
export function maskNationalId(nationalId) {
    if (!nationalId || nationalId.length < 6)
        return nationalId;
    const start = nationalId.slice(0, 4);
    const end = nationalId.slice(-2);
    const middle = '*'.repeat(Math.max(0, nationalId.length - 6));
    return `${start}${middle}${end}`;
}
/**
 * 遮罩手機號碼 (例如：0987654321 -> 0987****21)
 */
export function maskPhone(phone) {
    if (!phone || phone.length < 6)
        return phone;
    const start = phone.slice(0, 4);
    const end = phone.slice(-2);
    const middle = '*'.repeat(Math.max(0, phone.length - 6));
    return `${start}${middle}${end}`;
}
