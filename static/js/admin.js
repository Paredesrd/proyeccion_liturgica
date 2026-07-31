import { API } from './api_client.js';

// Exposición imperativa al DOM Window
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

document.addEventListener('DOMContentLoaded', async () => {
    cargarCumpleanos();
    cargarAnuncios();
    cargarCanciones();

    // Arranque asíncrono para bosquejo
    const predicaRes = await API.predica.getBosquejo();
    bosquejoSlides = predicaRes.diapositivas || [];
    renderTablaBosquejo();

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
            } else {
                status.innerText = '❌ Fallo crítico.';
                status.style.color = '#dc2626';
            }
            btn.innerText = originalText;
            btn.disabled = false;
        });
    }

    document.getElementById('form-cumpleanos').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('input-nombre').value;
        const fecha = document.getElementById('input-fecha').value;

        try {
            const response = await fetch('/api/admin/birthdays', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre, fecha })
            });
            if (response.ok) { document.getElementById('form-cumpleanos').reset(); cargarCumpleanos(); }
        } catch (error) { console.error(error); }
    });

    document.getElementById('form-anuncios').addEventListener('submit', async (e) => {
        e.preventDefault();
        const titulo = document.getElementById('input-titulo-anuncio').value;
        const contenido = document.getElementById('input-contenido-anuncio').value;

        try {
            const response = await fetch('/api/admin/anuncios', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo, contenido, activo: true })
            });
            if (response.ok) { document.getElementById('form-anuncios').reset(); cargarAnuncios(); }
        } catch (error) { console.error(error); }
    });

    document.getElementById('form-canciones').addEventListener('submit', async (e) => {
        e.preventDefault();
        const titulo = document.getElementById('input-titulo-cancion').value;
        const letra = document.getElementById('input-letra-cancion').value;

        try {
            const response = await fetch('/api/admin/canciones', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo: titulo, letra: letra, autor: "" })
            });
            if (response.ok) { document.getElementById('form-canciones').reset(); cargarCanciones(); }
        } catch (error) { console.error(error); }
    });

    // Controlador de Bosquejo
    document.getElementById('form-bosquejo').addEventListener('submit', (e) => {
        e.preventDefault();
        const titulo = document.getElementById('input-titulo-slide').value;
        const contenido = document.getElementById('input-contenido-slide').value;
        bosquejoSlides.push({ id: Date.now(), titulo, contenido });
        document.getElementById('form-bosquejo').reset();
        renderTablaBosquejo();
    });
});

/* ==================== MÓDULO BOSQUEJO ==================== */
function renderTablaBosquejo() {
    const tbody = document.querySelector('#tabla-bosquejo tbody');
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
        const response = await fetch('/api/admin/canciones');
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
        const res = await fetch(`/api/admin/canciones/${id}`, { method: 'DELETE' });
        if (res.ok) {
            currentSetlistIds = currentSetlistIds.filter(setId => setId !== id);
            cargarCanciones();
        }
    } catch (error) { console.error(error); }
}

/* ==================== OTROS MÓDULOS ==================== */
async function cargarCumpleanos() {
    try {
        const response = await fetch('/api/admin/birthdays');
        if (!response.ok) throw new Error(`Error HTTP`);
        renderizarTablaCumpleanos(await response.json());
    } catch (error) { console.error(error); }
}

function renderizarTablaCumpleanos(data) {
    const tbody = document.querySelector('#tabla-cumpleanos tbody');
    tbody.innerHTML = '';
    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${item.nombre}</td><td>${item.fecha}</td>
            <td><button class="btn-danger" onclick="eliminarCumpleanos(${item.id})">Eliminar</button></td>`;
        tbody.appendChild(tr);
    });
}

async function eliminarCumpleanos(id) {
    if (!confirm('¿Eliminar registro?')) return;
    try {
        const res = await fetch(`/api/admin/birthdays/${id}`, { method: 'DELETE' });
        if (res.ok) cargarCumpleanos();
    } catch (error) { console.error(error); }
}

async function cargarAnuncios() {
    try {
        const response = await fetch('/api/admin/anuncios');
        if (!response.ok) throw new Error(`Error HTTP`);
        renderizarTablaAnuncios(await response.json());
    } catch (error) { console.error(error); }
}

function renderizarTablaAnuncios(data) {
    const tbody = document.querySelector('#tabla-anuncios tbody');
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
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activo: estado })
    });
    cargarAnuncios();
}

async function eliminarAnuncio(id) {
    if (!confirm('¿Eliminar anuncio?')) return;
    await fetch(`/api/admin/anuncios/${id}`, { method: 'DELETE' });
    cargarAnuncios();
}