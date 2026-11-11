let ws = null;
let slides = [];
let currentIndex = 0;
let mode = 'predica';
let bibleState = { libro: '', capitulo: 1, versiculo: 1, version: 'RVR1960' };

// Referencias DOM
const statusEl = document.getElementById('connection-status');
const predicaSidebar = document.getElementById('predica-sidebar');
const thumbList = document.getElementById('thumbnail-list');
const bibleControls = document.getElementById('bible-controls');
const modeLabel = document.getElementById('mode-label');
const bibleRef = document.getElementById('bible-reference');
const mainTitle = document.getElementById('current-title');
const mainText = document.getElementById('current-text');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

// ==================== TOGGLE UI ====================
window.updateToggleUI = function(activeMode) {
    const btnPredica = document.getElementById('mode-btn-predica');
    const btnBiblia = document.getElementById('mode-btn-biblia');
    const slider = document.getElementById('segmented-slider');
    if (!btnPredica || !btnBiblia || !slider) return;

    if (activeMode === 'predica') {
        btnPredica.classList.add('active');
        btnBiblia.classList.remove('active');
        slider.style.transform = 'translateX(0)';
    } else {
        btnBiblia.classList.add('active');
        btnPredica.classList.remove('active');
        slider.style.transform = 'translateX(100%)';
    }
};

// ==================== LÓGICA DE PRÉDICA ====================
async function loadSlides() {
    try {
        const res = await fetch('/api/predica/bosquejo');
        const data = await res.json();
        slides = data.diapositivas || [];
        if (mode === 'predica') renderPredicaUI();
    } catch (e) {
        console.error("Error cargando bosquejo:", e);
    }
}

function renderPredicaUI() {
    mode = 'predica';
    updateToggleUI('predica');
    document.body.classList.remove('mode-biblia');
    bibleControls.classList.add('d-none');
    predicaSidebar.classList.remove('d-none');
    modeLabel.textContent = 'EN PANTALLA (PRÉDICA)';
    bibleRef.classList.add('d-none');

    if (slides.length === 0) {
        thumbList.innerHTML = '<div class="text-muted text-center">No hay bosquejo</div>';
        mainTitle.textContent = 'Sin bosquejo';
        mainText.textContent = '';
        return;
    }
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= slides.length) currentIndex = slides.length - 1;

    const curr = slides[currentIndex];
    mainTitle.textContent = curr.titulo || '';
    mainText.textContent = curr.contenido || '';

    // Lógica de la Cita Bíblica
    let citaContainer = document.getElementById('current-cita');
    if (!citaContainer) {
        citaContainer = document.createElement('div');
        citaContainer.id = 'current-cita';
        citaContainer.style.marginTop = '1.5rem';
        mainText.parentNode.appendChild(citaContainer);
    }

    if (curr.cita) {
        const refs = curr.cita.split(/[;,]/).map(c => c.trim()).filter(Boolean);
        citaContainer.innerHTML = refs.map(ref => `<span class="bible-link" onclick="window.projectCita('${ref.replace(/'/g, "\\'")}')">${ref}</span>`).join(' ');
        citaContainer.style.display = 'block';
    } else {
        citaContainer.style.display = 'none';
        citaContainer.innerHTML = '';
    }

    btnPrev.disabled = currentIndex === 0;
    btnNext.disabled = currentIndex === slides.length - 1;

    thumbList.innerHTML = slides.map((slide, i) => `
        <div class="thumb-item ${i === currentIndex ? 'active' : ''}" onclick="goToSlide(${i})">
            <strong>${i + 1}.</strong> ${slide.titulo || 'Sin título'}
        </div>
    `).join('');
}

window.goToSlide = function(index) {
    if (mode !== 'predica' || index < 0 || index >= slides.length) return;
    currentIndex = index;
    renderPredicaUI();
    if (ws && ws.readyState === WebSocket.OPEN) {
        const curr = slides[currentIndex];
        ws.send(JSON.stringify({
            action: 'set_text',
            target: 'all',
            id: curr.id,
            title: curr.titulo,
            text: curr.contenido,
            cita: curr.cita || '',
            variant: 'predica'
        }));
    }
};

// ==================== LÓGICA DE BIBLIA ====================
function enterBibleMode(data) {
    mode = 'biblia';
    updateToggleUI('biblia');
    document.body.classList.add('mode-biblia');
    bibleControls.classList.remove('d-none');
    predicaSidebar.classList.add('d-none');

    if (data.libro_db && data.capitulo && data.versiculo) {
        bibleState = {
            libro: data.libro_db,
            capitulo: parseInt(data.capitulo),
            versiculo: parseInt(data.versiculo),
            version: data.version || 'RVR1960'
        };
    } else if (data.reference) {
        const match = data.reference.match(/^(.+?)\s(\d+):(\d+)$/);
        if (match) {
            bibleState = {
                libro: match[1].trim(),
                capitulo: parseInt(match[2]),
                versiculo: parseInt(match[3]),
                version: data.version || 'RVR1960'
            };
        }
    }

    document.getElementById('bible-version').value = bibleState.version;
    document.getElementById('bible-book').value = bibleState.libro;
    document.getElementById('bible-chapter').value = bibleState.capitulo;
    document.getElementById('bible-verse').value = bibleState.versiculo;

    bibleRef.classList.remove('d-none');
    const refStr = data.reference || `${bibleState.libro} ${bibleState.capitulo}:${bibleState.versiculo}`;
    bibleRef.textContent = `${refStr} — ${bibleState.version}`;

    mainTitle.textContent = '';
    mainText.textContent = data.text || '';
    btnPrev.disabled = false;
    btnNext.disabled = false;
}

window.switchView = function(newMode) {
    if (newMode === 'predica') {
        renderPredicaUI();
    } else if (newMode === 'biblia') {
        mode = 'biblia';
        document.body.classList.add('mode-biblia');
        bibleControls.classList.remove('d-none');
        predicaSidebar.classList.add('d-none');

        if (!bibleState.libro) {
            bibleState = { libro: 'Génesis', capitulo: 1, versiculo: 1, version: 'RVR1960' };
            document.getElementById('bible-version').value = 'RVR1960';
            document.getElementById('bible-book').value = 'Génesis';
            document.getElementById('bible-chapter').value = 1;
            document.getElementById('bible-verse').value = 1;
            bibleRef.classList.remove('d-none');
            bibleRef.textContent = 'Génesis 1:1';
            mainTitle.textContent = '';
            mainText.textContent = 'Selecciona un versículo para proyectar.';
        }
        updateToggleUI('biblia');
    }
};

// ==================== BÚSQUEDA Y NAVEGACIÓN BÍBLICA ====================
async function loadBibleBooks(version) {
    try {
        const res = await fetch(`/api/bible/books?version=${version}`);
        const data = await res.json();
        const datalist = document.getElementById('bible-books-list');
        if (res.ok && data.libros) {
            datalist.innerHTML = data.libros.map(libro => `<option value="${libro}">`).join('');
        }
    } catch (e) {
        console.error("Error cargando libros:", e);
    }
}

async function searchBible() {
    const libro = document.getElementById('bible-book').value.trim();
    const cap = document.getElementById('bible-chapter').value.trim();
    const ver = document.getElementById('bible-verse').value.trim();
    const version = document.getElementById('bible-version').value;

    if (!libro || !cap) { alert("Ingrese libro y capítulo"); return; }
    const query = ver ? `${cap}:${ver}` : cap;

    try {
        const res = await fetch(`/api/bible/search?libro=${encodeURIComponent(libro)}&capitulo=${encodeURIComponent(query)}&version=${version}`);
        const data = await res.json();

        if (res.ok) {
            const payload = {
                reference: data.referencia,
                text: data.texto,
                version: data.version,
                libro_db: data.libro_db,
                capitulo: data.capitulo,
                versiculo: data.versiculo_inicio
            };
            enterBibleMode(payload);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ action: 'bible_sync', ...payload }));
            }
        } else {
            alert(data.detail || "Versículo no encontrado");
        }
    } catch (e) { console.error(e); }
}

async function navigateBible(direction) {
    if (mode !== 'biblia' || !bibleState.libro) return;
    const btn = direction === 'next' ? btnNext : btnPrev;
    if (btn) btn.style.opacity = '0.4';

    try {
        const res = await fetch(`/api/bible/navigate?libro=${encodeURIComponent(bibleState.libro)}&capitulo=${bibleState.capitulo}&versiculo=${bibleState.versiculo}&direction=${direction}&version=${bibleState.version}`);
        const data = await res.json();

        if (res.ok) {
            const payload = {
                reference: data.referencia,
                text: data.texto,
                version: data.version,
                libro_db: data.libro_db,
                capitulo: data.capitulo,
                versiculo: data.versiculo
            };
            enterBibleMode(payload);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ action: 'bible_sync', ...payload }));
            }
        }
    } catch (e) {
        console.error("❌ Error navegando Biblia:", e);
    } finally {
        setTimeout(() => { if (btn) btn.style.opacity = ''; }, 300);
    }
}

// ==================== EVENTOS UI ====================
btnPrev.addEventListener('click', () => {
    if (mode === 'predica' && currentIndex > 0) goToSlide(currentIndex - 1);
    if (mode === 'biblia') navigateBible('prev');
});

btnNext.addEventListener('click', () => {
    if (mode === 'predica' && currentIndex < slides.length - 1) goToSlide(currentIndex + 1);
    if (mode === 'biblia') navigateBible('next');
});

document.getElementById('btn-search-bible').addEventListener('click', searchBible);

document.getElementById('bible-version').addEventListener('change', (e) => {
    const newVersion = e.target.value;
    loadBibleBooks(newVersion);
    if (mode === 'biblia' && bibleState.libro) {
        document.getElementById('bible-verse').value = bibleState.versiculo;
        searchBible();
    }
});

// ==================== PROYECTAR CITA DESDE EL TEXTO ====================
window.projectCita = async function(cita) {
    const version = document.getElementById('bible-version').value;
    const match = cita.match(/^((?:[1-3]\s*)?[A-Za-zÁÉÍÓÚÑáéíóúñ]+)\s*(\d+)(?::(\d+)(?:-(\d+))?)?$/);
    if (!match) return;
    const libro = match[1].trim();
    const capitulo = match[2];
    const versiculo = match[3] || '';
    const queryParam = versiculo ? `${capitulo}:${versiculo}` : capitulo;

    try {
        const res = await fetch(`/api/bible/search?libro=${encodeURIComponent(libro)}&capitulo=${encodeURIComponent(queryParam)}&version=${version}`);
        if (!res.ok) return;
        const data = await res.json();

        const payload = {
            reference: data.referencia,
            text: data.texto,
            version: data.version,
            libro_db: data.libro_db,
            capitulo: data.capitulo,
            versiculo: data.versiculo_inicio
        };
        enterBibleMode(payload);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'bible_sync', ...payload }));
        }
    } catch (e) {
        console.error("Error proyectando cita:", e);
    }
};

// ==================== WEBSOCKET ====================
function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}/ws/stage`);

    ws.onopen = () => {
        statusEl.textContent = '🟢 En Línea';
        statusEl.className = 'badge bg-success';
    };

    ws.onclose = () => {
        statusEl.textContent = '🔴 Reconectando...';
        statusEl.className = 'badge bg-danger';
        setTimeout(connect, 1000);
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);

            if (data.action === 'update_stage') {
                if (data.id) {
                    const idx = slides.findIndex(s => s.id === data.id);
                    if (idx !== -1) currentIndex = idx;
                }
                renderPredicaUI();
                mainTitle.textContent = data.current_title || '';
                mainText.textContent = data.current_text || '';

                const citaEl = document.getElementById('current-cita');
                if (citaEl) {
                    if (data.cita) {
                        const refs = data.cita.split(/[;,]/).map(c => c.trim()).filter(Boolean);
                        citaEl.innerHTML = refs.map(ref => `<span class="bible-link" onclick="window.projectCita('${ref.replace(/'/g, "\\'")}')">${ref}</span>`).join(' ');
                        citaEl.style.display = 'block';
                    } else {
                        citaEl.style.display = 'none';
                        citaEl.innerHTML = '';
                    }
                }
            }
            else if (data.action === 'show_bible_verse') {
                enterBibleMode({
                    reference: data.reference,
                    text: data.text,
                    version: data.version,
                    libro_db: data.libro_db,
                    capitulo: data.capitulo,
                    versiculo: data.versiculo
                });
            }
            else if (data.action === 'sync_stage') {
                const txt = data.state.text;
                if (txt.variant === 'biblia') {
                    enterBibleMode({ reference: txt.title, text: txt.text, version: txt.version, libro_db: txt.libro_db, capitulo: txt.capitulo, versiculo: txt.versiculo });
                } else if (txt.title) {
                    renderPredicaUI();
                }
            }
        } catch (e) {
            console.error(e);
        }
    };
}

// ==================== PANTALLA COMPLETA ====================
const btnFullscreen = document.getElementById('btn-fullscreen');
const iconExpand = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`;
const iconCompress = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>`;

btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err.message));
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
});

document.addEventListener('fullscreenchange', () => {
    btnFullscreen.innerHTML = document.fullscreenElement ? iconCompress : iconExpand;
});

// ==================== LISTENER GLOBAL ====================
window.addEventListener('project_verse', (e) => {
    enterBibleMode(e.detail);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'bible_sync', ...e.detail }));
    }
});

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    loadSlides();
    connect();
    loadBibleBooks(document.getElementById('bible-version').value);
});