let ws = null;

// Elementos DOM cacheados
const bgImage = document.getElementById('bg-image');
const bgVideo = document.getElementById('bg-video');
const bgSolidColor = document.getElementById('bg-solid-color');
const mainTitle = document.getElementById('main-title');
const mainText = document.getElementById('main-text');
const lyricsContainer = document.getElementById('lyrics-container');
const birthdayList = document.getElementById('birthday-list');
const bgAudio = document.getElementById('bg-audio');
const blackoutLayer = document.getElementById('blackout-layer');
const contentLayer = document.getElementById('content-layer');

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/projector`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log('✅ Proyector conectado al servidor de control.');
    ws.onclose = () => {
        console.warn('⚠️ Proyector desconectado. Reconectando...');
        setTimeout(connectWebSocket, 3000);
    };
    ws.onerror = (error) => console.error('❌ Error en WebSocket del proyector:', error);

    ws.onmessage = (event) => {
        try {
            executeCommand(JSON.parse(event.data));
        } catch (e) {
            console.error('Error al procesar comando:', e);
        }
    };
}

function executeCommand(cmd) {
    console.log('📥 Comando recibido:', cmd.action, cmd);
    
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
            showBibleVerse(cmd.reference, cmd.text, cmd.version);
            break;

        case 'set_background':
            setBackground(cmd.type, cmd.src, cmd.color);
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
            loadBirthdaysToDisplay(cmd.birthdays || []);
            break;

        case 'load_anuncios':
            loadAnunciosToDisplay(cmd.anuncios || []);
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

function showBibleVerse(reference, text, version) {
    hideAllBackgrounds();
    bgSolidColor.style.backgroundColor = '#0a0a0a';
    bgSolidColor.style.display = 'block';

    mainTitle.textContent = reference;
    mainTitle.style.color = '#fbbf24';
    mainTitle.style.fontSize = '4rem';

    mainText.textContent = `"${text}"`;
    mainText.style.fontSize = '2.8rem';
    mainText.style.lineHeight = '1.5';
    mainText.style.fontWeight = '300';
    mainText.style.whiteSpace = 'pre-line';

    // Eliminar etiqueta de versión anterior si existe
    const oldLabel = document.getElementById('bible-version-label');
    if (oldLabel) oldLabel.remove();

    // Crear nueva etiqueta de versión
    const versionLabel = document.createElement('div');
    versionLabel.id = 'bible-version-label';
    versionLabel.textContent = version || 'RVR1960';
    versionLabel.style.position = 'absolute';
    versionLabel.style.bottom = '40px';
    versionLabel.style.right = '60px';
    versionLabel.style.fontSize = '1.5rem';
    versionLabel.style.color = '#666';
    versionLabel.style.fontStyle = 'italic';

    contentLayer.appendChild(versionLabel);
}

function setBackground(type, src, color) {
    hideAllBackgrounds();
    
    if (type === 'image' && src) {
        bgImage.src = src;
        bgImage.style.display = 'block';
    } else if (type === 'video' && src) {
        bgVideo.src = src;
        bgVideo.style.display = 'block';
        bgVideo.play().catch(e => console.error('Error video:', e));
    } else if (type === 'color') {
        bgSolidColor.style.backgroundColor = color || '#000';
        bgSolidColor.style.display = 'block';
    }
}

function loadBirthdaysToDisplay(birthdays) {
    if (!birthdays || birthdays.length === 0) {
        birthdayList.innerHTML = '<p class="no-data">No hay cumpleaños esta semana</p>';
        mainTitle.textContent = '¡Feliz Cumpleaños!';
        mainText.textContent = '';
        return;
    }

    // Limpiar contenido previo
    mainTitle.textContent = '🎉 ¡Feliz Cumpleaños!';
    mainTitle.style.color = '#ffffff';
    mainText.textContent = '';
    birthdayList.innerHTML = '';

    // Crear elementos para cada cumpleaños
    birthdays.forEach(cumple => {
        const item = document.createElement('div');
        item.className = 'birthday-item';
        
        let emoji = '🎂';
        let label = '';
        
        if (cumple.es_hoy) {
            emoji = '🎉';
            label = ' - ¡HOY!';
        } else if (cumple.es_manana) {
            emoji = '🎈';
            label = ' - Mañana';
        }
        
        item.innerHTML = `${emoji} <strong>${cumple.nombre}</strong>${label} (${cumple.fecha})`;
        birthdayList.appendChild(item);
    });
}

function loadAnunciosToDisplay(anuncios) {
    if (!anuncios || anuncios.length === 0) {
        mainTitle.textContent = '📢 Anuncios';
        mainText.textContent = 'No hay anuncios activos';
        return;
    }

    // Mostrar el primer anuncio activo
    const anuncio = anuncios[0];
    mainTitle.textContent = '📢 ' + (anuncio.titulo || 'Anuncio');
    mainText.textContent = anuncio.contenido || '';
    mainText.style.whiteSpace = 'pre-line';
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