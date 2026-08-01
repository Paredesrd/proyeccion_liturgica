import { API } from './api_client.js';
import { sendCommand } from './ws_client.js';

// ==================== GESTOR UNIVERSAL DE FONDOS POR MÓDULO ====================

export async function uiLoadModuleBackgrounds(moduleName) {
    const selectEl = document.getElementById(`${moduleName}-bg-select`);
    if (!selectEl) return;

    try {
        const data = await API.media.getBackgrounds();

        let savedUrl = localStorage.getItem(`${moduleName}_bg_url`);
        let savedType = localStorage.getItem(`${moduleName}_bg_type`);
        let savedColor = localStorage.getItem(`${moduleName}_bg_color`);

        // ESTADO CERO: Si no hay configuración, se asume fondo negro.
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

        localStorage.setItem('global_current_bg_type', savedType);
        localStorage.setItem('global_current_bg_src', savedUrl || '');
        localStorage.setItem('global_current_bg_color', savedColor);

        if (savedType === 'color') {
            sendCommand('set_background', { type: 'color', color: savedColor });
        } else {
            sendCommand('set_background', { type: savedType, src: savedUrl });
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

        localStorage.setItem('global_current_bg_type', 'color');
        localStorage.setItem('global_current_bg_src', '');
        localStorage.setItem('global_current_bg_color', color);

        sendCommand('set_background', { type: 'color', color: color });
    } else {
        const bgSrc = val;
        const bgType = bgSrc.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? 'image' : 'video';
        localStorage.setItem(`${moduleName}_bg_url`, bgSrc);
        localStorage.setItem(`${moduleName}_bg_type`, bgType);
        localStorage.setItem(`${moduleName}_bg_color`, '#000000');

        localStorage.setItem('global_current_bg_type', bgType);
        localStorage.setItem('global_current_bg_src', bgSrc);
        localStorage.setItem('global_current_bg_color', '#000000');

        sendCommand('set_background', { type: bgType, src: bgSrc });
    }
}

// ==================== MOTOR UNIFICADO PARA MÓDULOS DE SISTEMA ====================

export async function updateStandardModuleConfig(modId) {
    const btn = document.getElementById(`btn-${modId}-update`);
    let origText = '';
    if (btn) {
        origText = btn.innerHTML;
        btn.innerHTML = '⏳ Actualizando proyector...';
        btn.disabled = true;
    }

    const titleEl = document.getElementById(`${modId}-title`);
    const textEl = document.getElementById(`${modId}-text`);
    if (titleEl) localStorage.setItem(`${modId}_title`, titleEl.value.trim());
    if (textEl) localStorage.setItem(`${modId}_text`, textEl.value.trim());

    const fileInput = document.getElementById(`${modId}-audio-file`);
    if (fileInput && fileInput.files.length > 0) {
        const uploadedUrl = await API.media.upload(`${modId}-audio-file`, 'audio');
        if (uploadedUrl) {
            localStorage.setItem(`${modId}_audio_url`, uploadedUrl);
            localStorage.setItem(`${modId}_audio_name`, fileInput.files[0].name);
            const filenameDisplay = document.getElementById(`${modId}-audio-filename`);
            if (filenameDisplay) filenameDisplay.innerHTML = `🎧 Pista asignada en sistema: <br><span class="text-white fw-bold">${fileInput.files[0].name}</span>`;
        }
    }

    if (modId === 'init') projectInicializacion();
    else if (modId === 'saludo') projectSaludos();
    else if (modId === 'cenia') projectSantaCena();
    else if (modId === 'cumpleanos') projectCumpleanos();
    else if (modId === 'anuncios') projectAnuncios();

    if (btn) {
        btn.innerHTML = '✅ Multimedia Actualizada';
        setTimeout(() => { btn.innerHTML = origText; btn.disabled = false; }, 1500);
    }
}

export function toggleModuleMute(modId) {
    let isMuted = localStorage.getItem(`${modId}_audio_muted`) === 'true';
    isMuted = !isMuted;
    localStorage.setItem(`${modId}_audio_muted`, isMuted);

    const btn = document.getElementById(`btn-${modId}-mute`);
    if (btn) {
        btn.className = `btn ${isMuted ? 'btn-danger' : 'btn-success'} w-100 fw-bold mt-3 shadow-sm`;
        btn.innerHTML = isMuted ? '🔇 Audio Silenciado (Click para Activar)' : '🔊 Audio Activo (Click para Silenciar)';
    }

    sendCommand('toggle_mute', { mute: isMuted });
}

async function executeStandardProjection(modId, variant, wsCommand, fetchDbFunc = null) {
    // ESTADO CERO: Extrae de localStorage o inyecta cadena vacía.
    const title = localStorage.getItem(`${modId}_title`) || '';
    const text = localStorage.getItem(`${modId}_text`) || '';
    const audioSrc = localStorage.getItem(`${modId}_audio_url`) || '';
    const isMuted = localStorage.getItem(`${modId}_audio_muted`) === 'true';

    let dbData = [];
    if (fetchDbFunc) {
        try {
            const data = await fetchDbFunc();
            dbData = data[modId] || [];
            const previewEl = document.getElementById(`${modId}-preview`);
            if (previewEl) {
                previewEl.innerHTML = dbData.length > 0
                    ? `<span class='text-success fw-bold'>✅ ${dbData.length} registros listos para proyectar.</span>`
                    : `<span class='text-secondary'>ℹ️ Cero registros activos.</span>`;
            }
        } catch(e) {
            console.error('Error sincronizando BD:', e);
        }
    }

    if (wsCommand === 'set_text') {
        sendCommand('set_text', { title: title, text: text, variant: variant });
    } else {
        const payload = { title: title, text: text };
        payload[modId] = dbData;
        sendCommand(wsCommand, payload);
    }

    if (audioSrc) {
        sendCommand('play_media', { type: 'audio', src: audioSrc, volume: 1.0, muted: isMuted });
    } else {
        sendCommand('stop_media', {});
    }
}

export function projectInicializacion() { executeStandardProjection('init', 'init', 'set_text'); }
export function projectSaludos() { executeStandardProjection('saludo', 'saludo', 'set_text'); }
export function projectSantaCena() { executeStandardProjection('cenia', 'cenia', 'set_text'); }
export function projectCumpleanos() { executeStandardProjection('cumpleanos', 'cumpleanos', 'load_birthdays', API.projection.getBirthdays); }
export function projectAnuncios() { executeStandardProjection('anuncios', 'anuncios', 'load_anuncios', API.projection.getAnuncios); }

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
            sendCommand('set_text', { title: lastActiveSlide.titulo, text: lastActiveSlide.contenido, variant: 'predica' });
        } else if (predicaSlides.length > 0) {
            projectSlide(0);
        }
    } catch(e) {
        grid.innerHTML = '<p class="text-danger small text-center w-100 mb-0">Error de conectividad al recuperar bosquejo.</p>';
    }
}

export function projectSlide(index) {
    const slide = predicaSlides[index];
    if (!slide) return;
    lastActiveSlide = slide;
    sendCommand('set_text', { title: slide.titulo, text: slide.contenido, variant: 'predica' });
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
        versionSelect.onchange = () => { localStorage.setItem('bible_selected_version', versionSelect.value); };
    } catch (e) {
        versionSelect.innerHTML = '<option value="">Error al cargar versiones</option>';
    }
}

export async function uiProjectBible() {
    const book = document.getElementById('bible-book').value.trim();
    const chapter = document.getElementById('bible-chapter').value.trim();
    const verse = document.getElementById('bible-verse').value.trim();
    const versionSelect = document.getElementById('bible-version-select');
    const version = versionSelect ? versionSelect.value : 'RVR1960';

    if (!book || !chapter) { alert("⚠️ Por favor ingrese el libro y el capítulo."); return; }

    let queryParam = chapter;
    if (verse) queryParam = `${chapter}:${verse}`;

    try {
        const { ok, data } = await API.bible.searchVerse(book, queryParam, version);
        if (!ok || data.error) {
            alert(`❌ Error: ${data.detail || data.error || 'No se pudo procesar la escritura.'}`);
            return;
        }
        sendCommand('show_bible_verse', { reference: data.referencia, version: data.version, text: data.texto });
    } catch (e) {
        alert("❌ Fallo crítico de red o de base de datos al buscar versículo.");
    }
}

export async function uiRegistrarOfrenda() {
    const tipo = document.getElementById('ofrenda-tipo').value;
    const montoStr = document.getElementById('ofrenda-monto').value;
    const desc = document.getElementById('ofrenda-desc').value;
    const anonima = document.getElementById('ofrenda-anonima').checked;
    const previewEl = document.getElementById('ofrenda-preview');
    previewEl.innerHTML = "<span class='text-info'>Procesando transacción en servidor...</span>";
    try {
        const { ok, data } = await API.projection.registerOfrenda(tipo, montoStr, desc, anonima);
        if (ok) {
            document.getElementById('ofrenda-monto').value = '';
            document.getElementById('ofrenda-desc').value = '';
            document.getElementById('ofrenda-anonima').checked = false;
            const m = data.monto !== null ? data.monto : 'Sin monto';
            previewEl.innerHTML = `<span class='text-success fw-bold'>✅ Transacción Guardada. Tipo: ${data.tipo} | Monto: ${m}</span>`;
        } else {
            previewEl.innerHTML = `<span class='text-danger fw-bold'>❌ Transacción Rechazada: ${data.detail || 'Error de validación'}</span>`;
        }
    } catch (e) {
        previewEl.innerHTML = "<span class='text-danger fw-bold'>❌ Error fatal de conectividad.</span>";
    }
}

export async function uiMostrarTotalOfrendas() {
    try {
        const data = await API.projection.getTotalOfrendas();
        sendCommand('set_text', { title: 'Reporte Financiero', text: `Suma total consolidada:\n\n${data.total} ${data.moneda}` });
    } catch (e) { alert('Imposible calcular los totales desde el backend.'); }
}