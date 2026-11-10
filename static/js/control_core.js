import { API } from './api_client.js';
import { sendCommand } from './ws_client.js';

// ==================== GESTOR DE FONDOS AISLADO POR MÓDULO ====================

export async function uiLoadModuleBackgrounds(moduleName) {
    const selectEl = document.getElementById(`${moduleName}-bg-select`);
    if (!selectEl) return;

    try {
        const data = await API.media.getBackgrounds();

        let savedUrl = localStorage.getItem(`${moduleName}_bg_url`);
        let savedType = localStorage.getItem(`${moduleName}_bg_type`);
        let savedColor = localStorage.getItem(`${moduleName}_bg_color`);

        if (!savedType) {
            savedUrl = '';
            savedType = 'color';
            savedColor = '#000000';

            localStorage.setItem(`${moduleName}_bg_url`, savedUrl);
            localStorage.setItem(`${moduleName}_bg_type`, savedType);
            localStorage.setItem(`${moduleName}_bg_color`, savedColor);
        }

        let options = '';
        const isBlack = (savedType === 'color' && savedColor === '#000000') ? 'selected' : '';
        options += `<option value="color:#000000" ${isBlack}>⬛ Sin fondo (Negro)</option>`;

        const isWhite = (savedType === 'color' && savedColor === '#ffffff') ? 'selected' : '';
        options += `<option value="color:#ffffff" ${isWhite}>⬜ Fondo Blanco</option>`;

        data.backgrounds.forEach(bg => {
            const isSelected = bg.url === savedUrl ? 'selected' : '';
            options += `<option value="${bg.url}" ${isSelected}>🎥 ${bg.filename}</option>`;
        });

        selectEl.innerHTML = options;

        if (savedType === 'color') {
            sendCommand('set_background', { type: 'color', color: savedColor }, 'preview');
        } else {
            sendCommand('set_background', { type: savedType, src: savedUrl }, 'preview');
        }

    } catch (e) {
        console.error("Fallo local de fondos:", e);
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
}

// ==================== MOTOR UNIFICADO PARA MÓDULOS DE SISTEMA ====================

export function syncPreviewText(modId) {
    const titleEl = document.getElementById(`${modId}-title`);
    const textEl = document.getElementById(`${modId}-text`);

    // PURGA DE CACHÉ: Destruye residuos en memoria para módulos controlados 100% por base de datos
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

    if (filenameDisplay) {
        filenameDisplay.innerHTML = `⏳ Sincronizando pista en servidor...`;
    }

    try {
        const uploadedUrl = await API.media.upload(`${modId}-audio-file`, 'audio');
        if (uploadedUrl) {
            localStorage.setItem(`${modId}_audio_url`, uploadedUrl);
            localStorage.setItem(`${modId}_audio_name`, audioInput.files[0].name);
            if (filenameDisplay) {
                filenameDisplay.innerHTML = `🎧 Pista asignada en sistema: <br><span class="text-white fw-bold">${audioInput.files[0].name}</span>`;
            }
        }
    } catch (e) {
        console.error("Fallo crítico en subida de audio:", e);
        if (filenameDisplay) {
            filenameDisplay.innerHTML = `❌ Fallo en la transmisión del archivo.`;
        }
    }
}

// ==================== PRE-VISUALIZACIÓN DE BASE DE DATOS ====================

export async function uiPreviewDatabaseData(modId) {
    const previewEl = document.getElementById(`${modId}-preview`);
    if (!previewEl) return;

    previewEl.innerHTML = `<span class='text-info small fw-bold'>⏳ Sincronizando con base de datos...</span>`;

    try {
        let count = 0;
        if (modId === 'cumpleanos') {
            const data = await API.projection.getBirthdays();
            count = data.cumpleanos ? data.cumpleanos.length : 0;
        } else if (modId === 'anuncios') {
            const data = await API.projection.getAnuncios();
            count = data.anuncios ? data.anuncios.length : 0;
        } else {
            return;
        }

        if (count > 0) {
            previewEl.innerHTML = `<span class='text-success fw-bold'>✅ ${count} registros listos para proyectar.</span>`;
        } else {
            previewEl.innerHTML = `<span class='text-warning fw-bold'>⚠️ Cero registros activos. Revise el administrador.</span>`;
        }
    } catch (e) {
        console.error(`Error al pre-cargar datos para ${modId}:`, e);
        previewEl.innerHTML = `<span class='text-danger fw-bold'>❌ Fallo de conexión con la base de datos.</span>`;
    }
}

// ==================== IMPOSICIÓN ESTRICTA DE ESCENA EN VIVO ====================

export function enforceLiveScene(moduleName) {
    const bgType = localStorage.getItem(`${moduleName}_bg_type`) || 'color';
    const bgSrc = localStorage.getItem(`${moduleName}_bg_url`) || '';
    const bgColor = localStorage.getItem(`${moduleName}_bg_color`) || '#000000';

    if (bgType === 'color') {
        sendCommand('set_background', { type: 'color', color: bgColor }, 'live');
    } else {
        sendCommand('set_background', { type: bgType, src: bgSrc }, 'live');
    }

    const audioSrc = localStorage.getItem(`${moduleName}_audio_url`) || '';

    if (audioSrc) {
        sendCommand('play_media', { type: 'audio', src: audioSrc, volume: 1.0, muted: false }, 'live');
    } else {
        sendCommand('stop_media', {}, 'live');
    }
}

// ==================== GATILLO MAESTRO ====================

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

    // BLINDAJE DE EXTRACCIÓN: Garantiza que módulos de base de datos no sangren texto residual.
    if (modId === 'cumpleanos' || modId === 'anuncios') {
        title = '';
        text = '';
    }

    let dbData = [];

    if (fetchDbFunc) {
        try {
            const data = await fetchDbFunc();
            dbData = data[modId] || [];
            const previewEl = document.getElementById(`${modId}-preview`);

            if (previewEl) {
                previewEl.innerHTML = dbData.length > 0
                    ? `<span class='text-success fw-bold'>✅ ${dbData.length} registros en vivo.</span>`
                    : `<span class='text-warning fw-bold'>⚠️ Cero registros activos.</span>`;
            }
        } catch(e) {
            console.error('Error sincronizando BD:', e);
        }
    }

    if (wsCommand === 'set_text') {
        sendCommand('set_text', { title: title, text: text, variant: variant }, target);
    } else {
        const payload = { title: title, text: text };
        // Envía los datos reales, permitiendo que el proyector dibuje su propio texto si está vacío
        payload[modId] = dbData;
        sendCommand(wsCommand, payload, target);
    }
}

// LIMPIEZA TÁCTICA DE MÓDULOS ESTÁNDAR
export function clearStandardScreen(modId) {
    enforceLiveScene(modId);
    // ORDEN DE PURGA UNIVERSAL: Usar set_text vacío destruye cualquier texto o lista visible en el proyector
    sendCommand('set_text', { title: '', text: '', variant: 'clear' }, 'all');
}
window.clearStandardScreen = clearStandardScreen;

// ==================== MÓDULOS INTACTOS (Prédica, Biblia, Ofrendas) ====================

export let predicaSlides = [];
export let lastActiveSlide = null;

export async function uiLoadBosquejo() {
    const grid = document.getElementById('predica-slide-grid');
    if (!grid) return;
    grid.innerHTML = '<p class="text-info small text-center w-100 mb-0">Sincronizando bosquejo con servidor...</p>';
    try {
        const data = await API.predica.getBosquejo();
        predicaSlides = data.diapositivas || [];

        if (predicaSlides.length === 0) {
            grid.innerHTML = '<p class="text-muted small text-center w-100 mb-0">No se ha publicado un bosquejo para el servicio de hoy.</p>';
            return;
        }

        grid.innerHTML = predicaSlides.map((slide, index) => `
            <button class="btn btn-outline-secondary text-start p-2 d-flex flex-column align-items-start" style="width: calc(50% - 0.25rem); transition: 0.2s;" onclick="projectSlide(${index})">
                <span class="text-info fw-bold mb-1 w-100 text-truncate" style="font-size: 0.85rem; line-height: 1.1;">${slide.titulo}</span>
                <span class="text-white small text-truncate w-100" style="font-size: 0.7rem;">${slide.contenido.replace(/\n/g, ' / ')}</span>
            </button>
        `).join('');

        if (lastActiveSlide) {
            sendCommand('set_text', { title: lastActiveSlide.titulo, text: lastActiveSlide.contenido, variant: 'predica' }, 'preview');
        } else if (predicaSlides.length > 0) {
            lastActiveSlide = predicaSlides[0];
            sendCommand('set_text', { title: lastActiveSlide.titulo, text: lastActiveSlide.contenido, variant: 'predica' }, 'preview');
        }
    } catch(e) {
        grid.innerHTML = '<p class="text-danger small text-center w-100 mb-0">Error de conectividad al recuperar bosquejo.</p>';
    }
}

export function projectSlide(index) {
    const slide = predicaSlides[index];
    if (!slide) return;
    lastActiveSlide = slide;
    
    // Lógica para el Monitor de Escenario (Siguiente diapositiva)
    const nextSlide = predicaSlides[index + 1];
    const nextTitle = nextSlide ? nextSlide.titulo : "Fin de la prédica";
    const nextText = nextSlide ? nextSlide.contenido : "No hay más diapositivas";

    enforceLiveScene('predica');
    sendCommand('set_text', { 
        id: slide.id,
        title: slide.titulo, 
        text: slide.contenido, 
        variant: 'predica',
        next_title: nextTitle,
        next_text: nextText
    }, 'all');
}

export function clearPredicaScreen() {
    enforceLiveScene('predica');
    sendCommand('set_text', { title: '', text: '', variant: 'predica' }, 'all');
}
window.clearPredicaScreen = clearPredicaScreen;

// PRE-FETCH DE ÍNDICE DE LIBROS PARA AUTOCOMPLETADO NATIVO
export async function uiLoadBibleBooks(version) {
    const datalist = document.getElementById('bible-books-list');
    if (!datalist) return;

    try {
        const data = await API.bible.getBooks(version);
        const libros = Array.isArray(data) ? data : (data.libros || []);

        datalist.innerHTML = libros.map(libro => {
            const sinAcentos = libro.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            return `<option value="${libro}">${sinAcentos}</option>`;
        }).join('');
    } catch (e) {
        console.error("No se pudo extraer el índice de libros bíblicos:", e);
        datalist.innerHTML = '';
    }
}

export async function uiLoadBibleVersions() {
    const versionSelect = document.getElementById('bible-version-select');
    if (!versionSelect) return;
    try {
        const data = await API.bible.getVersions();
        const versiones = data.versiones || [];

        if (versiones.length === 0) {
            versionSelect.innerHTML = '<option value="">No hay Biblias en el servidor</option>';
            return;
        }
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
    } catch (e) {
        versionSelect.innerHTML = '<option value="">Error al cargar versiones</option>';
    }
}

export async function uiProjectBible() {
    const bookRaw = document.getElementById('bible-book').value.trim();
    const chapter = document.getElementById('bible-chapter').value.trim();
    const verse = document.getElementById('bible-verse').value.trim();
    const versionSelect = document.getElementById('bible-version-select');
    const version = versionSelect ? versionSelect.value : 'RVR1960';

    if (!bookRaw || !chapter) { alert("⚠️ Por favor ingrese el libro y el capítulo."); return; }

    const bookClean = bookRaw.replace(/^(S\.|San|Santo)\s+/i, '').trim();
    let queryParam = chapter;
    if (verse) queryParam = `${chapter}:${verse}`;

    try {
        const { ok, data } = await API.bible.searchVerse(bookClean, queryParam, version);
        if (!ok || data.error) {
            alert(`❌ Error: ${data.detail || data.error || 'No se pudo procesar la escritura.'}`);
            return;
        }
        enforceLiveScene('biblia');
        sendCommand('show_bible_verse', { 
            reference: data.referencia, 
            version: data.version, 
            text: data.texto,
            libro_db: data.libro_db,
            capitulo: data.capitulo,
            versiculo: data.versiculo_inicio || 1
        }, 'all');
    } catch (e) {
        alert("❌ Fallo crítico de red o de base de datos al buscar versículo.");
    }
}

export function clearBibleScreen() {
    enforceLiveScene('biblia');
    sendCommand('set_text', { title: '', text: '', variant: 'biblia' }, 'all');
}
window.clearBibleScreen = clearBibleScreen;