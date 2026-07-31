export const DOM = {};

export function initDOM() {
    DOM.bgImage = document.getElementById('bg-image');
    DOM.bgVideo = document.getElementById('bg-video');
    DOM.bgSolidColor = document.getElementById('bg-solid-color');
    DOM.mainTitle = document.getElementById('main-title');
    DOM.mainText = document.getElementById('main-text');
    DOM.lyricsContainer = document.getElementById('lyrics-container');
    DOM.birthdayList = document.getElementById('birthday-list');
    DOM.bgAudio = document.getElementById('bg-audio');
    DOM.blackoutLayer = document.getElementById('blackout-layer');
    DOM.contentLayer = document.getElementById('content-layer');
}

export function hideAllBackgrounds() {
    DOM.bgImage.style.display = 'none';
    DOM.bgVideo.style.display = 'none';
    DOM.bgSolidColor.style.display = 'none';
    DOM.bgVideo.pause();
}

export function setText(title, text, variant) {
    DOM.mainTitle.textContent = title || '';
    DOM.mainText.textContent = text || '';
    DOM.mainText.style.whiteSpace = 'pre-line';

    // Purga de alteraciones locales heredadas de módulos colindantes
    DOM.mainTitle.style.color = '';

    DOM.contentLayer.classList.remove('init-layout', 'saludo-layout', 'predica-layout');

    if (variant === 'init') {
        DOM.contentLayer.classList.add('init-layout');
    } else if (variant === 'saludo') {
        DOM.contentLayer.classList.add('saludo-layout');
    } else if (variant === 'predica') {
        DOM.contentLayer.classList.add('predica-layout');
    }
}

export function clearContent() {
    DOM.mainTitle.textContent = '';
    DOM.mainText.textContent = '';
    DOM.lyricsContainer.innerHTML = '';
    DOM.birthdayList.innerHTML = '';
    DOM.mainTitle.style.color = '';
    DOM.contentLayer.classList.remove('init-layout', 'saludo-layout', 'predica-layout');

    const oldLabel = document.getElementById('bible-version-label');
    if (oldLabel) oldLabel.remove();
}

export function resetModuleState() {
    clearContent();
    DOM.bgAudio.pause();
    DOM.bgAudio.currentTime = 0;
    DOM.blackoutLayer.style.display = 'none';
}

export function showBibleVerse(reference, text, version) {
    DOM.contentLayer.classList.remove('init-layout', 'saludo-layout', 'predica-layout');

    DOM.mainTitle.textContent = reference;
    DOM.mainTitle.style.color = '#fbbf24';

    DOM.mainText.textContent = `"${text}"`;
    DOM.mainText.style.whiteSpace = 'pre-line';

    const oldLabel = document.getElementById('bible-version-label');
    if (oldLabel) oldLabel.remove();

    const versionLabel = document.createElement('div');
    versionLabel.id = 'bible-version-label';
    versionLabel.textContent = version || 'RVR1960';
    versionLabel.style.position = 'absolute';
    versionLabel.style.bottom = '2vh';
    versionLabel.style.right = '2vw';
    versionLabel.style.fontSize = 'min(2.5vw, 4vh)';
    versionLabel.style.color = '#666';
    versionLabel.style.fontStyle = 'italic';

    DOM.contentLayer.appendChild(versionLabel);
}

export function setBackground(type, src, color) {
    if (type === 'image' && src) {
        if (DOM.bgImage.src.endsWith(src) && DOM.bgImage.style.display === 'block') return;

        hideAllBackgrounds();
        DOM.bgImage.src = src;
        DOM.bgImage.style.display = 'block';

    } else if (type === 'video' && src) {
        if (DOM.bgVideo.src.endsWith(src) && DOM.bgVideo.style.display === 'block') return;

        hideAllBackgrounds();
        DOM.bgVideo.src = src;
        DOM.bgVideo.load();
        DOM.bgVideo.style.display = 'block';

        const playPromise = DOM.bgVideo.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.error('Fallo en reproducción nativa:', e));
        }

    } else if (type === 'color') {
        hideAllBackgrounds();
        DOM.bgSolidColor.style.backgroundColor = color || '#000';
        DOM.bgSolidColor.style.display = 'block';
    } else {
        hideAllBackgrounds();
    }
}

export function loadBirthdaysToDisplay(birthdays) {
    if (!birthdays || birthdays.length === 0) {
        DOM.birthdayList.innerHTML = '<p class="no-data">Ausencia de registros para esta semana</p>';
        DOM.mainTitle.textContent = '¡Feliz Cumpleaños!';
        DOM.mainText.textContent = '';
        return;
    }

    DOM.mainTitle.textContent = '🎉 ¡Feliz Cumpleaños!';
    DOM.mainTitle.style.color = '#ffffff';
    DOM.mainText.textContent = '';
    DOM.birthdayList.innerHTML = '';

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

        item.innerHTML = `${emoji} <strong>${cumple.nombre}</strong>${label} <span style="color: #fbbf24;">(${cumple.fecha})</span>`;
        DOM.birthdayList.appendChild(item);
    });
}

export function loadAnunciosToDisplay(anuncios) {
    if (!anuncios || anuncios.length === 0) {
        DOM.mainTitle.textContent = '📢 Anuncios';
        DOM.mainText.textContent = 'Sin datos operativos';
        return;
    }

    const anuncio = anuncios[0];
    DOM.mainTitle.textContent = '📢 ' + (anuncio.titulo || 'Anuncio');
    DOM.mainText.textContent = anuncio.contenido || '';
    DOM.mainText.style.whiteSpace = 'pre-line';
}