export const DOM = {};
export function initDOM() { DOM.bgImage = document.getElementById('bg-image'); DOM.bgVideo = document.getElementById('bg-video'); DOM.bgSolidColor = document.getElementById('bg-solid-color'); DOM.mainTitle = document.getElementById('main-title'); DOM.mainText = document.getElementById('main-text'); DOM.lyricsContainer = document.getElementById('lyrics-container'); DOM.birthdayList = document.getElementById('birthday-list'); DOM.bgAudio = document.getElementById('bg-audio'); DOM.blackoutLayer = document.getElementById('blackout-layer'); DOM.contentLayer = document.getElementById('content-layer'); }
export function hideAllBackgrounds() { DOM.bgImage.style.display = 'none'; DOM.bgVideo.style.display = 'none'; DOM.bgSolidColor.style.display = 'none'; DOM.bgVideo.pause(); }
export function clearContent() { DOM.mainTitle.textContent = ''; DOM.mainText.textContent = ''; DOM.lyricsContainer.innerHTML = ''; DOM.birthdayList.innerHTML = ''; DOM.mainTitle.style.color = ''; DOM.contentLayer.classList.remove('init-layout', 'saludo-layout', 'predica-layout', 'cenia-layout', 'cumpleanos-layout', 'alabanzas-layout'); if (DOM.blackoutLayer) DOM.blackoutLayer.style.display = 'none'; const oldLabel = document.getElementById('bible-version-label'); if (oldLabel) oldLabel.remove(); const oldCita = document.querySelector('.projector-cita'); if (oldCita) oldCita.remove(); }
export function setText(title, text, variant, cita = '', isMonitor = false) {
    clearContent();
    DOM.mainTitle.textContent = title || '';
    DOM.mainText.textContent = text || '';
    DOM.mainText.style.whiteSpace = 'pre-line';
    if (variant === 'init') DOM.contentLayer.classList.add('init-layout');
    else if (variant === 'saludo') DOM.contentLayer.classList.add('saludo-layout');
    else if (variant === 'predica') DOM.contentLayer.classList.add('predica-layout');
    else if (variant === 'cenia') DOM.contentLayer.classList.add('cenia-layout');
    else if (variant === 'alabanzas') DOM.contentLayer.classList.add('alabanzas-layout');
    if (cita) {
        const citaEl = document.createElement('div');
        citaEl.className = 'projector-cita';
        const refs = cita.split(/[;,]/).map(c => c.trim()).filter(Boolean);
        refs.forEach((ref, i) => {
            const span = document.createElement('span');
            span.className = 'bible-link';
            span.textContent = ref;
            if (i > 0) citaEl.appendChild(document.createTextNode(' '));
            if (isMonitor) {
                span.style.cursor = 'pointer';
                span.addEventListener('click', () => { window.parent.postMessage({ type: 'bible_link_click', cita: ref }, '*'); });
            }
            citaEl.appendChild(span);
        });
        DOM.contentLayer.appendChild(citaEl);
    }
}
export function resetModuleState() { clearContent(); DOM.bgAudio.pause(); DOM.bgAudio.currentTime = 0; }
export function showBibleVerse(reference, text, version) { clearContent(); DOM.mainTitle.textContent = reference; DOM.mainTitle.style.color = '#fbbf24'; DOM.mainText.textContent = `"${text}"`; DOM.mainText.style.whiteSpace = 'pre-line'; const vL = document.createElement('div'); vL.id = 'bible-version-label'; vL.textContent = version || 'RVR1960'; vL.style.position = 'absolute'; vL.style.bottom = '2vh'; vL.style.right = '2vw'; vL.style.fontSize = 'min(2.5vw, 4vh)'; vL.style.color = '#666'; vL.style.fontStyle = 'italic'; DOM.contentLayer.appendChild(vL); }
export function setBackground(type, src, color) { if (type === 'image' && src) { if (DOM.bgImage.src.endsWith(src) && DOM.bgImage.style.display === 'block') return; hideAllBackgrounds(); DOM.bgImage.src = src; DOM.bgImage.style.display = 'block'; } else if (type === 'video' && src) { if (DOM.bgVideo.src.endsWith(src) && DOM.bgVideo.style.display === 'block') return; hideAllBackgrounds(); DOM.bgVideo.src = src; DOM.bgVideo.load(); DOM.bgVideo.style.display = 'block'; DOM.bgVideo.play().catch(e => console.error(e)); } else if (type === 'color') { hideAllBackgrounds(); DOM.bgSolidColor.style.backgroundColor = color || '#000'; DOM.bgSolidColor.style.display = 'block'; } else { hideAllBackgrounds(); } }
export function loadBirthdaysToDisplay(birthdays, customTitle, customText) { clearContent(); DOM.contentLayer.classList.add('cumpleanos-layout'); DOM.mainTitle.textContent = customTitle || ''; DOM.mainText.textContent = customText || ''; if (!birthdays || birthdays.length === 0) { DOM.birthdayList.innerHTML = '<p class="no-data">Esta semana no tenemos cumpleaños registrados.</p>'; return; } birthdays.forEach(c => { const item = document.createElement('div'); item.className = 'birthday-item-clean'; let hl = c.es_hoy ? ' <span class="badge-hoy">— ¡HOY!</span>' : (c.es_manana ? ' <span class="badge-manana">— Mañana</span>' : ''); item.innerHTML = `<span class="name">${c.nombre}</span>`; DOM.birthdayList.appendChild(item); }); }
export function loadAnunciosToDisplay(anuncios, customTitle, customText) { clearContent(); DOM.mainTitle.textContent = customTitle || ''; DOM.mainTitle.style.color = '#fbbf24'; DOM.mainText.textContent = customText || ''; if (!anuncios || anuncios.length === 0) { DOM.birthdayList.innerHTML = '<p class="no-data">No hay anuncios programados.</p>'; return; } anuncios.forEach(a => { const item = document.createElement('div'); item.className = 'birthday-item'; item.innerHTML = `<div style="color: #60a5fa; margin-bottom: 5px;">🔹 ${a.titulo}</div><div style="font-size: 0.8em; color: #e5e7eb;">${a.contenido}</div>`; DOM.birthdayList.appendChild(item); }); }