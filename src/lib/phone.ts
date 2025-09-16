// src/lib/phone.ts
// 手機號碼格式處理工具

/**
 * 將台灣手機號碼轉換為國際格式
 * @param phone 原始手機號碼 (例如: 0912345678)
 * @returns 國際格式手機號碼 (例如: +886912345678)
 */
export function formatPhoneToInternational(phone: string): string {
  if (!phone) return phone
  
  // 移除所有空格和特殊字符
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  // 如果已經是國際格式，直接返回
  if (cleaned.startsWith('+886')) {
    return cleaned
  }
  
  // 如果以 0 開頭，轉換為國際格式
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+886${cleaned.substring(1)}`
  }
  
  // 如果以 886 開頭，加上 +
  if (cleaned.startsWith('886') && cleaned.length === 12) {
    return `+${cleaned}`
  }
  
  // 如果是 9 位數字，假設已經去掉了國碼和 0
  if (/^9\d{8}$/.test(cleaned)) {
    return `+886${cleaned}`
  }
  
  // 其他情況直接返回（可能是其他國家的號碼）
  return phone
}

/**
 * 驗證手機號碼格式是否正確
 * @param phone 手機號碼
 * @returns 是否為有效格式
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return true // 允許空值
  
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  // 支援的格式：
  // +886912345678 (國際格式)
  // 0912345678 (本地格式)
  // 886912345678 (國碼格式)
  // 912345678 (精簡格式)
  const patterns = [
    /^\+886[9]\d{8}$/, // +886912345678
    /^0[9]\d{8}$/,     // 0912345678
    /^886[9]\d{8}$/,   // 886912345678
    /^[9]\d{8}$/       // 912345678
  ]
  
  return patterns.some(pattern => pattern.test(cleaned))
}

/**
 * 格式化手機號碼用於顯示
 * @param phone 原始手機號碼
 * @returns 格式化後的手機號碼 (例如: 0912-345-678)
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return phone
  
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  // 如果是國際格式 +886912345678，轉換為本地顯示格式
  if (cleaned.startsWith('+886') && cleaned.length === 13) {
    const localNumber = '0' + cleaned.substring(4)
    return `${localNumber.substring(0, 4)}-${localNumber.substring(4, 7)}-${localNumber.substring(7)}`
  }
  
  // 如果是本地格式 0912345678，格式化顯示
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 7)}-${cleaned.substring(7)}`
  }
  
  // 其他格式直接返回
  return phone
}