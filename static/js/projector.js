import * as Engine from './projector_engine.js';

let ws = null;
let lastRenderedState = { action: 'clear' };

const urlParams = new URLSearchParams(window.location.search);
const isMonitor = urlParams.get('monitor') === 'true';

if (isMonitor) {
    document.body.classList.add('is-monitor');

    document.addEventListener('scroll', (e) => {
        if(e.target.id === 'content-layer') {
            window.parent.postMessage({
                type: 'monitor_scroll',
                scrollTop: e.target.scrollTop
            }, '*');
        }
    }, true);
}

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/projector`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('✅ Enlace de proyección establecido.');
        if (lastRenderedState) {
            executeCommand(lastRenderedState, true);
        }
    };

    ws.onclose = () => {
        console.warn('⚠️ Conexión interrumpida. Reintentando reconexión en 1 segundo...');
        setTimeout(connectWebSocket, 1000);
    };

    ws.onerror = (error) => {
        console.error('❌ Error de red en capa WebSocket del proyector:', error);
    };

    ws.onmessage = (event) => {
        try {
            const cmd = JSON.parse(event.data);
            lastRenderedState = cmd;
            executeCommand(cmd, false);
        } catch (e) {
            console.error('Fallo en el procesamiento del comando:', e);
        }
    };
}

function executeCommand(cmd, isReconnect = false) {
    if (!isReconnect) console.log('📥 Ejecutando comando:', cmd.action, cmd);

    switch (cmd.action) {
        case 'set_module':
            Engine.resetModuleState();
            break;
        case 'set_text':
            Engine.setText(cmd.title, cmd.text, cmd.variant);
            break;
        case 'show_bible_verse':
            Engine.showBibleVerse(cmd.reference, cmd.text, cmd.version);
            break;
        case 'set_background':
            Engine.setBackground(cmd.type, cmd.src, cmd.color);
            break;
        case 'play_media':
            if (cmd.type === 'audio') {
                if (isMonitor) {
                    Engine.DOM.bgAudio.src = cmd.src;
                    Engine.DOM.bgAudio.volume = cmd.volume !== undefined ? cmd.volume : 1.0;
                    Engine.DOM.bgAudio.muted = cmd.muted || false;
                    Engine.DOM.bgAudio.play().catch(e => console.error('Bloqueo de audio:', e));
                } else {
                    Engine.DOM.bgAudio.pause();
                }
            }
            break;
        case 'toggle_mute':
            if (isMonitor) {
                Engine.DOM.bgAudio.muted = cmd.mute;
                console.log(`Audio en control ${cmd.mute ? 'silenciado' : 'activado'}`);
            }
            break;
        case 'stop_media':
            Engine.DOM.bgAudio.pause();
            Engine.DOM.bgVideo.pause();
            break;
        case 'load_birthdays':
            // CORRECCIÓN: El emisor envía cmd.cumpleanos, el receptor debe leer cmd.cumpleanos
            Engine.loadBirthdaysToDisplay(cmd.cumpleanos || [], cmd.title, cmd.text);
            break;
        case 'load_anuncios':
            Engine.loadAnunciosToDisplay(cmd.anuncios || [], cmd.title, cmd.text);
            break;
        case 'blackout':
            Engine.DOM.blackoutLayer.style.display = 'block';
            Engine.DOM.bgAudio.pause();
            Engine.DOM.bgVideo.pause();
            break;
        case 'clear':
            Engine.DOM.blackoutLayer.style.display = 'none';
            Engine.clearContent();
            break;
        case 'sync_scroll':
            if (!isMonitor) {
                const layer = document.getElementById('content-layer');
                if (layer) layer.scrollTop = cmd.scrollTop;
            }
            break;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    Engine.initDOM();

    const savedBgType = localStorage.getItem('global_current_bg_type') || 'color';
    const savedBgSrc = localStorage.getItem('global_current_bg_src') || '';
    const savedBgColor = localStorage.getItem('global_current_bg_color') || '#000000';

    Engine.setBackground(savedBgType, savedBgSrc, savedBgColor);
    connectWebSocket();
});