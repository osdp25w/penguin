// src/lib/http-interceptor.ts
// HTTP 請求攔截器，自動處理 Token Refresh
// 追蹤正在進行的 refresh 請求，避免並發 refresh
let isRefreshing = false;
let failedQueue = [];
const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        }
        else {
            resolve(token);
        }
    });
    failedQueue = [];
};
/**
 * 創建一個支援自動 token refresh 的 fetch 包裝器
 */
export function createAuthenticatedFetch() {
    return async function authenticatedFetch(url, options = {}) {
        // 延遲引入 auth store 避免循環依賴
        const { useAuth } = await import('@/stores/auth');
        const auth = useAuth();
        // 確保有有效的 token
        let token;
        try {
            token = await auth.ensureValidToken();
        }
        catch (error) {
            // 如果無法獲得有效 token，直接發送請求
            console.warn('[HTTP] No valid token available:', error);
            return fetch(url, options);
        }
        // 添加 Authorization header
        const headers = new Headers(options.headers);
        headers.set('Authorization', `Bearer ${token}`);
        const requestOptions = {
            ...options,
            headers
        };
        // 發送請求
        let response = await fetch(url, requestOptions);
        // 如果收到 401，嘗試 refresh token
        if (response.status === 401) {
            console.log('[HTTP] Received 401, attempting token refresh...');
            // 如果已經在 refresh，等待完成
            if (isRefreshing) {
                console.log('[HTTP] Token refresh in progress, waiting...');
                try {
                    const newToken = await new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    });
                    // 用新 token 重試
                    headers.set('Authorization', `Bearer ${newToken}`);
                    response = await fetch(url, { ...requestOptions, headers });
                }
                catch (error) {
                    console.error('[HTTP] Failed to get refreshed token:', error);
                    return response; // 返回原始 401 回應
                }
            }
            else {
                // 開始 refresh
                isRefreshing = true;
                try {
                    // 延遲引入避免循環依賴
                    const { useAuth } = await import('@/stores/auth');
                    const authStore = useAuth();
                    await authStore.refreshTokens();
                    const newToken = authStore.accessToken;
                    if (newToken) {
                        processQueue(null, newToken);
                        // 用新 token 重試請求
                        headers.set('Authorization', `Bearer ${newToken}`);
                        response = await fetch(url, { ...requestOptions, headers });
                    }
                    else {
                        throw new Error('No new token after refresh');
                    }
                }
                catch (error) {
                    console.error('[HTTP] Token refresh failed:', error);
                    processQueue(error, null);
                    // 返回原始 401 回應
                }
                finally {
                    isRefreshing = false;
                }
            }
        }
        return response;
    };
}
/**
 * 全域安裝 fetch 攔截器
 */
export function installFetchInterceptor() {
    // 保存原始 fetch
    const originalFetch = globalThis.fetch;
    // 創建增強版 fetch
    const authenticatedFetch = createAuthenticatedFetch();
    // 覆蓋全域 fetch
    globalThis.fetch = async (url, options) => {
        // 檢查是否為 API 請求 (需要認證)
        const urlString = typeof url === 'string' ? url : url.toString();
        if (urlString.includes('/api/') &&
            !urlString.includes('/api/account/auth/login') &&
            !urlString.includes('/api/account/auth/refresh') &&
            !urlString.includes('/api/account/register')) {
            // 使用認證版本的 fetch
            return authenticatedFetch(url, options);
        }
        // 其他請求使用原始 fetch
        return originalFetch(url, options);
    };
    console.log('[HTTP] Fetch interceptor installed');
    // 返回清理函數
    return () => {
        globalThis.fetch = originalFetch;
        console.log('[HTTP] Fetch interceptor removed');
    };
}
/**
 * 手動創建需要認證的請求
 */
export const authenticatedRequest = {
    async get(url, options = {}) {
        const fetch = createAuthenticatedFetch();
        const response = await fetch(url, { ...options, method: 'GET' });
        return response;
    },
    async post(url, body, options = {}) {
        const fetch = createAuthenticatedFetch();
        const headers = new Headers(options.headers);
        if (body && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
        const response = await fetch(url, {
            ...options,
            method: 'POST',
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        return response;
    },
    async patch(url, body, options = {}) {
        const fetch = createAuthenticatedFetch();
        const headers = new Headers(options.headers);
        if (body && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
        const response = await fetch(url, {
            ...options,
            method: 'PATCH',
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        return response;
    },
    async put(url, body, options = {}) {
        const fetch = createAuthenticatedFetch();
        const headers = new Headers(options.headers);
        if (body && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
        const response = await fetch(url, {
            ...options,
            method: 'PUT',
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        return response;
    },
    async delete(url, options = {}) {
        const fetch = createAuthenticatedFetch();
        const response = await fetch(url, { ...options, method: 'DELETE' });
        return response;
    }
};
