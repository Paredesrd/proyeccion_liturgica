export let ws = null;
export let currentWsModule = null;

// Cola de comandos para tolerancia a fallos de red
const commandQueue = [];

export function initWebSocket(statusElementId) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/control`;
    const statusEl = document.getElementById(statusElementId);

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        if (statusEl) {
            statusEl.textContent = 'Conectado (Sync Activa)';
            statusEl.className = 'badge bg-success p-2 fs-6 shadow-sm';
        }
        console.log('✅ Capa de transporte WebSocket restablecida y estable');

        // Procesar cola de comandos retenidos
        while (commandQueue.length > 0) {
            const payload = commandQueue.shift();
            ws.send(JSON.stringify(payload));
            console.log('📤 Comando desencolado y transmitido:', payload.action);
        }
    };

    ws.onclose = () => {
        if (statusEl) {
            statusEl.textContent = 'Falla de Red. Reconectando...';
            statusEl.className = 'badge bg-danger text-white p-2 fs-6 shadow-sm';
        }
        console.warn('⚠️ Transporte desconectado. Intentando reconexión automática...');
        setTimeout(() => initWebSocket(statusElementId), 2000);
    };

    ws.onerror = (error) => {
        console.error('❌ Incidencia en socket de transporte:', error);
    };
}

export function setWsActiveModule(moduleName) {
    currentWsModule = moduleName;
}

export function sendCommand(action, data = {}) {
    const payload = { action, module: currentWsModule, ...data };

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
        console.log('📤 Comando inyectado en bus:', action);
    } else {
        console.warn(`⚠️ Enlace caído. Comando '${action}' retenido en cola local.`);
        commandQueue.push(payload);
    }
}