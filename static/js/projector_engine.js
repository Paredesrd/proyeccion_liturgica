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
    
    // FIX P0: Destruir blackout al cambiar de escena
    if (DOM.blackoutLayer) DOM.blackoutLayer.style.display = 'none';

    const oldLabel = document.getElementById('bible-version-label');
    if (oldLabel) oldLabel.remove();
}

export function setText(title, text, variant) {
    clearContent();
    DOM.mainTitle.textContent = title || '';
    DOM.mainText.textContent = text || '';
    DOM.mainText.style.whiteSpace = 'pre-line';
    if (variant && variant !== 'clear') DOM.contentLayer.classList.add(`${variant}-layout`);
    autoFitText();
}


export function autoFitText() {
    const title = DOM.mainTitle;
    const text = DOM.mainText;
    const container = DOM.contentLayer;
    if (!text || !container) return;
    
    // Resetear a los tamaños por defecto del CSS
    text.style.fontSize = '';
    if (title) title.style.fontSize = '';

    // Usar requestAnimationFrame para esperar a que el texto se renderice
    requestAnimationFrame(() => {
        let fontSize = parseFloat(window.getComputedStyle(text).fontSize);
        let titleSize = title ? parseFloat(window.getComputedStyle(title).fontSize) : 0;
        let iterations = 0;
        
        // Bucle: Mientras el contenido sea más alto que la pantalla, reducir la fuente
        while (container.scrollHeight > container.clientHeight && fontSize > 12 && iterations < 100) {
            fontSize -= 2;
            text.style.fontSize = fontSize + 'px';
            if (title && titleSize > 12) {
                titleSize -= 1;
                title.style.fontSize = titleSize + 'px';
            }
            iterations++;
        }
    });
}

export function resetModuleState() {
    clearContent();
    DOM.bgAudio.pause();
    DOM.bgAudio.currentTime = 0;
}

export function showBibleVerse(reference, text, version) {
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
    autoFitText();
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
        DOM.bgVideo.play().catch(e => console.error('Fallo en video:', e));
    } else if (type === 'color') {
        hideAllBackgrounds();
        DOM.bgSolidColor.style.backgroundColor = color || '#000';
        DOM.bgSolidColor.style.display = 'block';
    } else {
        hideAllBackgrounds();
    }
}

export function loadBirthdaysToDisplay(birthdays, customTitle, customText) {
    clearContent();
    DOM.contentLayer.classList.add('cumpleanos-layout');
    DOM.mainTitle.textContent = customTitle || '';
    DOM.mainText.textContent = customText || '';
    if (!birthdays || birthdays.length === 0) {
        DOM.birthdayList.innerHTML = '<p class="no-data">Esta semana no tenemos cumpleañeros registrados.</p>';
        return;
    }
    birthdays.forEach(c => {
        const item = document.createElement('div');
        item.className = 'birthday-item-clean';
        let hl = c.es_hoy ? ' <span class="badge-hoy">— ¡HOY!</span>' : (c.es_manana ? ' <span class="badge-manana">— Mañana</span>' : '');
        item.innerHTML = `<span class="name">${c.nombre}</span> <span class="date">(${c.fecha})</span>${hl}`;
        DOM.birthdayList.appendChild(item);
    });
    autoFitText();
}

export function loadAnunciosToDisplay(anuncios, customTitle, customText) {
    clearContent();
    DOM.mainTitle.textContent = customTitle || '';
    DOM.mainTitle.style.color = '#fbbf24';
    DOM.mainText.textContent = customText || '';
    if (!anuncios || anuncios.length === 0) {
        DOM.birthdayList.innerHTML = '<p class="no-data">No hay anuncios programados.</p>';
        return;
    }
    anuncios.forEach(a => {
        const item = document.createElement('div');
        item.className = 'birthday-item';
        item.innerHTML = `<div style="color: #60a5fa; margin-bottom: 5px;">🔹 ${a.titulo}</div><div style="font-size: 0.8em; color: #e5e7eb;">${a.contenido}</div>`;
        DOM.birthdayList.appendChild(item);
    });
    autoFitText();
}