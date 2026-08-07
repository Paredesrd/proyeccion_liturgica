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

export function clearContent() {
    DOM.mainTitle.textContent = '';
    DOM.mainText.textContent = '';
    DOM.lyricsContainer.innerHTML = '';
    DOM.birthdayList.innerHTML = '';
    DOM.mainTitle.style.color = '';
    DOM.contentLayer.classList.remove('init-layout', 'saludo-layout', 'predica-layout', 'cenia-layout', 'cumpleanos-layout', 'alabanzas-layout');

    const oldLabel = document.getElementById('bible-version-label');
    if (oldLabel) oldLabel.remove();
}

export function setText(title, text, variant) {
    // PURGA OBLIGATORIA: Destruye las capas de cualquier módulo anterior
    clearContent();

    DOM.mainTitle.textContent = title || '';
    DOM.mainText.textContent = text || '';
    DOM.mainText.style.whiteSpace = 'pre-line';

    if (variant === 'init') {
        DOM.contentLayer.classList.add('init-layout');
    } else if (variant === 'saludo') {
        DOM.contentLayer.classList.add('saludo-layout');
    } else if (variant === 'predica') {
        DOM.contentLayer.classList.add('predica-layout');
    } else if (variant === 'cenia') {
        DOM.contentLayer.classList.add('cenia-layout');
    } else if (variant === 'alabanzas') {
        DOM.contentLayer.classList.add('alabanzas-layout');
    }
}

export function resetModuleState() {
    clearContent();
    DOM.bgAudio.pause();
    DOM.bgAudio.currentTime = 0;
    DOM.blackoutLayer.style.display = 'none';
}

export function showBibleVerse(reference, text, version) {
    // PURGA OBLIGATORIA
    clearContent();

    DOM.mainTitle.textContent = reference;
    DOM.mainTitle.style.color = '#fbbf24';

    DOM.mainText.textContent = `"${text}"`;
    DOM.mainText.style.whiteSpace = 'pre-line';

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

export function loadBirthdaysToDisplay(birthdays, customTitle, customText) {
    // PURGA OBLIGATORIA
    clearContent();

    DOM.contentLayer.classList.add('cumpleanos-layout');

    DOM.mainTitle.textContent = customTitle !== undefined && customTitle !== null ? customTitle : '';
    DOM.mainText.textContent = customText || '';
    DOM.mainText.style.whiteSpace = 'pre-line';

    if (!birthdays || birthdays.length === 0) {
        // Ejecución nativa incondicional: Si la matriz está vacía, siempre muestra el mensaje predeterminado.
        DOM.birthdayList.innerHTML = '<p class="no-data" style="margin-top: 5vh; line-height: 1.5; text-align: center; font-style: italic; color: #e5e7eb; max-width: 80%; margin-left: auto; margin-right: auto; font-size: 3.5vw;">Esta semana no tenemos cumpleañeros registrados.<br>¡Damos gracias a Dios por la vida de cada uno de ustedes!</p>';
        return;
    }

    birthdays.forEach(cumple => {
        const item = document.createElement('div');
        item.className = 'birthday-item-clean';

        let highlight = '';
        if (cumple.es_hoy) {
            highlight = ' <span class="badge-hoy">— ¡HOY!</span>';
        } else if (cumple.es_manana) {
            highlight = ' <span class="badge-manana">— Mañana</span>';
        }

        item.innerHTML = `<span class="name">${cumple.nombre}</span> <span class="date">(${cumple.fecha})</span>${highlight}`;
        DOM.birthdayList.appendChild(item);
    });
}

export function loadAnunciosToDisplay(anuncios, customTitle, customText) {
    // PURGA OBLIGATORIA
    clearContent();

    DOM.mainTitle.textContent = customTitle !== undefined && customTitle !== null ? customTitle : '';
    DOM.mainTitle.style.color = '#fbbf24';
    DOM.mainText.textContent = customText || '';
    DOM.mainText.style.whiteSpace = 'pre-line';

    if (!anuncios || anuncios.length === 0) {
        // Ejecución nativa incondicional.
        DOM.birthdayList.innerHTML = '<p class="no-data" style="margin-top:20px; text-align: center; font-size: 3vw; color: #e5e7eb;">No hay anuncios programados para este servicio.</p>';
        return;
    }

    anuncios.forEach(a => {
        const item = document.createElement('div');
        item.className = 'birthday-item';
        item.innerHTML = `<div style="color: #60a5fa; margin-bottom: 5px;">🔹 ${a.titulo}</div><div style="font-size: 0.8em; font-weight: 500; color: #e5e7eb;">${a.contenido}</div>`;
        DOM.birthdayList.appendChild(item);
    });
}