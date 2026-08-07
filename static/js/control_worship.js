import { API } from './api_client.js';
import { sendCommand } from './ws_client.js';
import { enforceLiveScene } from './control_core.js';

export const worshipState = {
    catalog: [],
    setlist: [],
    activeSong: null
};

export function fragmentarLetra(letra) {
    // Reducción algorítmica: Un renglón por bloque, descartando saltos de línea vacíos
    return letra.split('\n').map(l => l.trim()).filter(l => l !== '');
}

export async function uiLoadSetlist() {
    const container = document.getElementById('worship-setlist-container');
    if (!container) return;

    container.innerHTML = '<p class="text-info small text-center mb-0">Sincronizando con servidor...</p>';

    try {
        const canciones = await API.canciones.getAll();
        worshipState.catalog = canciones;

        const setlistData = await API.canciones.getSetlist();
        const setlistIds = setlistData.canciones_ids || [];

        worshipState.setlist = setlistIds.map(id => canciones.find(c => c.id === id)).filter(Boolean);

        renderSetlist();
    } catch (e) {
        container.innerHTML = '<p class="text-danger small text-center mb-0">Fallo de red al sincronizar catálogo.</p>';
    }
}

export function renderSetlist() {
    const container = document.getElementById('worship-setlist-container');
    if (!container) return;

    if (worshipState.setlist.length === 0) {
        container.innerHTML = '<p class="text-muted small text-center mb-0">El administrador no ha publicado un Setlist para hoy.</p>';
        return;
    }

    container.innerHTML = worshipState.setlist.map(song => `
        <div class="d-flex justify-content-between align-items-center bg-dark border border-secondary rounded p-2 mb-2" style="transition: 0.2s;">
            <span class="text-white fw-bold flex-grow-1" onclick="window.loadLiveSong(${song.id})" style="cursor: pointer;">🎵 ${song.titulo}</span>
        </div>
    `).join('');
}

export function loadLiveSong(songId) {
    const song = worshipState.setlist.find(c => c.id === songId);
    if (!song) return;

    worshipState.activeSong = song;
    const gridContainer = document.getElementById('worship-live-grid');
    const fragmentos = fragmentarLetra(song.letra);

    let html = `
        <div class="card bg-black border-secondary shadow-sm mb-3">
            <div class="card-header border-secondary text-info fw-bold small">
                TRACK ACTIVO: ${song.titulo.toUpperCase()}
            </div>
            <div class="card-body p-2 d-flex flex-wrap gap-2">
                <button class="btn btn-warning fw-bold flex-grow-1 py-2 shadow-sm" onclick="window.clearLiveLyrics()">
                    🧹 Limpiar Pantalla
                </button>
                <button id="lyric-btn-title" class="btn btn-outline-light flex-grow-1 fw-bold py-2 shadow-sm lyric-trigger-btn" onclick="window.fireLyricTrigger('${song.titulo.replace(/'/g, "\\'")}', '', 'lyric-btn-title')">
                    [Proyectar Título]
                </button>
            </div>
        </div>
        <div class="d-flex flex-column gap-2" style="max-height: 50vh; overflow-y: auto; padding-right: 5px;">
    `;

    fragmentos.forEach((bloque, index) => {
        const safeText = bloque.replace(/'/g, "\\'").replace(/\n/g, "\\n");
        const btnId = `lyric-btn-${index}`;

        html += `
            <button id="${btnId}" class="btn btn-outline-secondary text-start p-3 w-100 lh-sm fs-6 fw-bold shadow-sm lyric-trigger-btn" style="transition: 0.2s;" onclick="window.fireLyricTrigger('', '${safeText}', '${btnId}')">
                ${bloque.replace(/\n/g, '<br>')}
            </button>
        `;
    });

    html += `</div>`;
    gridContainer.innerHTML = html;
}

export function fireLyricTrigger(title, text, btnId) {
    // 1. IMPONER ESCENA: Lee las variables locales del módulo Alabanzas (fondo) y corta audios residuales
    enforceLiveScene('alabanzas');

    // 2. Ejecución del comando de texto
    sendCommand('set_text', { title: title, text: text, variant: 'alabanzas' }, 'all');

    // 3. Limpieza visual en el panel de control
    document.querySelectorAll('.lyric-trigger-btn').forEach(btn => {
        btn.classList.remove('btn-danger', 'text-white', 'border-danger');
        if (btn.id === 'lyric-btn-title') {
            btn.classList.add('btn-outline-light');
        } else {
            btn.classList.add('btn-outline-secondary');
        }
    });

    // 4. Retroalimentación táctica
    const activeBtn = document.getElementById(btnId);
    if (activeBtn) {
        if (btnId === 'lyric-btn-title') {
            activeBtn.classList.remove('btn-outline-light');
        } else {
            activeBtn.classList.remove('btn-outline-secondary');
        }
        activeBtn.classList.add('btn-danger', 'text-white', 'border-danger');
    }
}

export function clearLiveLyrics() {
    // Mantener la contención de la escena visual y auditiva sin forzar pantalla negra
    enforceLiveScene('alabanzas');

    // Solo vaciar los textos
    sendCommand('set_text', { title: '', text: '', variant: 'alabanzas' }, 'all');

    document.querySelectorAll('.lyric-trigger-btn').forEach(btn => {
        btn.classList.remove('btn-danger', 'text-white', 'border-danger');
        if (btn.id === 'lyric-btn-title') {
            btn.classList.add('btn-outline-light');
        } else {
            btn.classList.add('btn-outline-secondary');
        }
    });
}

// Inyección global para garantizar la ejecución desde el DOM
window.loadLiveSong = loadLiveSong;
window.fireLyricTrigger = fireLyricTrigger;
window.clearLiveLyrics = clearLiveLyrics;