import { API } from './api_client.js';
import { sendCommand } from './ws_client.js';

export const worshipState = {
    catalog: [],
    setlist: [],
    activeSong: null
};

export function fragmentarLetra(letra) {
    const lineas = letra.split('\n').map(l => l.trim()).filter(l => l !== '');
    const bloques = [];
    for (let i = 0; i < lineas.length; i += 2) {
        bloques.push(lineas.slice(i, i + 2).join('\n'));
    }
    return bloques;
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

        // Mapeo estricto contra la base de datos
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
        <div class="d-flex justify-content-between align-items-center bg-dark border border-secondary rounded p-2 mb-2">
            <span class="text-white fw-bold cursor-pointer flex-grow-1" onclick="loadLiveSong(${song.id})" style="cursor: pointer;">🎶 ${song.titulo}</span>
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
        <h6 class="text-info fw-bold mb-3">En Vivo: ${song.titulo}</h6>
        <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-warning fw-bold mb-2 w-100" onclick="clearLiveLyrics()">🧹 Limpiar Letra (Mantener Fondo)</button>
            <button class="btn btn-outline-light text-start p-2 w-100 fw-bold" onclick="sendCommand('set_text', {title: '${song.titulo.replace(/'/g, "\\'")}', text: ''})">
                [Mostrar Título]
            </button>
    `;

    fragmentos.forEach(bloque => {
        const safeText = bloque.replace(/'/g, "\\'").replace(/\n/g, "\\n");
        html += `
            <button class="btn btn-outline-info text-start p-2 w-100 lh-sm" onclick="sendCommand('set_text', {title: '', text: '${safeText}'})">
                ${bloque.replace(/\n/g, '<br>')}
            </button>
        `;
    });
    html += `</div>`;
    gridContainer.innerHTML = html;
}

export function clearLiveLyrics() {
    sendCommand('set_text', { title: '', text: '' });
}