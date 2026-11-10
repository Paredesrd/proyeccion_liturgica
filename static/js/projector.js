import * as Engine from './projector_engine.js';

let ws = null;
let lastRenderedState = { action: 'clear' };

const urlParams = new URLSearchParams(window.location.search);
const isMonitor = urlParams.get('monitor') === 'true';

if (isMonitor) {
    document.body.classList.add('is-monitor');
    document.addEventListener('scroll', (e) => {
        if(e.target.id === 'content-layer') {
            window.parent.postMessage({ type: 'monitor_scroll', scrollTop: e.target.scrollTop }, '*');
        }
    }, true);
}

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsPath = isMonitor ? '/ws/preview' : '/ws/live';
    ws = new WebSocket(`${protocol}//${window.location.host}${wsPath}`);

    ws.onopen = () => console.log(`✅ Conectado [Canal: ${wsPath}]`);
    ws.onclose = () => { setTimeout(connectWebSocket, 1000); };
    ws.onerror = (e) => console.error('❌ Error WS:', e);

    ws.onmessage = (event) => {
        try {
            const cmd = JSON.parse(event.data);
            lastRenderedState = cmd;
            executeCommand(cmd, false);
        } catch (e) { console.error('Fallo comando:', e); }
    };
}

function executeCommand(cmd, isReconnect = false) {
    switch (cmd.action) {
        case 'sync_scene':
            console.log('🔄 Sincronizando escena desde servidor...');
            if (cmd.state.blackout) Engine.DOM.blackoutLayer.style.display = 'block';
            else Engine.DOM.blackoutLayer.style.display = 'none';
            
            if (cmd.state.background) Engine.setBackground(cmd.state.background.type, cmd.state.background.src, cmd.state.background.color);
            
            if (cmd.state.audio) {
                if (cmd.state.audio.action === 'play_media') {
                    Engine.DOM.bgAudio.src = cmd.state.audio.src;
                    Engine.DOM.bgAudio.play().catch(e => console.error('Bloqueo audio:', e));
                } else {
                    Engine.DOM.bgAudio.pause();
                    Engine.DOM.bgAudio.removeAttribute('src');
                }
            }
            if (cmd.state.text) Engine.setText(cmd.state.text.title, cmd.state.text.text, cmd.state.text.variant);
            break;
        case 'set_module': Engine.resetModuleState(); break;
        case 'set_text': Engine.setText(cmd.title, cmd.text, cmd.variant); break;
        case 'show_bible_verse': Engine.showBibleVerse(cmd.reference, cmd.text, cmd.version); break;
        case 'set_background': Engine.setBackground(cmd.type, cmd.src, cmd.color); break;
        case 'play_media':
            if (cmd.type === 'audio') {
                Engine.DOM.bgAudio.src = cmd.src;
                Engine.DOM.bgAudio.volume = cmd.volume !== undefined ? cmd.volume : 1.0;
                Engine.DOM.bgAudio.muted = cmd.muted || false;
                Engine.DOM.bgAudio.play().catch(e => console.error('Audio bloqueado:', e));
            }
            break;
        case 'stop_media':
            Engine.DOM.bgAudio.pause();
            Engine.DOM.bgAudio.removeAttribute('src');
            Engine.DOM.bgAudio.load();
            Engine.DOM.bgVideo.pause();
            Engine.DOM.bgVideo.removeAttribute('src');
            Engine.DOM.bgVideo.load();
            Engine.DOM.bgVideo.style.display = 'none';
            break;
        case 'load_birthdays': Engine.loadBirthdaysToDisplay(cmd.cumpleanos || [], cmd.title, cmd.text); break;
        case 'load_anuncios': Engine.loadAnunciosToDisplay(cmd.anuncios || [], cmd.title, cmd.text); break;
        case 'blackout':
            Engine.DOM.blackoutLayer.style.display = 'block';
            Engine.DOM.bgAudio.pause();
            break;
        case 'clear':
            Engine.DOM.blackoutLayer.style.display = 'none';
            Engine.DOM.bgAudio.pause();
            Engine.DOM.bgAudio.currentTime = 0;
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
    Engine.setBackground('color', '', '#000000');
    connectWebSocket();
});