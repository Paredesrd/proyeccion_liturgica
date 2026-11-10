import { initWebSocket, setWsActiveModule, sendCommand } from './ws_client.js';
import * as Worship from './control_worship.js';
import * as Core from './control_core.js';

window.activateModule = activateModule;
window.sendCommand = sendCommand;

window.applyModuleBackground = Core.applyModuleBackground;
window.uiLoadSetlist = Worship.uiLoadSetlist;
window.loadLiveSong = Worship.loadLiveSong;
window.clearLiveLyrics = Worship.clearLiveLyrics;

// Módulos especializados intocables
window.uiLoadBosquejo = Core.uiLoadBosquejo;
window.projectSlide = Core.projectSlide;
window.clearPredicaScreen = Core.clearPredicaScreen;
window.clearBibleScreen = Core.clearBibleScreen;
window.clearStandardScreen = Core.clearStandardScreen;
window.uiProjectBible = Core.uiProjectBible;

// Nuevo motor unificado optimizado
window.fireMasterTrigger = Core.fireMasterTrigger;
window.syncPreviewText = Core.syncPreviewText;
window.autoUploadAudio = Core.autoUploadAudio;
window.uiPreviewDatabaseData = Core.uiPreviewDatabaseData; // EXPOSICIÓN AL DOM

const activeModuleNameEl = document.getElementById('active-module-name');
const dynamicControlsEl = document.getElementById('dynamic-controls');

function activateModule(moduleName) {
    setWsActiveModule(moduleName);

    document.querySelectorAll('.module-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.module === moduleName) btn.classList.add('active');
    });

    if (activeModuleNameEl) {
        activeModuleNameEl.textContent = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    }

    sendCommand('set_module', { module: moduleName }, 'preview');
    renderDynamicControls(moduleName);
}

function getBgHtml(modId) {
    return `
        <div class="card bg-black border-secondary mb-3 shadow-sm">
            <div class="card-header border-secondary text-secondary fw-bold small">🖼️ FONDO VISUAL DEL MÓDULO</div>
            <div class="card-body">
                <select id="${modId}-bg-select" class="form-select border-secondary bg-dark text-white fw-bold" onchange="applyModuleBackground('${modId}')">
                    <option value="">Cargando catálogo...</option>
                </select>
            </div>
        </div>
    `;
}

// CORRECCIÓN ESTRUCTURAL: Nueva bandera 'hideTextParams' para módulos puros de base de datos
function getStandardModuleHtml(modId, titleLabel, hasDataPreview = false, hideTextParams = false) {
    const title = localStorage.getItem(`${modId}_title`) || '';
    const text = localStorage.getItem(`${modId}_text`) || '';
    const audioName = localStorage.getItem(`${modId}_audio_name`) || 'Ninguna pista enlazada';

    let html = `<div class="d-flex flex-column gap-3">`;

    if (!hideTextParams) {
        html += `
            <div class="card bg-black border-secondary shadow-sm">
                <div class="card-header border-secondary text-secondary fw-bold small">1. PARÁMETROS DE TEXTO</div>
                <div class="card-body">
                    <input type="text" id="${modId}-title" placeholder="${titleLabel} (Título)" class="form-control border-secondary bg-dark text-white mb-2 fw-bold" value="${title}" oninput="syncPreviewText('${modId}')">
                    <textarea id="${modId}-text" placeholder="Texto Secundario (Opcional)" class="form-control border-secondary bg-dark text-white" rows="2" oninput="syncPreviewText('${modId}')">${text}</textarea>
                </div>
            </div>
        `;
    }

    // Auto-ajuste de numeración de pasos
    const audioStep = hideTextParams ? "1" : "2";
    html += `
        <div class="card bg-black border-secondary shadow-sm">
            <div class="card-header border-secondary text-secondary fw-bold small">${audioStep}. AUDIO DE FONDO</div>
            <div class="card-body">
                <label for="${modId}-audio-file" class="btn btn-outline-secondary w-100 mb-1 text-start" style="cursor: pointer;">
                    📁 Cargar pista de audio (Autoguardado)
                </label>
                <input type="file" id="${modId}-audio-file" class="d-none" accept="audio/*" onchange="autoUploadAudio('${modId}')">
                <div id="${modId}-audio-filename" class="text-info small text-break mt-2">
                    🎧 Pista asignada en sistema: <br><span class="text-white fw-bold">${audioName}</span>
                </div>
            </div>
        </div>
    `;

    if (hasDataPreview) {
        const dbStep = hideTextParams ? "2" : "3";
        html += `
            <div class="card bg-black border-secondary shadow-sm">
                <div class="card-header border-secondary text-secondary fw-bold small">${dbStep}. DATOS DE BASE DE DATOS</div>
                <div class="card-body p-2 text-center" id="${modId}-preview">
                    <span class='text-info small fw-bold'>🔍 Cargando registros del sistema...</span>
                </div>
            </div>
        `;
    }

    html += `
            <div class="d-flex flex-column gap-2 mt-2">
                <button id="btn-${modId}-fire" onclick="fireMasterTrigger('${modId}')" class="btn btn-danger w-100 fw-bold py-3 fs-5 shadow-sm">
                    🔴 PROYECTAR EN VIVO
                </button>
                <button onclick="window.clearStandardScreen('${modId}')" class="btn btn-warning w-100 fw-bold py-2 shadow-sm">
                    🧹 Limpiar Pantalla
                </button>
            </div>
        </div>
    `;
    return html;
}

async function renderDynamicControls(moduleName) {
    if (!dynamicControlsEl) return;

    const modIdMap = {
        'inicializacion': 'init',
        'saludos': 'saludo',
        'cenia': 'cenia',
        'cumpleanos': 'cumpleanos',
        'anuncios': 'anuncios',
        'alabanzas': 'alabanzas',
        'predica': 'predica',
        'biblia': 'biblia',
        'ofrendas': 'ofrendas'
    };
    const modId = modIdMap[moduleName] || moduleName;

    let html = getBgHtml(modId);

    if (modId === 'init') {
        html += getStandardModuleHtml(modId, 'Ej. Bienvenidos');
    } else if (modId === 'saludo') {
        html += getStandardModuleHtml(modId, 'Ej. ¡Dios les bendiga!');
    } else if (modId === 'cenia') {
        html += getStandardModuleHtml(modId, 'Ej. Santa Cena');
    } else if (modId === 'cumpleanos') {
        // Ejecución aislada: No requiere texto estático
        html += getStandardModuleHtml(modId, '', true, true);
    } else if (modId === 'anuncios') {
        // Ejecución aislada: No requiere texto estático
        html += getStandardModuleHtml(modId, '', true, true);
    } else if (modId === 'ofrendas') {
        html += getStandardModuleHtml(modId, 'Ej. Tiempo de Ofrendas');
    } else if (modId === 'alabanzas') {
        html += `
            <div class="d-flex flex-column gap-3">
                <div class="card bg-black border-secondary shadow-sm">
                    <div class="card-header border-secondary text-secondary fw-bold small d-flex justify-content-between align-items-center">
                        <span>2. SETLIST DEL DÍA</span>
                        <button class="btn btn-sm btn-outline-info py-0 px-2 fw-bold" onclick="uiLoadSetlist()">🔄 Refrescar</button>
                    </div>
                    <div class="card-body">
                        <div id="worship-setlist-container"><p class="text-muted small text-center mb-0">Cargando datos...</p></div>
                    </div>
                </div>
                <div class="card bg-black border-secondary shadow-sm">
                    <div class="card-header border-secondary text-secondary fw-bold small">3. CONTROL EN VIVO</div>
                    <div class="card-body" id="worship-live-grid">
                        <p class="text-muted small text-center mb-0">Seleccione una canción para cargar la letra.</p>
                    </div>
                </div>
            </div>
        `;
    } else if (modId === 'predica') {
        html += `
            <div class="d-flex flex-column gap-3">
                <div class="card bg-black border-secondary shadow-sm">
                    <div class="card-header border-secondary text-secondary fw-bold small d-flex justify-content-between align-items-center">
                        <span>1. BOSQUEJO DE LA PRÉDICA</span>
                        <button class="btn btn-sm btn-outline-info py-0 px-2 fw-bold" onclick="uiLoadBosquejo()">🔄 Refrescar</button>
                    </div>
                    <div class="card-body">
                        <div id="predica-slide-grid" class="d-flex flex-wrap gap-2 mb-3">
                            <p class="text-muted small text-center mb-0 w-100">Sincronizando bosquejo...</p>
                        </div>
                        <button class="btn btn-warning w-100 fw-bold py-2 shadow-sm" onclick="window.clearPredicaScreen()">
                            🧹 Limpiar Pantalla
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else if (modId === 'biblia') {
        let savedVersion = localStorage.getItem('bible_selected_version') || 'RVR1960';
        html += `
            <div class="d-flex flex-column gap-3">
                <div class="card bg-black border-secondary shadow-sm">
                    <div class="card-header border-secondary text-secondary fw-bold small d-flex justify-content-between align-items-center">
                            <span>BUSCADOR BÍBLICO RÁPIDO</span>
                            <button class="btn btn-sm btn-outline-warning py-0 px-2 fw-bold" onclick="window.openTextSearch()" title="Buscar por texto completo (Ctrl+K)">🔍 Texto</button>
                        </div>
                    <div class="card-body">
                        <div class="row g-2">
                            <div class="col-12">
                                <select id="bible-version-select" class="form-select border-secondary bg-dark text-warning fw-bold mb-2">
                                    <option value="${savedVersion}">Cargando versiones...</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <input type="text" id="bible-book" list="bible-books-list" placeholder="Libro (Ej. gen, 1cor, apoc)" class="form-control border-secondary bg-dark text-white fw-bold">
                                <datalist id="bible-books-list"></datalist>
                            </div>
                            <div class="col-6"><input type="text" id="bible-chapter" placeholder="Capítulo (Ej. 3)" class="form-control border-secondary bg-dark text-white"></div>
                            <div class="col-6"><input type="text" id="bible-verse" placeholder="Versículo (Ej. 16)" class="form-control border-secondary bg-dark text-white"></div>
                            <div class="col-12 mt-3 d-flex gap-2">
                                <button onclick="uiProjectBible()" class="btn btn-danger flex-grow-1 fw-bold py-2 shadow-sm">🔴 PROYECTAR EN VIVO</button>
                                <button onclick="window.clearBibleScreen()" class="btn btn-outline-warning py-2">🧹 Limpiar</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    dynamicControlsEl.innerHTML = html;

    Core.uiLoadModuleBackgrounds(modId);

    if (modId === 'cumpleanos' || modId === 'anuncios') {
        Core.uiPreviewDatabaseData(modId);
    }

    if (modId === 'alabanzas') Worship.uiLoadSetlist();
    else if (modId === 'predica') Core.uiLoadBosquejo();
    else if (modId === 'biblia') Core.uiLoadBibleVersions();
    else if (['init', 'saludo', 'cenia', 'cumpleanos', 'anuncios', 'ofrendas'].includes(modId)) {
        Core.syncPreviewText(modId);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initWebSocket('connection-status');
    sendCommand('clear', {}, 'all');

    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'monitor_scroll') {
            sendCommand('sync_scroll', { scrollTop: event.data.scrollTop }, 'all');
        }
    });
});