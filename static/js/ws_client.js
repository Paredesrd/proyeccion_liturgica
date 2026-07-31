export let ws = null;
export let currentWsModule = null;

export function initWebSocket(statusElementId) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/control`;
    const statusEl = document.getElementById(statusElementId);

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        if (statusEl) {
            statusEl.textContent = 'Conectado';
            statusEl.className = 'badge bg-success p-2 fs-6';
        }
        console.log('✅ Capa de transporte WebSocket restablecida y estable');
    };

    ws.onclose = () => {
        if (statusEl) {
            statusEl.textContent = 'Reconectando...';
            statusEl.className = 'badge bg-warning text-dark p-2 fs-6';
        }
        console.warn('⚠️ Transporte desconectado. Intentando reconexión automática en curso...');
        setTimeout(() => initWebSocket(statusElementId), 1500);
    };

    ws.onerror = (error) => {
        console.error('❌ Incidencia en socket de transporte:', error);
    };
}

export function setWsActiveModule(moduleName) {
    currentWsModule = moduleName;
}

export function sendCommand(action, data = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const payload = { action, module: currentWsModule, ...data };
        ws.send(JSON.stringify(payload));
        console.log('📤 Comando inyectado en bus:', action, data);
    } else {
        console.warn('⚠️ Enlace temporalmente ocupado. Reintentando envío en cola...');
        setTimeout(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                const payload = { action, module: currentWsModule, ...data };
                ws.send(JSON.stringify(payload));
                console.log('📤 Comando recuperado y enviado:', action, data);
            } else {
                alert('Fallo crítico de transmisión. Compruebe la estabilidad de la red local.');
            }
        }, 500);
    }
}