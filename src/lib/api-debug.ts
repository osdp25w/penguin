// API 除錯輔助工具
export function setupAPIDebugger() {
  if (import.meta.env.DEV) {
    // 攔截 fetch 請求，顯示實際的後端路徑
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const [resource, config] = args;
      const url = typeof resource === 'string' ? resource : resource.url;
      
      // 如果是 /api 請求，顯示實際會打到的後端
      if (url.startsWith('/api')) {
        const actualBackend = 'https://koala.osdp25w.xyz' + url;
        console.group(`🔄 API Request`);
        console.log('Frontend URL:', url);
        console.log('Actual Backend:', actualBackend);
        console.log('Via Nginx Proxy:', 'koala.koala.svc.cluster.local' + url);
        console.groupEnd();
      }
      
      return originalFetch.apply(this, args);
    };
    
    // 在 Network 面板加入自訂 header 顯示
    const addDebugHeaders = (response: Response) => {
      if (response.url.includes('/api')) {
        // 這些 header 只在本地顯示，不會真的發送
        Object.defineProperty(response.headers, 'x-actual-backend', {
          value: 'koala.osdp25w.xyz',
          enumerable: true
        });
        Object.defineProperty(response.headers, 'x-k8s-service', {
          value: 'koala.koala.svc.cluster.local',
          enumerable: true
        });
      }
      return response;
    };
  }
}

// 在 Response Headers 中顯示實際後端資訊
export function addBackendInfoToResponse() {
  if (import.meta.env.DEV) {
    // 建立一個 Proxy 來顯示額外資訊
    const responseProxy = new Proxy(Response.prototype, {
      get(target, prop, receiver) {
        if (prop === 'headers') {
          const headers = Reflect.get(target, prop, receiver);
          // 加入虛擬 header 顯示後端資訊
          return new Proxy(headers, {
            get(headerTarget, headerProp) {
              if (headerProp === 'get') {
                return function(name: string) {
                  if (name === 'x-backend-service') {
                    return 'koala.osdp25w.xyz (via nginx proxy)';
                  }
                  return headerTarget.get(name);
                };
              }
              return Reflect.get(headerTarget, headerProp);
            }
          });
        }
        return Reflect.get(target, prop, receiver);
      }
    });
  }
}