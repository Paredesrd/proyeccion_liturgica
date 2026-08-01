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
window.uiProjectBible = Core.uiProjectBible;
window.uiRegistrarOfrenda = Core.uiRegistrarOfrenda;
window.uiMostrarTotalOfrendas = Core.uiMostrarTotalOfrendas;

// Nuevo motor unificado
window.updateStandardModuleConfig = Core.updateStandardModuleConfig;
window.toggleModuleMute = Core.toggleModuleMute;

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

    sendCommand('set_module', { module: moduleName });
    renderDynamicControls(moduleName);
}

function getBgHtml(moduleName) {
    return `
        <div class="card bg-black border-secondary mb-3 shadow-sm">
            <div class="card-header border-secondary text-secondary fw-bold small">🖼️ FONDO VISUAL DEL MÓDULO</div>
            <div class="card-body">
                <select id="${moduleName}-bg-select" class="form-select border-secondary bg-dark text-white fw-bold" onchange="applyModuleBackground('${moduleName}')">
                    <option value="">Cargando catálogo...</option>
                </select>
            </div>
        </div>
    `;
}

function getStandardModuleHtml(modId, titleLabel, hasDataPreview = false) {
    // ESTADO CERO: Valores directamente de localStorage o vacíos absolutos.
    const title = localStorage.getItem(`${modId}_title`) || '';
    const text = localStorage.getItem(`${modId}_text`) || '';
    const audioName = localStorage.getItem(`${modId}_audio_name`) || 'Ninguna pista enlazada';
    const isMuted = localStorage.getItem(`${modId}_audio_muted`) === 'true';

    let html = `
        <div class="d-flex flex-column gap-3">
            <div class="card bg-black border-secondary shadow-sm">
                <div class="card-header border-secondary text-secondary fw-bold small">1. PARÁMETROS DE TEXTO</div>
                <div class="card-body">
                    <input type="text" id="${modId}-title" placeholder="${titleLabel} (Título)" class="form-control border-secondary bg-dark text-white mb-2 fw-bold" value="${title}">
                    <textarea id="${modId}-text" placeholder="Texto Secundario (Opcional)" class="form-control border-secondary bg-dark text-white" rows="2">${text}</textarea>
                </div>
            </div>
            <div class="card bg-black border-secondary shadow-sm">
                <div class="card-header border-secondary text-secondary fw-bold small">2. AUDIO DE FONDO</div>
                <div class="card-body">
                    <label for="${modId}-audio-file" class="btn btn-outline-secondary w-100 mb-1 text-start" style="cursor: pointer;">
                        📁 Cargar o cambiar pista de audio
                    </label>
                    <input type="file" id="${modId}-audio-file" class="d-none" accept="audio/*" onchange="document.getElementById('${modId}-audio-filename').innerHTML = '📄 Archivo preparado (Requiere Actualizar): <br><span class=\\'text-warning\\'>' + this.files[0].name + '</span>';">

                    <div id="${modId}-audio-filename" class="text-info small text-break mt-2">
                        🎧 Pista asignada en sistema: <br><span class="text-white fw-bold">${audioName}</span>
                    </div>
                    <button id="btn-${modId}-mute" onclick="toggleModuleMute('${modId}')" class="btn ${isMuted ? 'btn-danger' : 'btn-success'} w-100 fw-bold mt-3 shadow-sm">
                        ${isMuted ? '🔇 Audio Silenciado (Click para Activar)' : '🔊 Audio Activo (Click para Silenciar)'}
                    </button>
                </div>
            </div>
    `;

    if (hasDataPreview) {
        html += `
            <div class="card bg-black border-secondary shadow-sm">
                <div class="card-header border-secondary text-secondary fw-bold small">3. DATOS DE BASE DE DATOS</div>
                <div class="card-body p-2 text-center" id="${modId}-preview">
                    <span class='text-info small fw-bold'>🔍 Cargando registros del sistema...</span>
                </div>
            </div>
        `;
    }

    html += `
            <button id="btn-${modId}-update" onclick="updateStandardModuleConfig('${modId}')" class="btn btn-primary w-100 fw-bold py-3 fs-5 shadow-sm mt-2">
                🔄 Actualizar Multimedia
            </button>
        </div>
    `;
    return html;
}

async function renderDynamicControls(moduleName) {
    if (!dynamicControlsEl) return;

    let html = getBgHtml(moduleName);

    // INYECCIÓN UNIFICADA O ESPECIALIZADA SEGÚN EL MÓDULO
    if (moduleName === 'inicializacion') {
        html += getStandardModuleHtml('init', 'Ej. Bienvenidos');
    } else if (moduleName === 'saludos') {
        html += getStandardModuleHtml('saludo', 'Ej. ¡Dios les bendiga!');
    } else if (moduleName === 'cenia') {
        html += getStandardModuleHtml('cenia', 'Ej. Santa Cena');
    } else if (moduleName === 'cumpleanos') {
        html += getStandardModuleHtml('cumpleanos', 'Ej. ¡Feliz Cumpleaños!', true);
    } else if (moduleName === 'anuncios') {
        html += getStandardModuleHtml('anuncios', 'Ej. Anuncios Generales', true);
    } else if (moduleName === 'alabanzas') {
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
    } else if (moduleName === 'predica') {
        html += `
            <div class="d-flex flex-column gap-3">
                <div class="card bg-black border-secondary shadow-sm">
                    <div class="card-header border-secondary text-secondary fw-bold small d-flex justify-content-between align-items-center">
                        <span>1. BOSQUEJO DE LA PRÉDICA</span>
                        <button class="btn btn-sm btn-outline-info py-0 px-2 fw-bold" onclick="uiLoadBosquejo()">🔄 Refrescar</button>
                    </div>
                    <div class="card-body">
                        <div id="predica-slide-grid" class="d-flex flex-wrap gap-2">
                            <p class="text-muted small text-center mb-0 w-100">Sincronizando bosquejo...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (moduleName === 'biblia') {
        let savedVersion = localStorage.getItem('bible_selected_version') || 'RVR1960';
        html += `
            <div class="d-flex flex-column gap-3">
                <div class="card bg-black border-secondary shadow-sm">
                    <div class="card-header border-secondary text-secondary fw-bold small">BUSCADOR BÍBLICO RÁPIDO</div>
                    <div class="card-body">
                        <div class="row g-2">
                            <div class="col-12">
                                <select id="bible-version-select" class="form-select border-secondary bg-dark text-warning fw-bold mb-2">
                                    <option value="${savedVersion}">Cargando versiones...</option>
                                </select>
                            </div>
                            <div class="col-12"><input type="text" id="bible-book" placeholder="Libro (Ej. gen, 1cor, apoc)" class="form-control border-secondary bg-dark text-white fw-bold"></div>
                            <div class="col-6"><input type="text" id="bible-chapter" placeholder="Capítulo (Ej. 3)" class="form-control border-secondary bg-dark text-white"></div>
                            <div class="col-6"><input type="text" id="bible-verse" placeholder="Versículo (Ej. 16)" class="form-control border-secondary bg-dark text-white"></div>
                            <div class="col-12 mt-3 d-flex gap-2">
                                <button onclick="uiProjectBible()" class="btn btn-success flex-grow-1 fw-bold py-2 shadow-sm">📖 Mostrar Versículo</button>
                                <button onclick="sendCommand('clear', {})" class="btn btn-outline-warning py-2">🧹 Limpiar</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (moduleName === 'ofrendas') {
        html += `
            <div class="d-flex flex-column gap-3">
                <div class="card bg-black border-secondary shadow-sm">
                    <div class="card-header border-secondary text-secondary fw-bold small">REGISTRO FINANCIERO</div>
                    <div class="card-body">
                        <div class="row g-2">
                            <div class="col-12">
                                <select id="ofrenda-tipo" class="form-select border-secondary bg-dark text-white">
                                    <option value="Ofrenda">Ofrenda General</option>
                                    <option value="Diezmo">Diezmo</option>
                                    <option value="Primicias">Primicias</option>
                                </select>
                            </div>
                            <div class="col-12"><input type="number" id="ofrenda-monto" placeholder="Monto (Ej. 100)" class="form-control border-secondary bg-dark text-white" min="0"></div>
                            <div class="col-12"><input type="text" id="ofrenda-desc" placeholder="Descripción (Opcional)" class="form-control border-secondary bg-dark text-white"></div>
                            <div class="col-12 mt-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="ofrenda-anonima">
                                    <label class="form-check-label text-white" for="ofrenda-anonima">Registro Anónimo</label>
                                </div>
                            </div>
                            <div class="col-12 mt-3"><button onclick="uiRegistrarOfrenda()" class="btn btn-success w-100 fw-bold">💾 Guardar Registro</button></div>
                        </div>
                    </div>
                </div>
                <div id="ofrenda-preview" class="p-2 bg-black border border-secondary rounded text-center small text-muted">Panel de estado</div>
                <div class="d-flex flex-column gap-2 mt-2">
                    <button onclick="sendCommand('set_text', { title: 'Ofrendas', text: 'Momento de ofrendas\\n\\n\\'Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre.\\' - 2 Corintios 9:7' })" class="btn btn-primary fw-bold">💰 Proyectar Titulo Ofrendas</button>
                    <button onclick="uiMostrarTotalOfrendas()" class="btn btn-outline-info fw-bold">📊 Proyectar Total Recaudado</button>
                </div>
            </div>
        `;
    }

    dynamicControlsEl.innerHTML = html;

    Core.uiLoadModuleBackgrounds(moduleName);

    if (moduleName === 'alabanzas') Worship.uiLoadSetlist();
    else if (moduleName === 'predica') Core.uiLoadBosquejo();
    else if (moduleName === 'biblia') Core.uiLoadBibleVersions();
    else if (moduleName === 'inicializacion') Core.projectInicializacion();
    else if (moduleName === 'saludos') Core.projectSaludos();
    else if (moduleName === 'cenia') Core.projectSantaCena();
    else if (moduleName === 'cumpleanos') Core.projectCumpleanos();
    else if (moduleName === 'anuncios') Core.projectAnuncios();
}

document.addEventListener('DOMContentLoaded', () => {
    initWebSocket('connection-status');
    sendCommand('clear', {});

    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'monitor_scroll') {
            sendCommand('sync_scroll', { scrollTop: event.data.scrollTop });
        }
    });
});