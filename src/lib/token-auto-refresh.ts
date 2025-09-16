// src/lib/token-auto-refresh.ts
// 自動 Token 刷新背景服務

let autoRefreshInterval: number | null = null
let isInitialized = false

/**
 * 啟動自動 Token 刷新服務
 * @param intervalMinutes 檢查間隔（分鐘），預設 10 分鐘
 * @param refreshThresholdMinutes token 剩餘時間少於此值時觸發刷新，預設 15 分鐘
 */
export function startAutoRefresh(
  intervalMinutes: number = 10,
  refreshThresholdMinutes: number = 15
) {
  if (isInitialized) {
    console.warn('[TokenAutoRefresh] Service already initialized')
    return
  }

  console.log(`[TokenAutoRefresh] Starting auto refresh service (check every ${intervalMinutes}min, refresh when <${refreshThresholdMinutes}min remaining)`)

  // 立即執行一次檢查
  checkAndRefreshToken(refreshThresholdMinutes)

  // 設置定期檢查
  autoRefreshInterval = window.setInterval(() => {
    checkAndRefreshToken(refreshThresholdMinutes)
  }, intervalMinutes * 60 * 1000) // 轉換為毫秒

  isInitialized = true
}

/**
 * 停止自動 Token 刷新服務
 */
export function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
    autoRefreshInterval = null
  }
  isInitialized = false
  console.log('[TokenAutoRefresh] Service stopped')
}

/**
 * 檢查並刷新 Token（如果需要）
 */
async function checkAndRefreshToken(thresholdMinutes: number) {
  // 延遲引入避免循環依賴
  const { useAuth } = await import('@/stores/auth')
  const auth = useAuth()

  // 如果沒有登入，跳過
  if (!auth.isLogin) {
    return
  }

  try {
    const token = auth.accessToken
    if (!token) {
      console.log('[TokenAutoRefresh] No access token, skipping')
      return
    }

    // 檢查 token 是否即將過期
    if (auth.isTokenExpiringSoon(token, thresholdMinutes)) {
      console.log(`[TokenAutoRefresh] Token expires within ${thresholdMinutes} minutes, refreshing...`)

      await auth.refreshTokens()

      console.log('[TokenAutoRefresh] Token refreshed successfully')
    } else {
      console.log('[TokenAutoRefresh] Token still valid, no refresh needed')
    }
  } catch (error) {
    console.error('[TokenAutoRefresh] Failed to refresh token:', error)
  }
}

/**
 * 手動觸發 Token 檢查和刷新
 */
export function manualRefreshCheck(thresholdMinutes: number = 15) {
  return checkAndRefreshToken(thresholdMinutes)
}

/**
 * 在頁面可見性變化時檢查 Token
 */
export function setupVisibilityChangeRefresh(thresholdMinutes: number = 5) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('[TokenAutoRefresh] Page became visible, checking token...')
      checkAndRefreshToken(thresholdMinutes)
    }
  })
}

/**
 * 獲取服務狀態
 */
export function getAutoRefreshStatus() {
  return {
    isRunning: isInitialized,
    intervalId: autoRefreshInterval
  }
}