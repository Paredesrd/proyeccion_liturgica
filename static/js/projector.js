let ws = null;

const bgImage = document.getElementById('bg-image');
const bgVideo = document.getElementById('bg-video');
const bgSolidColor = document.getElementById('bg-solid-color');
const mainTitle = document.getElementById('main-title');
const mainText = document.getElementById('main-text');
const lyricsContainer = document.getElementById('lyrics-container');
const birthdayList = document.getElementById('birthday-list');
const bgAudio = document.getElementById('bg-audio');
const blackoutLayer = document.getElementById('blackout-layer');

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/projector`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log('Proyector conectado al servidor de control.');
    ws.onclose = () => setTimeout(connectWebSocket, 3000);

    ws.onmessage = (event) => {
        try {
            executeCommand(JSON.parse(event.data));
        } catch (e) {
            console.error('Error al procesar comando:', e);
        }
    };
}

function executeCommand(cmd) {
    switch (cmd.action) {
        case 'set_module':
            clearContent();
            break;

        case 'set_text':
            mainTitle.textContent = cmd.title || '';
            mainText.textContent = cmd.text || '';
            mainText.style.whiteSpace = 'pre-line';
            break;

        case 'show_bible_verse':
            hideAllBackgrounds();
            bgSolidColor.style.backgroundColor = '#0a0a0a'; // Fondo casi negro elegante
            bgSolidColor.style.display = 'block';

            mainTitle.textContent = cmd.reference;
            mainTitle.style.color = '#fbbf24'; // Color dorado para la referencia
            mainTitle.style.fontSize = '4rem';

            mainText.textContent = `"${cmd.text}"`;
            mainText.style.fontSize = '2.8rem';
            mainText.style.lineHeight = '1.5';
            mainText.style.fontWeight = '300';
            mainText.style.whiteSpace = 'pre-line';

            // Pequeña etiqueta de versión
            const versionLabel = document.createElement('div');
            versionLabel.textContent = cmd.version;
            versionLabel.style.position = 'absolute';
            versionLabel.style.bottom = '40px';
            versionLabel.style.right = '60px';
            versionLabel.style.fontSize = '1.5rem';
            versionLabel.style.color = '#666';
            versionLabel.style.fontStyle = 'italic';

            // Limpiar etiquetas anteriores si existen
            const oldLabel = document.getElementById('bible-version-label');
            if (oldLabel) oldLabel.remove();
            versionLabel.id = 'bible-version-label';
            document.getElementById('content-layer').appendChild(versionLabel);
            break;

        case 'set_background':
            hideAllBackgrounds();
            if (cmd.type === 'image') {
                bgImage.src = cmd.src;
                bgImage.style.display = 'block';
            } else if (cmd.type === 'video') {
                bgVideo.src = cmd.src;
                bgVideo.style.display = 'block';
                bgVideo.play().catch(e => console.error('Error video:', e));
            } else if (cmd.type === 'color') {
                bgSolidColor.style.backgroundColor = cmd.color || '#000';
                bgSolidColor.style.display = 'block';
            }
            break;

        case 'play_media':
            if (cmd.type === 'audio') {
                bgAudio.src = cmd.src;
                bgAudio.volume = cmd.volume !== undefined ? cmd.volume : 1.0;
                bgAudio.play().catch(e => console.error('Error audio:', e));
            }
            break;

        case 'stop_media':
            bgAudio.pause();
            bgVideo.pause();
            break;

        case 'load_birthdays':
            birthdayList.innerHTML = `
                <div class="birthday-item">🎉 Juan Pérez - Hoy</div>
                <div class="birthday-item">🎉 María García - Mañana</div>
            `;
            mainTitle.textContent = '¡Feliz Cumpleaños!';
            mainTitle.style.color = '#ffffff';
            mainText.textContent = '';
            break;

        case 'blackout':
            blackoutLayer.style.display = 'block';
            bgAudio.pause();
            bgVideo.pause();
            break;

        case 'clear':
            blackoutLayer.style.display = 'none';
            clearContent();
            hideAllBackgrounds();
            bgSolidColor.style.display = 'block';
            break;
    }
}

function clearContent() {
    mainTitle.textContent = '';
    mainText.textContent = '';
    lyricsContainer.innerHTML = '';
    birthdayList.innerHTML = '';
    const oldLabel = document.getElementById('bible-version-label');
    if (oldLabel) oldLabel.remove();
}

function hideAllBackgrounds() {
    bgImage.style.display = 'none';
    bgVideo.style.display = 'none';
    bgSolidColor.style.display = 'none';
    bgVideo.pause();
}

document.addEventListener('DOMContentLoaded', connectWebSocket);