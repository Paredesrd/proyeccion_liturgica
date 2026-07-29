let ws = null;
let currentModule = null;

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/control`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        const statusEl = document.getElementById('connection-status');
        statusEl.textContent = 'Conectado al Proyector';
        statusEl.className = 'status-connected';
    };

    ws.onclose = () => {
        const statusEl = document.getElementById('connection-status');
        statusEl.textContent = 'Desconectado';
        statusEl.className = 'status-disconnected';
        setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
        console.error('Error en WebSocket:', error);
    };
}

function sendCommand(action, data = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const payload = { action, module: currentModule, ...data };
        ws.send(JSON.stringify(payload));
    } else {
        console.warn('WebSocket no está conectado. Comando no enviado:', action);
    }
}

function activateModule(moduleName) {
    currentModule = moduleName;

    document.querySelectorAll('.module-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.module === moduleName) {
            btn.classList.add('active');
        }
    });

    document.getElementById('active-module-name').textContent = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    sendCommand('set_module', { module: moduleName });
    renderDynamicControls(moduleName);
}

function renderDynamicControls(moduleName) {
    const container = document.getElementById('dynamic-controls');
    let html = '';

    if (moduleName === 'inicializacion') {
        html = `
            <button onclick="sendCommand('set_text', { title: 'Bienvenidos', text: 'El servicio comenzará en breve' })">Mostrar Bienvenida</button>
            <button onclick="sendCommand('play_media', { type: 'audio', src: '/static/media/audio/instrumental.mp3', volume: 0.5 })">Iniciar Música de Fondo</button>
        `;
    } else if (moduleName === 'alabanzas') {
        html = `
            <button onclick="sendCommand('set_text', { title: 'Alabanza', text: 'Estrofa 1\\nLetra de la canción aquí' })">Mostrar Estrofa 1</button>
            <button onclick="sendCommand('set_background', { type: 'video', src: '/static/media/backgrounds/worship_loop.mp4' })">Fondo Video Alabanza</button>
        `;
    } else if (moduleName === 'predica') {
        html = `
            <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                <select id="bible-book" style="padding: 10px; font-size: 1rem; border-radius: 4px; border: none;">
                    <option value="Juan">Juan</option>
                    <option value="Salmos">Salmos</option>
                    <option value="Romanos">Romanos</option>
                </select>
                <input type="text" id="bible-chapter" placeholder="Capítulo (ej: 3)" style="padding: 10px; width: 80px; font-size: 1rem; border-radius: 4px; border: none;">
                <button onclick="searchAndProjectBible()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">📖 Proyectar Versículo</button>
            </div>
            <div id="bible-preview" style="background: #2d2d2d; padding: 15px; border-radius: 6px; min-height: 80px; font-style: italic; color: #ccc;"></div>
        `;
    } else if (moduleName === 'cumpleanos') {
        html = `<button onclick="sendCommand('load_birthdays', {})">🎂 Cargar Cumpleaños de la Semana</button>`;
    } else {
        html = `<p>Módulo <strong>${moduleName}</strong> listo para operar.</p>`;
    }

    html = html.replace(/<button/g, '<button style="padding: 0.8rem 1.5rem; margin: 0.5rem 0.5rem 0.5rem 0; font-size: 1rem; cursor: pointer; background: #3b82f6; color: white; border: none; border-radius: 4px;"');
    // Excepción para el botón de buscar que ya tiene sus estilos inline arriba
    html = html.replace('style="padding: 10px 20px; background: #10b981;', 'style="padding: 10px 20px; background: #10b981; margin: 0;');

    container.innerHTML = html;
}

async function searchAndProjectBible() {
    const book = document.getElementById('bible-book').value;
    const chapter = document.getElementById('bible-chapter').value;
    const previewEl = document.getElementById('bible-preview');

    if (!chapter) {
        previewEl.textContent = "Por favor, ingresa un número de capítulo.";
        return;
    }

    previewEl.textContent = "Buscando...";

    try {
        const response = await fetch(`/api/bible/search?libro=${book}&capitulo=${chapter}&version=RVR1960`);
        const data = await response.json();

        if (data.error) {
            previewEl.textContent = `Error: ${data.error}`;
            return;
        }

        previewEl.textContent = `${data.referencia} (${data.version})\n\n${data.texto}`;

        // Enviar al proyector inmediatamente
        sendCommand('show_bible_verse', {
            reference: data.referencia,
            version: data.version,
            text: data.texto
        });
    } catch (error) {
        previewEl.textContent = "Error de conexión al buscar.";
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', connectWebSocket);