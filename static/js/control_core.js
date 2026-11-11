import { API } from './api_client.js';
import { sendCommand } from './ws_client.js';

export async function uiLoadModuleBackgrounds(moduleName) {
    const selectEl = document.getElementById(`${moduleName}-bg-select`);
    if (!selectEl) return;
    try {
        const data = await API.media.getBackgrounds();
        let savedUrl = localStorage.getItem(`${moduleName}_bg_url`);
        let savedType = localStorage.getItem(`${moduleName}_bg_type`);
        let savedColor = localStorage.getItem(`${moduleName}_bg_color`);
        try {
            const cfg = await fetch(`/api/config/lote/${encodeURIComponent(moduleName + '_')}`).then(r => r.json());
            const v = cfg.valores || {};
            if (v[`${moduleName}_bg_type`]) {
                savedUrl = v[`${moduleName}_bg_url`] || '';
                savedType = v[`${moduleName}_bg_type`];
                savedColor = v[`${moduleName}_bg_color`] || '#000000';
                localStorage.setItem(`${moduleName}_bg_url`, savedUrl);
                localStorage.setItem(`${moduleName}_bg_type`, savedType);
                localStorage.setItem(`${moduleName}_bg_color`, savedColor);
            }
        } catch (e) { console.error(e); }
        if (!savedType) {
            savedUrl = ''; savedType = 'color'; savedColor = '#000000';
            localStorage.setItem(`${moduleName}_bg_url`, savedUrl);
            localStorage.setItem(`${moduleName}_bg_type`, savedType);
            localStorage.setItem(`${moduleName}_bg_color`, savedColor);
        }
        let options = '';
        const isBlack = (savedType === 'color' && savedColor === '#000000') ? 'selected' : '';
        options += `<option value="color:#000000" ${isBlack}>⬛ Sin fondo (Negro)</option>`;
        const isWhite = (savedType === 'color' && savedColor === '#ffffff') ? 'selected' : '';
        options += `<option value="color:#ffffff" ${isWhite}>⬛ Fondo Blanco</option>`;
        data.backgrounds.forEach(bg => {
            const isSelected = bg.url === savedUrl ? 'selected' : '';
            options += `<option value="${bg.url}" ${isSelected}>⬛ ${bg.filename}</option>`;
        });
        selectEl.innerHTML = options;
        if (savedType === 'color') sendCommand('set_background', { type: 'color', color: savedColor }, 'preview');
        else sendCommand('set_background', { type: savedType, src: savedUrl }, 'preview');
    } catch (e) {
        console.error(e);
        selectEl.innerHTML = '<option value="">Error al cargar fondos locales</option>';
    }
}

export function applyModuleBackground(moduleName) {
    const selectEl = document.getElementById(`${moduleName}-bg-select`);
    if (!selectEl) return;
    const val = selectEl.value;
    if (val.startsWith('color:')) {
        const color = val.split(':')[1];
        localStorage.setItem(`${moduleName}_bg_url`, '');
        localStorage.setItem(`${moduleName}_bg_type`, 'color');
        localStorage.setItem(`${moduleName}_bg_color`, color);
        sendCommand('set_background', { type: 'color', color: color }, 'preview');
    } else {
        const bgSrc = val;
        const bgType = bgSrc.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? 'image' : 'video';
        localStorage.setItem(`${moduleName}_bg_url`, bgSrc);
        localStorage.setItem(`${moduleName}_bg_type`, bgType);
        localStorage.setItem(`${moduleName}_bg_color`, '#000000');
        sendCommand('set_background', { type: bgType, src: bgSrc }, 'preview');
    }
    syncConfigServidor(moduleName);
}

export function syncPreviewText(modId) {
    const titleEl = document.getElementById(`${modId}-title`);
    const textEl = document.getElementById(`${modId}-text`);
    if (!titleEl && !textEl) {
        localStorage.removeItem(`${modId}_title`);
        localStorage.removeItem(`${modId}_text`);
        sendCommand('set_text', { title: '', text: '', variant: modId }, 'preview');
        return;
    }
    const title = titleEl ? titleEl.value.trim() : '';
    const text = textEl ? textEl.value.trim() : '';
    if (titleEl) localStorage.setItem(`${modId}_title`, title);
    if (textEl) localStorage.setItem(`${modId}_text`, text);
    sendCommand('set_text', { title: title, text: text, variant: modId }, 'preview');
}

export async function autoUploadAudio(modId) {
    const audioInput = document.getElementById(`${modId}-audio-file`);
    const filenameDisplay = document.getElementById(`${modId}-audio-filename`);
    if (!audioInput || audioInput.files.length === 0) return;
    if (filenameDisplay) filenameDisplay.innerHTML = `⏳ Sincronizando pista...`;
    try {
        const uploadedUrl = await API.media.upload(`${modId}-audio-file`, 'audio');
        if (uploadedUrl) {
            localStorage.setItem(`${modId}_audio_url`, uploadedUrl);
            localStorage.setItem(`${modId}_audio_name`, audioInput.files[0].name);
            syncConfigServidor(modId);
            if (filenameDisplay) filenameDisplay.innerHTML = `🎧 Pista: <br><span class="text-white fw-bold">${audioInput.files[0].name}</span>`;
        }
    } catch (e) {
        console.error(e);
        if (filenameDisplay) filenameDisplay.innerHTML = `❌ Fallo en la transmisión.`;
    }
}

export async function uiPreviewDatabaseData(modId) {
    const previewEl = document.getElementById(`${modId}-preview`);
    if (!previewEl) return;
    previewEl.innerHTML = `<span class='text-info small fw-bold'>⏳ Sincronizando...</span>`;
    try {
        let count = 0;
        if (modId === 'cumpleanos') {
            const data = await API.projection.getBirthdays();
            count = data.cumpleanos ? data.cumpleanos.length : 0;
        } else if (modId === 'anuncios') {
            const data = await API.projection.getAnuncios();
            count = data.anuncios ? data.anuncios.length : 0;
        } else return;
        if (count > 0) previewEl.innerHTML = `<span class='text-success fw-bold'>✅ ${count} registros listos.</span>`;
        else previewEl.innerHTML = `<span class='text-warning fw-bold'>? Cero registros.</span>`;
    } catch (e) {
        previewEl.innerHTML = `<span class='text-danger fw-bold'>❌ Fallo de conexión.</span>`;
    }
}

export function enforceLiveScene(moduleName) {
    const bgType = localStorage.getItem(`${moduleName}_bg_type`) || 'color';
    const bgSrc = localStorage.getItem(`${moduleName}_bg_url`) || '';
    const bgColor = localStorage.getItem(`${moduleName}_bg_color`) || '#000000';
    if (bgType === 'color') sendCommand('set_background', { type: 'color', color: bgColor }, 'live');
    else sendCommand('set_background', { type: bgType, src: bgSrc }, 'live');
    const audioSrc = localStorage.getItem(`${moduleName}_audio_url`) || '';
    if (audioSrc) sendCommand('play_media', { type: 'audio', src: audioSrc, volume: 1.0, muted: false }, 'live');
    else sendCommand('stop_media', {}, 'live');
}

export function fireMasterTrigger(modId) {
    syncPreviewText(modId);
    enforceLiveScene(modId);
    if (modId === 'init') executeStandardProjection('init', 'init', 'set_text', null, 'all');
    else if (modId === 'saludo') executeStandardProjection('saludo', 'saludo', 'set_text', null, 'all');
    else if (modId === 'cenia') executeStandardProjection('cenia', 'cenia', 'set_text', null, 'all');
    else if (modId === 'cumpleanos') executeStandardProjection('cumpleanos', 'cumpleanos', 'load_birthdays', API.projection.getBirthdays, 'all');
    else if (modId === 'anuncios') executeStandardProjection('anuncios', 'anuncios', 'load_anuncios', API.projection.getAnuncios, 'all');
}

async function executeStandardProjection(modId, variant, wsCommand, fetchDbFunc = null, target = 'live') {
    let title = localStorage.getItem(`${modId}_title`) || '';
    let text = localStorage.getItem(`${modId}_text`) || '';
    if (modId === 'cumpleanos' || modId === 'anuncios') { title = ''; text = ''; }
    let dbData = [];
    if (fetchDbFunc) {
        try {
            const data = await fetchDbFunc();
            dbData = data[modId] || [];
            const previewEl = document.getElementById(`${modId}-preview`);
            if (previewEl) previewEl.innerHTML = dbData.length > 0 ? `<span class='text-success fw-bold'>✅ ${dbData.length} registros.</span>` : `<span class='text-warning fw-bold'>? Cero registros.</span>`;
        } catch(e) { console.error(e); }
    }
    if (wsCommand === 'set_text') sendCommand('set_text', { title: title, text: text, variant: variant }, target);
    else {
        const payload = { title: title, text: text };
        payload[modId] = dbData;
        sendCommand(wsCommand, payload, target);
    }
}

export function clearStandardScreen(modId) {
    enforceLiveScene(modId);
    sendCommand('set_text', { title: '', text: '', variant: 'clear' }, 'all');
}

export let predicaSlides = [];
export let lastActiveSlide = null;

export async function uiLoadBosquejo() {
    const grid = document.getElementById('predica-slide-grid');
    if (!grid) return;
    grid.innerHTML = '<p class="text-info small text-center w-100 mb-0">Sincronizando...</p>';
    try {
        const data = await API.predica.getBosquejo();
        predicaSlides = data.diapositivas || [];
        if (predicaSlides.length === 0) {
            grid.innerHTML = '<p class="text-muted small text-center w-100 mb-0">No se ha publicado un bosquejo.</p>';
            return;
        }
        grid.innerHTML = predicaSlides.map((slide, index) => `
            <button class="btn btn-outline-secondary text-start p-2" style="width: 100%; transition: 0.2s;" onclick="projectSlide(${index})">
                <span class="text-info fw-bold w-100 text-truncate" style="font-size: 0.95rem;">${slide.titulo}</span>
            </button>
        `).join('');
        if (lastActiveSlide) {
            sendCommand('set_text', { title: lastActiveSlide.titulo, text: lastActiveSlide.contenido, cita: lastActiveSlide.cita, variant: 'predica' }, 'preview');
        } else if (predicaSlides.length > 0) {
            lastActiveSlide = predicaSlides[0];
            sendCommand('set_text', { title: lastActiveSlide.titulo, text: lastActiveSlide.contenido, cita: lastActiveSlide.cita, variant: 'predica' }, 'preview');
        }
    } catch(e) {
        grid.innerHTML = '<p class="text-danger small text-center w-100 mb-0">Error al recuperar bosquejo.</p>';
    }
}

export function projectSlide(index) {
    const slide = predicaSlides[index];
    if (!slide) return;
    lastActiveSlide = slide;
    const nextSlide = predicaSlides[index + 1];
    enforceLiveScene('predica');
    sendCommand('set_text', {
        id: slide.id,
        title: slide.titulo,
        text: slide.contenido,
        cita: slide.cita || '',
        variant: 'predica',
        next_title: nextSlide ? nextSlide.titulo : '',
        next_text: nextSlide ? nextSlide.contenido : ''
    }, 'all');
}

export function clearPredicaScreen() {
    enforceLiveScene('predica');
    sendCommand('set_text', { title: '', text: '', variant: 'predica' }, 'all');
}

export async function uiLoadBibleBooks(version) {
    const datalist = document.getElementById('bible-books-list');
    if (!datalist) return;
    try {
        const data = await API.bible.getBooks(version);
        const libros = Array.isArray(data) ? data : (data.libros || []);
        datalist.innerHTML = libros.map(libro => `<option value="${libro}">`).join('');
    } catch (e) { console.error(e); }
}

export async function uiLoadBibleVersions() {
    const versionSelect = document.getElementById('bible-version-select');
    if (!versionSelect) return;
    try {
        const data = await API.bible.getVersions();
        const versiones = data.versiones || [];
        if (versiones.length === 0) { versionSelect.innerHTML = '<option value="">No hay Biblias</option>'; return; }
        let savedVersion = localStorage.getItem('bible_selected_version');
        if (!savedVersion || !versiones.includes(savedVersion)) {
            savedVersion = versiones.includes('RVR1960') ? 'RVR1960' : versiones[0];
            localStorage.setItem('bible_selected_version', savedVersion);
        }
        versionSelect.innerHTML = versiones.map(v => `<option value="${v}" ${v === savedVersion ? 'selected' : ''}>Versión: ${v}</option>`).join('');
        uiLoadBibleBooks(savedVersion);
        versionSelect.onchange = () => {
            const newVersion = versionSelect.value;
            localStorage.setItem('bible_selected_version', newVersion);
            uiLoadBibleBooks(newVersion);
        };
    } catch (e) { versionSelect.innerHTML = '<option value="">Error</option>'; }
}

export async function uiProjectBible() {
    const bookRaw = document.getElementById('bible-book').value.trim();
    const chapter = document.getElementById('bible-chapter').value.trim();
    const verse = document.getElementById('bible-verse').value.trim();
    const versionSelect = document.getElementById('bible-version-select');
    const version = versionSelect ? versionSelect.value : 'RVR1960';
    if (!bookRaw || !chapter) { alert("⚠️ Ingrese libro y capítulo."); return; }
    const bookClean = bookRaw.replace(/^(S\.|San|Santo)\s+/i, '').trim();
    let queryParam = chapter;
    if (verse) queryParam = `${chapter}:${verse}`;
    try {
        const { ok, data } = await API.bible.searchVerse(bookClean, queryParam, version);
        if (!ok || data.error) { alert(`❌ Error: ${data.detail || data.error || 'No se pudo procesar.'}`); return; }
        enforceLiveScene('biblia');
        sendCommand('show_bible_verse', { reference: data.referencia, version: data.version, text: data.texto, libro_db: data.libro_db, capitulo: data.capitulo, versiculo: data.versiculo_inicio }, 'all');
    } catch (e) { alert("❌ Fallo de red."); }
}

export function clearBibleScreen() {
    enforceLiveScene('biblia');
    sendCommand('set_text', { title: '', text: '', variant: 'biblia' }, 'all');
}

window.addEventListener('project_verse', (e) => {
    enforceLiveScene('biblia');
    sendCommand('show_bible_verse', e.detail, 'all');
});

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'bible_link_click') {
        const cita = event.data.cita;
        const version = document.getElementById('bible-version-select')?.value || 'RVR1960';
        const match = cita.match(/^((?:[1-3]\s*)?[A-Za-zÁÉÍÓÚÑáéíóúñ]+)\s*(\d+)(?::(\d+)(?:-(\d+))?)?$/);
        if (match) {
            const libro = match[1].trim();
            const capitulo = match[2];
            const versiculo = match[3] || '';
            const queryParam = versiculo ? `${capitulo}:${versiculo}` : capitulo;
            API.bible.searchVerse(libro, queryParam, version).then(({ ok, data }) => {
                if (ok) {
                    enforceLiveScene('biblia');
                    sendCommand('show_bible_verse', { reference: data.referencia, text: data.texto, version: data.version, libro_db: data.libro_db, capitulo: data.capitulo, versiculo: data.versiculo_inicio }, 'all');
                }
            });
        }
    }
});

export async function uiLoadModuleAudios(moduleName) {
    const selectEl = document.getElementById(`${moduleName}-audio-select`);
    if (!selectEl) return;
    let savedUrl = localStorage.getItem(`${moduleName}_audio_url`) || '';
    let savedName = localStorage.getItem(`${moduleName}_audio_name`) || '';
    try {
        const cfg = await fetch(`/api/config/lote/${encodeURIComponent(moduleName + '_')}`).then(r => r.json());
        const v = cfg.valores || {};
        if (v[`${moduleName}_audio_url`]) {
            savedUrl = v[`${moduleName}_audio_url`];
            savedName = v[`${moduleName}_audio_name`] || '';
            localStorage.setItem(`${moduleName}_audio_url`, savedUrl);
            localStorage.setItem(`${moduleName}_audio_name`, savedName);
        }
    } catch (e) { console.error(e); }
    try {
        const data = await API.media.getAudios();
        const audios = data.audios || [];
        let options = '<option value="">-- Elegir pista subida --</option>';
        audios.forEach(a => {
            const isSel = a.url === savedUrl ? ' selected' : '';
            options += `<option value="${a.url}"${isSel}>${a.filename}</option>`;
        });
        selectEl.innerHTML = options;
        if (savedName) {
            const display = document.getElementById(`${moduleName}-audio-filename`);
            if (display) display.innerHTML = '🎧 Pista: <br><span class="text-white fw-bold">' + savedName + '</span>';
        }
    } catch (e) { console.error(e); }
}

window.elegirAudioGuardado = function(modId, selectEl) {
    const url = selectEl.value;
    if (!url) return;
    const name = selectEl.options[selectEl.selectedIndex].text;
    localStorage.setItem(`${modId}_audio_url`, url);
    localStorage.setItem(`${modId}_audio_name`, name);
    syncConfigServidor(modId);
    const display = document.getElementById(`${modId}-audio-filename`);
    if (display) display.innerHTML = '🎧 Pista: <br><span class="text-white fw-bold">' + name + '</span>';
};

async function syncConfigServidor(modId) {
    try {
        const claves = ['_bg_url', '_bg_type', '_bg_color', '_audio_url', '_audio_name'];
        const valores = {};
        claves.forEach(s => { const v = localStorage.getItem(modId + s); if (v !== null) valores[modId + s] = v; });
        await fetch('/api/config/lote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ valores: valores }) });
    } catch (e) { console.error(e); }
}
