import { API } from './api_client.js?v=2'; // <-- Cache-buster inyectado

// Exposición imperativa al DOM Window
window.eliminarFondo = eliminarFondo;
window.eliminarCumpleanos = eliminarCumpleanos;
window.cambiarEstadoAnuncio = cambiarEstadoAnuncio;
window.eliminarAnuncio = eliminarAnuncio;
window.eliminarCancion = eliminarCancion;
window.agregarASetlist = agregarASetlist;
window.quitarDeSetlist = quitarDeSetlist;
window.guardarSetlistEnServidor = guardarSetlistEnServidor;
window.eliminarSlideBosquejo = eliminarSlideBosquejo;
window.guardarBosquejoEnServidor = guardarBosquejoEnServidor;

let globalCatalog = [];
let currentSetlistIds = [];
let bosquejoSlides = [];

const getHeaders = (isJson = true) => {
    const h = { 'X-API-Key': 'cambiar-esto-en-produccion-inmediatamente' };
    if (isJson) h['Content-Type'] = 'application/json';
    return h;
};

// ==================== INICIALIZACIÓN BLINDADA CONTRA RACE CONDITIONS ====================
async function initAdminPanel() {
    cargarFondos();
    cargarCumpleanos();
    cargarAnuncios();
    cargarCanciones();

    try {
        const predicaRes = await API.predica.getBosquejo();
        bosquejoSlides = predicaRes.diapositivas || [];
        renderTablaBosquejo();
    } catch (e) {
        console.error("Error al sincronizar bosquejo:", e);
    }

    const formFondos = document.getElementById('form-fondos');
    if (formFondos) {
        formFondos.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-upload-bg');
            const status = document.getElementById('upload-status');
            const originalText = btn.innerText;

            btn.innerText = '⏳ Subiendo...';
            btn.disabled = true;
            status.innerText = '';

            const uploadedUrl = await API.media.upload('input-bg-file', 'backgrounds');

            if (uploadedUrl) {
                status.innerText = '✅ Fondo subido exitosamente.';
                status.style.color = '#16a34a';
                formFondos.reset();
                cargarFondos(); // Refresca la cuadrícula inmediatamente
            } else {
                status.innerText = '❌ Fallo crítico de validación o red.';
                status.style.color = '#dc2626';
            }
            btn.innerText = originalText;
            btn.disabled = false;
        });
    }

    const formCumpleanos = document.getElementById('form-cumpleanos');
    if (formCumpleanos) {
        formCumpleanos.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('input-nombre').value;
            const fecha = document.getElementById('input-fecha').value;

            try {
                const response = await fetch('/api/admin/birthdays', {
                    method: 'POST',
                    headers: getHeaders(true),
                    body: JSON.stringify({ nombre, fecha })
                });
                if (response.ok) { formCumpleanos.reset(); cargarCumpleanos(); }
            } catch (error) { console.error(error); }
        });
    }

    const formAnuncios = document.getElementById('form-anuncios');
    if (formAnuncios) {
        formAnuncios.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titulo = document.getElementById('input-titulo-anuncio').value;
            const contenido = document.getElementById('input-contenido-anuncio').value;

            const activoCheck = document.getElementById('input-activo-anuncio');
            const activo = activoCheck ? activoCheck.checked : false;

            try {
                const response = await fetch('/api/admin/anuncios', {
                    method: 'POST',
                    headers: getHeaders(true),
                    body: JSON.stringify({ titulo, contenido, activo: activo })
                });
                if (response.ok) { formAnuncios.reset(); cargarAnuncios(); }
            } catch (error) { console.error(error); }
        });
    }

    const formCanciones = document.getElementById('form-canciones');
    if (formCanciones) {
        formCanciones.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titulo = document.getElementById('input-titulo-cancion').value;
            const letra = document.getElementById('input-letra-cancion').value;

            try {
                const response = await fetch('/api/admin/canciones', {
                    method: 'POST',
                    headers: getHeaders(true),
                    body: JSON.stringify({ titulo: titulo, letra: letra, autor: "" })
                });
                if (response.ok) { formCanciones.reset(); cargarCanciones(); }
            } catch (error) { console.error(error); }
        });
    }

    const formBosquejo = document.getElementById('form-bosquejo');
    if (formBosquejo) {
        formBosquejo.addEventListener('submit', (e) => {
            e.preventDefault();
            const titulo = document.getElementById('input-titulo-slide').value;
            const contenido = document.getElementById('input-contenido-slide').value;
            bosquejoSlides.push({ id: Date.now(), titulo, contenido });
            formBosquejo.reset();
            renderTablaBosquejo();
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPanel);
} else {
    initAdminPanel();
}

/* ==================== MÓDULO FONDOS MULTIMEDIA ==================== */
async function cargarFondos() {
    try {
        const data = await API.media.getBackgrounds();
        renderizarGaleriaFondos(data.backgrounds);
    } catch(e) {
        document.getElementById('galeria-fondos').innerHTML = '<p class="text-danger text-center w-100 fw-bold">Error al conectar con la base de datos de fondos.</p>';
    }
}

function renderizarGaleriaFondos(fondos) {
    const container = document.getElementById('galeria-fondos');
    if (!fondos || fondos.length === 0) {
        container.innerHTML = '<p class="text-muted text-center w-100">Catálogo vacío. Suba archivos para comenzar.</p>';
        return;
    }

    container.innerHTML = fondos.map(fondo => {
        const isVideo = fondo.filename.match(/\.(mp4|webm)$/i);
        const previewHtml = isVideo
            ? `<video src="${fondo.url}" class="card-img-top object-fit-cover border-bottom border-secondary" style="height: 140px; background: #000;" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`
            : `<img src="${fondo.url}" class="card-img-top object-fit-cover border-bottom border-secondary" style="height: 140px; background: #000;">`;

        return `
        <div class="col-sm-6 col-md-4 col-lg-3">
            <div class="card bg-black border-secondary h-100 shadow-sm">
                ${previewHtml}
                <div class="card-body p-2 d-flex flex-column justify-content-between">
                    <p class="text-white small text-truncate mb-2 fw-bold" title="${fondo.filename}">${fondo.filename}</p>
                    <button class="btn btn-sm btn-outline-danger w-100 fw-bold" onclick="eliminarFondo('${fondo.raw_filename}')">🗑️ Eliminar</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

async function eliminarFondo(filename) {
    if(!confirm('¿Destruir este fondo permanentemente? Esto afectará a los módulos que lo usen.')) return;
    const success = await API.media.deleteBackground(filename);
    if(success) {
        cargarFondos();
    } else {
        alert("Error de permisos o red al eliminar el archivo.");
    }
}

/* ==================== MÓDULO BOSQUEJO ==================== */
function renderTablaBosquejo() {
    const tbody = document.querySelector('#tabla-bosquejo tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    bosquejoSlides.forEach((slide, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><strong>${slide.titulo}</strong></td>
            <td style="white-space: pre-wrap; font-size: 0.9em;">${slide.contenido}</td>
            <td><button class="btn-danger" style="padding: 0.3rem 0.6rem;" onclick="eliminarSlideBosquejo(${slide.id})">❌</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function eliminarSlideBosquejo(id) {
    bosquejoSlides = bosquejoSlides.filter(s => s.id !== id);
    renderTablaBosquejo();
}

async function guardarBosquejoEnServidor() {
    const btn = document.querySelector('button[onclick="guardarBosquejoEnServidor()"]');
    const origText = btn.innerText;
    btn.innerText = 'Sincronizando...';
    btn.disabled = true;

    const success = await API.predica.saveBosquejo(bosquejoSlides);
    if(success) {
        btn.innerText = '✅ Bosquejo Publicado';
        setTimeout(() => { btn.innerText = origText; btn.disabled = false; }, 2000);
    } else {
        alert("Error de red al guardar el Bosquejo");
        btn.innerText = origText;
        btn.disabled = false;
    }
}

/* ==================== MÓDULO CANCIONES & SETLIST ==================== */
async function cargarCanciones() {
    try {
        const response = await fetch('/api/admin/canciones', { headers: getHeaders(false) });
        if (!response.ok) throw new Error(`Error HTTP`);
        globalCatalog = await response.json();

        const setlistRes = await API.canciones.getSetlist();
        currentSetlistIds = setlistRes.canciones_ids || [];

        renderizarTablasMusica();
    } catch (error) { console.error('Error al cargar datos musicales:', error); }
}

function renderizarTablasMusica() {
    const tbodyCat = document.querySelector('#tabla-canciones tbody');
    const tbodySet = document.querySelector('#tabla-setlist tbody');
    if (!tbodyCat || !tbodySet) return;

    tbodyCat.innerHTML = '';
    tbodySet.innerHTML = '';

    globalCatalog.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.titulo}</strong></td>
            <td style="display: flex; gap: 5px;">
                <button class="btn-primary" style="padding: 0.3rem 0.6rem; background: #10b981;" onclick="agregarASetlist(${item.id})">Añadir ➡️</button>
                <button class="btn-danger" style="padding: 0.3rem 0.6rem;" onclick="eliminarCancion(${item.id})">Borrar</button>
            </td>
        `;
        tbodyCat.appendChild(tr);
    });

    currentSetlistIds.forEach(id => {
        const song = globalCatalog.find(c => c.id === id);
        if(song) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>🎶 <strong>${song.titulo}</strong></td>
                <td><button class="btn-danger" style="padding: 0.3rem 0.6rem;" onclick="quitarDeSetlist(${song.id})">❌</button></td>
            `;
            tbodySet.appendChild(tr);
        }
    });
}

function agregarASetlist(id) {
    if(!currentSetlistIds.includes(id)) {
        currentSetlistIds.push(id);
        renderizarTablasMusica();
    }
}

function quitarDeSetlist(id) {
    currentSetlistIds = currentSetlistIds.filter(setId => setId !== id);
    renderizarTablasMusica();
}

async function guardarSetlistEnServidor() {
    const btn = document.querySelector('button[onclick="guardarSetlistEnServidor()"]');
    const origText = btn.innerText;
    btn.innerText = 'Sincronizando...';
    btn.disabled = true;

    const success = await API.canciones.saveSetlist(currentSetlistIds);
    if(success) {
        btn.innerText = '✅ Setlist Publicado';
        setTimeout(() => { btn.innerText = origText; btn.disabled = false; }, 2000);
    } else {
        alert("Error de red al guardar el Setlist");
        btn.innerText = origText;
        btn.disabled = false;
    }
}

async function eliminarCancion(id) {
    if (!confirm('¿Eliminar esta canción del catálogo?')) return;
    try {
        const res = await fetch(`/api/admin/canciones/${id}`, {
            method: 'DELETE',
            headers: getHeaders(false)
        });
        if (res.ok) {
            currentSetlistIds = currentSetlistIds.filter(setId => setId !== id);
            cargarCanciones();
        }
    } catch (error) { console.error(error); }
}

/* ==================== OTROS MÓDULOS ==================== */
async function cargarCumpleanos() {
    try {
        const response = await fetch('/api/admin/birthdays', { headers: getHeaders(false) });
        if (!response.ok) throw new Error(`Error HTTP`);
        renderizarTablaCumpleanos(await response.json());
    } catch (error) { console.error(error); }
}

function renderizarTablaCumpleanos(data) {
    const tbody = document.querySelector('#tabla-cumpleanos tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    data.forEach(item => {
        const tr = document.createElement('tr');
        let badge = '';
        if (item.es_hoy) {
            badge = ' <span style="color: #ef4444; font-weight: bold; font-size: 0.8em; margin-left: 8px;">[HOY]</span>';
        } else if (item.es_manana) {
            badge = ' <span style="color: #f59e0b; font-weight: bold; font-size: 0.8em; margin-left: 8px;">[MAÑANA]</span>';
        }

        tr.innerHTML = `<td>${item.nombre}${badge}</td><td>${item.fecha}</td>
            <td><button class="btn-danger" onclick="eliminarCumpleanos(${item.id})">Eliminar</button></td>`;
        tbody.appendChild(tr);
    });
}

async function eliminarCumpleanos(id) {
    if (!confirm('¿Eliminar registro?')) return;
    try {
        const res = await fetch(`/api/admin/birthdays/${id}`, {
            method: 'DELETE',
            headers: getHeaders(false)
        });
        if (res.ok) cargarCumpleanos();
    } catch (error) { console.error(error); }
}

async function cargarAnuncios() {
    try {
        const response = await fetch('/api/admin/anuncios', { headers: getHeaders(false) });
        if (!response.ok) throw new Error(`Error HTTP`);
        renderizarTablaAnuncios(await response.json());
    } catch (error) { console.error(error); }
}

function renderizarTablaAnuncios(data) {
    const tbody = document.querySelector('#tabla-anuncios tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    data.forEach(item => {
        const tr = document.createElement('tr');
        const estado = item.activo ? '🟢 Activo' : '🔴 Inactivo';
        const toggleBtn = item.activo ? 'Desactivar' : 'Activar';
        tr.innerHTML = `
            <td><strong>${item.titulo}</strong></td><td>${item.contenido}</td><td>${estado}</td>
            <td style="display: flex; gap: 10px;">
                <button class="btn-primary" style="padding: 0.5rem 1rem;" onclick="cambiarEstadoAnuncio(${item.id}, ${!item.activo})">${toggleBtn}</button>
                <button class="btn-danger" onclick="eliminarAnuncio(${item.id})">Eliminar</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

async function cambiarEstadoAnuncio(id, estado) {
    await fetch(`/api/admin/anuncios/${id}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify({ activo: estado })
    });
    cargarAnuncios();
}

async function eliminarAnuncio(id) {
    if (!confirm('¿Eliminar anuncio?')) return;
    await fetch(`/api/admin/anuncios/${id}`, {
        method: 'DELETE',
        headers: getHeaders(false)
    });
    cargarAnuncios();
}