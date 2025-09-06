// src/lib/encryption.ts
// 處理敏感資料和密碼的加解密功能
import { fernetEncrypt, fernetDecrypt } from './fernet';
/**
 * 加密國民身份證號 (使用 VITE_KOALA_SENSITIVE_KEY)
 */
export async function encryptNationalId(nationalId) {
    var _a, _b;
    const sensitiveKey = (_b = (_a = import.meta) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.VITE_KOALA_SENSITIVE_KEY;
    if (!sensitiveKey) {
        throw new Error('VITE_KOALA_SENSITIVE_KEY not configured');
    }
    try {
        // 在開發環境優先使用本地端點
        if (import.meta.env.DEV) {
            const response = await fetch('/local/fernet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: nationalId,
                    key: sensitiveKey // 使用敏感資料金鑰
                })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.token)
                    return data.token;
            }
        }
        // 回退到 WebCrypto
        return await fernetEncrypt(nationalId, sensitiveKey);
    }
    catch (error) {
        console.error('Failed to encrypt national ID:', error);
        throw new Error('無法加密身份證號');
    }
}
/**
 * 解密國民身份證號 (使用 VITE_KOALA_SENSITIVE_KEY)
 */
export async function decryptNationalId(encryptedNationalId) {
    var _a, _b;
    const sensitiveKey = (_b = (_a = import.meta) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.VITE_KOALA_SENSITIVE_KEY;
    if (!sensitiveKey) {
        throw new Error('VITE_KOALA_SENSITIVE_KEY not configured');
    }
    try {
        // 在開發環境優先使用本地端點
        if (import.meta.env.DEV) {
            const response = await fetch('/local/fernet/decrypt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokens: [encryptedNationalId],
                    key: sensitiveKey
                })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.values && data.values[0]) {
                    return data.values[0];
                }
            }
        }
        // 回退到 WebCrypto
        return await fernetDecrypt(encryptedNationalId, sensitiveKey);
    }
    catch (error) {
        console.error('Failed to decrypt national ID:', error);
        // 如果解密失敗，返回原文 (可能本來就不是加密的)
        return encryptedNationalId;
    }
}
/**
 * 加密密碼 (使用 VITE_KOALA_LOGIN_KEY)
 */
export async function encryptPassword(password) {
    var _a, _b;
    const loginKey = (_b = (_a = import.meta) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.VITE_KOALA_LOGIN_KEY;
    if (!loginKey) {
        throw new Error('VITE_KOALA_LOGIN_KEY not configured');
    }
    try {
        // 在開發環境優先使用本地端點
        if (import.meta.env.DEV) {
            const response = await fetch('/local/fernet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: password,
                    key: loginKey // 使用登入金鑰
                })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.token)
                    return data.token;
            }
        }
        // 回退到 WebCrypto
        return await fernetEncrypt(password, loginKey);
    }
    catch (error) {
        console.error('Failed to encrypt password:', error);
        throw new Error('無法加密密碼');
    }
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
