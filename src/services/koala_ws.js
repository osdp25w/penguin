import { useAuth } from '@/stores/auth';
import { useToasts } from '@/stores/toasts';
import { useAlerts } from '@/stores/alerts';
import { getKoalaBaseUrl, toWsUrl } from './koala_ws_common';
let socket = null;
let connecting = false;
let reconnectTimer = null;
let connectionStatusCallback = null;
export function setConnectionStatusCallback(cb) {
    connectionStatusCallback = cb;
}
export async function ensureKoalaWsConnected() {
    var _a;
    const auth = useAuth();
    const role = ((_a = auth.user) === null || _a === void 0 ? void 0 : _a.roleId) || sessionStorage.getItem('penguin.role') || localStorage.getItem('penguin.role');
    if (!(role === 'admin' || role === 'staff' || role === 'member')) {
        console.log('[KoalaWS] Skipping WebSocket connection for role:', role);
        connectionStatusCallback === null || connectionStatusCallback === void 0 ? void 0 : connectionStatusCallback(false);
        return;
    }
    if (socket || connecting) {
        if ((socket === null || socket === void 0 ? void 0 : socket.readyState) === WebSocket.OPEN) {
            connectionStatusCallback === null || connectionStatusCallback === void 0 ? void 0 : connectionStatusCallback(true);
        }
        return;
    }
    connecting = true;
    const toasts = useToasts();
    const alerts = useAlerts();
    try {
        console.log('[KoalaWS] Attempting WebSocket connection for role:', role);
        const token = await auth.ensureValidToken().catch(() => auth.accessToken);
        if (!token) {
            connecting = false;
            return;
        }
        const wsUrl = `${toWsUrl(getKoalaBaseUrl())}/ws/bike/error-logs/?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(wsUrl);
        socket = ws;
        ws.onopen = () => {
            toasts.success('Koala 即時連線已建立');
            if (connectionStatusCallback)
                connectionStatusCallback(true);
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
        };
        ws.onclose = () => {
            socket = null;
            toasts.warning('Koala 即時連線中斷，將自動重試...');
            if (connectionStatusCallback)
                connectionStatusCallback(false);
            // auto-reconnect with backoff
            if (!reconnectTimer) {
                reconnectTimer = setTimeout(() => {
                    reconnectTimer = null;
                    ensureKoalaWsConnected();
                }, 3000);
            }
        };
        ws.onerror = () => {
            toasts.error('Koala 即時連線發生錯誤');
            if (connectionStatusCallback)
                connectionStatusCallback(false);
        };
        ws.onmessage = (evt) => {
            try {
                const payload = JSON.parse(evt.data);
                if ((payload === null || payload === void 0 ? void 0 : payload.type) === 'ping') {
                    // reply pong
                    ws.send(JSON.stringify({ type: 'pong' }));
                    return;
                }
                if ((payload === null || payload === void 0 ? void 0 : payload.type) === 'bike_error_log_notification') {
                    const d = payload.data || {};
                    const title = d.title || '車輛異常通知';
                    const bike = d.bike_id || d.bike || 'unknown';
                    const level = (d.level || 'info');
                    // push toast
                    const map = { info: 'info', warning: 'warning', error: 'error', critical: 'error' };
                    useToasts().push(map[level] || 'info', `#${bike} ${title}`, '異常提醒', 6000);
                    // also inject into alert list (best-effort)
                    try {
                        alerts.list.unshift({
                            id: crypto.randomUUID(),
                            siteId: 'unknown',
                            vehicleId: String(bike),
                            type: 'general',
                            message: title,
                            severity: level === 'critical' ? 'critical' : level,
                            resolved: false,
                            createdAt: new Date().toISOString()
                        });
                    }
                    catch (_a) { }
                }
            }
            catch (_b) { }
        };
    }
    finally {
        connecting = false;
    }
}
