// src/lib/encryption.ts
// 處理敏感資料和密碼的加解密功能
// 完全使用伺服器端加解密，不使用 WebCrypto
/**
 * 加密國民身份證號 (使用 VITE_KOALA_SENSITIVE_KEY)
 */
export async function encryptNationalId(nationalId) {
    var _a, _b;
    const sensitiveKey = (_b = (_a = import.meta) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.VITE_KOALA_SENSITIVE_KEY;
    // 在生產環境中，不需要前端的 sensitiveKey（伺服器端會使用自己的 key）
    if (import.meta.env.DEV && !sensitiveKey) {
        throw new Error('VITE_KOALA_SENSITIVE_KEY not configured in development');
    }
    try {
        // 強制使用伺服器端加密 (禁用 WebCrypto)
        const endpoint = import.meta.env.DEV ? '/local/fernet' : '/api/fernet/encrypt';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: nationalId,
                key: import.meta.env.DEV ? sensitiveKey : undefined // 生產環境使用伺服器端的 key
            })
        });
        if (!response.ok) {
            throw new Error(`Server encryption failed: ${response.status}`);
        }
        const data = await response.json();
        if (!data.token) {
            throw new Error('Server returned no token');
        }
        return data.token;
    }
    catch (error) {
        console.error('Failed to encrypt national ID:', error);
        throw new Error('無法加密身份證號 - 伺服器加密端點不可用');
    }
}
/**
 * 解密國民身份證號 (使用 VITE_KOALA_SENSITIVE_KEY)
 */
export async function decryptNationalId(encryptedNationalId) {
    var _a, _b;
    const sensitiveKey = (_b = (_a = import.meta) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.VITE_KOALA_SENSITIVE_KEY;
    // 在生產環境中，不需要前端的 sensitiveKey（伺服器端會使用自己的 key）
    if (import.meta.env.DEV && !sensitiveKey) {
        throw new Error('VITE_KOALA_SENSITIVE_KEY not configured in development');
    }
    try {
        // 強制使用伺服器端解密（與加密邏輯保持一致）
        const endpoint = import.meta.env.DEV ? '/local/fernet/decrypt' : '/api/fernet/decrypt';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tokens: [encryptedNationalId],
                key: import.meta.env.DEV ? sensitiveKey : undefined // 生產環境使用伺服器端的 key
            })
        });
        if (response.ok) {
            const data = await response.json();
            if (data.values && data.values[0]) {
                return data.values[0];
            }
        }
        // 如果解密失敗，拋出錯誤
        throw new Error('Server decryption failed');
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
    // 在生產環境中，不需要前端的 loginKey（伺服器端會使用自己的 key）
    if (import.meta.env.DEV && !loginKey) {
        throw new Error('VITE_KOALA_LOGIN_KEY not configured in development');
    }
    try {
        // 強制使用伺服器端加密 (禁用 WebCrypto)
        const endpoint = import.meta.env.DEV ? '/local/fernet' : '/api/fernet/encrypt';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: password,
                key: import.meta.env.DEV ? loginKey : undefined // 生產環境使用伺服器端的 key
            })
        });
        if (!response.ok) {
            throw new Error(`Server encryption failed: ${response.status}`);
        }
        const data = await response.json();
        if (!data.token) {
            throw new Error('Server returned no token');
        }
        return data.token;
    }
    catch (error) {
        console.error('Failed to encrypt password:', error);
        throw new Error('無法加密密碼 - 伺服器加密端點不可用');
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
