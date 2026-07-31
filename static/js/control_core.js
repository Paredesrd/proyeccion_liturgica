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

        const isDefault = savedUrl === '/static/media/backgrounds/default.webm' ? 'selected' : '';
        options += `<option value="/static/media/backgrounds/default.webm" ${isDefault}>★ [PREDETERMINADO] Fondo Base</option>`;

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

// ==================== LÓGICA DE SUBMÓDULOS OPERATIVOS ====================

export async function iniciarServicioPersonalizado() {
    const btn = document.getElementById('btn-init-servicio');
    let originalText = '';
    if (btn) {
        originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Procesando carga...';
        btn.disabled = true;
    }

    const titleEl = document.getElementById('init-title');
    const subtitleEl = document.getElementById('init-subtitle');

    const title = titleEl ? titleEl.value.trim() : localStorage.getItem('init_title') || 'Bienvenidos';
    const subtitle = subtitleEl ? subtitleEl.value.trim() : localStorage.getItem('init_subtitle') || 'El servicio comenzará en breve';

    let audioSrc = localStorage.getItem('init_audio_url') || '/static/media/audio/default_audio.mp3';
    let audioName = localStorage.getItem('init_audio_name') || '★ [PREDETERMINADO] Música Base';

    const fileInput = document.getElementById('init-audio-file');
    if (fileInput && fileInput.files.length > 0) {
        const uploadedUrl = await API.media.upload('init-audio-file', 'audio');
        if (uploadedUrl) {
            audioSrc = uploadedUrl;
            audioName = fileInput.files[0].name;
        }
    }

    localStorage.setItem('init_title', title);
    localStorage.setItem('init_subtitle', subtitle);
    localStorage.setItem('init_audio_url', audioSrc);
    localStorage.setItem('init_audio_name', audioName);

    const filenameDisplay = document.getElementById('init-audio-filename');
    if (filenameDisplay) {
        filenameDisplay.innerHTML = `🎧 Pista enlazada actualmente: <br><span class="text-white">${audioName}</span>`;
    }

    if (title || subtitle) sendCommand('set_text', { title: title, text: subtitle, variant: 'init' });
    if (audioSrc) sendCommand('play_media', { type: 'audio', src: audioSrc, volume: 0.5 });

    if (btn) {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }

    if (fileInput) fileInput.value = '';
}

export async function projectSaludo() {
    const btn = document.querySelector('button[onclick="projectSaludo()"]');
    let originalText = '';
    if (btn) {
        originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Procesando carga...';
        btn.disabled = true;
    }

    const titleEl = document.getElementById('saludo-title');
    const textEl = document.getElementById('saludo-text');

    const title = titleEl ? titleEl.value.trim() : localStorage.getItem('saludo_title') || '¡Bienvenidos!';
    const text = textEl ? textEl.value.trim() : localStorage.getItem('saludo_text') || 'Nos alegramos de verte hoy en la casa de Dios.';

    let audioSrc = localStorage.getItem('saludo_audio_url') || '/static/media/audio/default_audio.mp3';
    let audioName = localStorage.getItem('saludo_audio_name') || '★ [PREDETERMINADO] Música Base';

    const fileInput = document.getElementById('saludo-audio-file');
    if (fileInput && fileInput.files.length > 0) {
        const uploadedUrl = await API.media.upload('saludo-audio-file', 'audio');
        if (uploadedUrl) {
            audioSrc = uploadedUrl;
            audioName = fileInput.files[0].name;
        }
    }

    localStorage.setItem('saludo_title', title);
    localStorage.setItem('saludo_text', text);
    localStorage.setItem('saludo_audio_url', audioSrc);
    localStorage.setItem('saludo_audio_name', audioName);

    const filenameDisplay = document.getElementById('saludo-audio-filename');
    if (filenameDisplay) {
        filenameDisplay.innerHTML = `🎧 Pista enlazada actualmente: <br><span class="text-white">${audioName}</span>`;
    }

    sendCommand('set_text', { title: title, text: text, variant: 'saludo' });
    if (audioSrc) sendCommand('play_media', { type: 'audio', src: audioSrc, volume: 0.5 });

    if (btn) {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
    if (fileInput) fileInput.value = '';
}

/* ==================== MÓDULO BOSQUEJO (PRÉDICA) ==================== */
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

/* ==================== MÓDULO BÍBLICO (INDEPENDIENTE) ==================== */
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

        versionSelect.onchange = () => {
            localStorage.setItem('bible_selected_version', versionSelect.value);
        };

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

    if (!book || !chapter) {
        alert("⚠️ Por favor ingrese el libro y el capítulo.");
        return;
    }

    let queryParam = chapter;
    if (verse) {
        queryParam = `${chapter}:${verse}`;
    }

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

// Exposición imperativa para controladores globales en HTML
window.uiLoadBibleVersions = uiLoadBibleVersions;
window.uiProjectBible = uiProjectBible;

/* ==================== OTROS MÓDULOS ==================== */
export async function uiLoadBirthdayPreview() {
    const previewEl = document.getElementById('birthday-preview');
    previewEl.innerHTML = "<span class='text-info'>🔍 Localizando registros...</span>";
    try {
        const data = await API.projection.getBirthdays();
        if (data.cumpleanos && data.cumpleanos.length > 0) previewEl.innerHTML = `<span class='text-success fw-bold'>✅ ${data.cumpleanos.length} registros para la semana actual.</span>`;
        else previewEl.innerHTML = "<span class='text-secondary'>ℹ️ Cero registros en curso.</span>";
    } catch (e) { previewEl.innerHTML = "<span class='text-danger'>❌ Fallo crítico de datos.</span>"; }
}

export async function uiProjectBirthdays() {
    try {
        const data = await API.projection.getBirthdays();
        if (data.cumpleanos && data.cumpleanos.length > 0) sendCommand('load_birthdays', { birthdays: data.cumpleanos });
        else alert('No existen cumpleaños tabulados.');
    } catch (e) { alert('Fallo de comunicación con base de datos.'); }
}

export async function uiLoadAnunciosPreview() {
    const previewEl = document.getElementById('anuncios-preview');
    previewEl.innerHTML = "<span class='text-info'>🔍 Sincronizando anuncios...</span>";
    try {
        const data = await API.projection.getAnuncios();
        if (data.anuncios && data.anuncios.length > 0) previewEl.innerHTML = `<span class='text-success fw-bold'>✅ ${data.anuncios.length} anuncios activos.</span>`;
        else previewEl.innerHTML = "<span class='text-secondary'>ℹ️ Sin anuncios activos.</span>";
    } catch (e) { previewEl.innerHTML = "<span class='text-danger'>❌ Fallo de acceso a tabla.</span>"; }
}

export async function uiProjectAnuncios() {
    try {
        const data = await API.projection.getAnuncios();
        if (data.anuncios && data.anuncios.length > 0) sendCommand('load_anuncios', { anuncios: data.anuncios });
        else alert('No se encontraron anuncios activos.');
    } catch (e) { alert('Fallo de red al extraer anuncios.'); }
}

export async function uiRegistrarOfrenda() {
    const tipo = document.getElementById('ofrenda-tipo').value;
    const montoStr = document.getElementById('ofrenda-monto').value;
    const desc = document.getElementById('ofrenda-desc').value;
    const anonima = document.getElementById('ofrenda-anonima').checked;
    const previewEl = document.getElementById('ofrenda-preview');
    previewEl.innerHTML = "<span class='text-info'>Procesando transacción...</span>";
    try {
        const { ok, data } = await API.projection.registerOfrenda(tipo, montoStr, desc, anonima);
        if (ok) {
            document.getElementById('ofrenda-monto').value = '';
            document.getElementById('ofrenda-desc').value = '';
            document.getElementById('ofrenda-anonima').checked = false;
            const m = data.monto !== null ? data.monto : 'Sin monto';
            previewEl.innerHTML = `<span class='text-success fw-bold'>✅ Guardado. Tipo: ${data.tipo} | Monto: ${m}</span>`;
        } else previewEl.innerHTML = `<span class='text-danger fw-bold'>❌ Rechazado: ${data.detail}</span>`;
    } catch (e) { previewEl.innerHTML = "<span class='text-danger fw-bold'>❌ Error fatal de conectividad.</span>"; }
}

export async function uiMostrarTotalOfrendas() {
    try {
        const data = await API.projection.getTotalOfrendas();
        sendCommand('set_text', { title: 'Reporte Financiero', text: `Suma total consolidada:\n\n${data.total} ${data.moneda}` });
    } catch (e) { alert('Imposible calcular los totales desde el backend.'); }
}