import { API } from './api_client.js?v=2';
window.eliminarFondo = eliminarFondo; window.eliminarCumpleanos = eliminarCumpleanos; window.cambiarEstadoAnuncio = cambiarEstadoAnuncio;
window.eliminarAnuncio = eliminarAnuncio; window.eliminarCancion = eliminarCancion; window.agregarASetlist = agregarASetlist;
window.quitarDeSetlist = quitarDeSetlist; window.guardarSetlistEnServidor = guardarSetlistEnServidor;
window.eliminarSlideBosquejo = eliminarSlideBosquejo; window.guardarBosquejoEnServidor = guardarBosquejoEnServidor;
let globalCatalog = []; let currentSetlistIds = []; let bosquejoSlides = [];
const getHeaders = (isJson = true) => { const h = { 'X-API-Key': 'cambiar-esto-en-produccion-inmediatamente' }; if (isJson) h['Content-Type'] = 'application/json'; return h; };
async function initAdminPanel() { cargarFondos(); cargarAudios(); cargarCumpleanos(); cargarAnuncios(); cargarCanciones(); try { const predicaRes = await API.predica.getBosquejo(); bosquejoSlides = predicaRes.diapositivas || []; renderTablaBosquejo(); } catch (e) { console.error(e); } const formFondos = document.getElementById('form-fondos'); if (formFondos) formFondos.addEventListener('submit', async (e) => { e.preventDefault(); const btn = document.getElementById('btn-upload-bg'); const status = document.getElementById('upload-status'); const orig = btn.innerText; btn.innerText = '⏳ Subiendo...'; btn.disabled = true; status.innerText = ''; const url = await API.media.upload('input-bg-file', 'backgrounds'); if (url) { status.innerText = '✅ Fondo subido.'; status.style.color = '#16a34a'; formFondos.reset(); cargarFondos(); } else { status.innerText = '❌ Fallo.'; status.style.color = '#dc2626'; } btn.innerText = orig; btn.disabled = false; }); const formCumpleanos = document.getElementById('form-cumpleanos'); if (formCumpleanos) formCumpleanos.addEventListener('submit', async (e) => { e.preventDefault(); const nombre = document.getElementById('input-nombre').value; const fecha = document.getElementById('input-fecha').value; try { const urlEdicion = editandoCumpleanosId ? ('/api/admin/birthdays/' + editandoCumpleanosId) : '/api/admin/birthdays'; const res = await fetch(urlEdicion, { method: (editandoCumpleanosId ? 'PUT' : 'POST'), headers: getHeaders(true), body: JSON.stringify({ nombre, fecha }) }); if (res.ok) { window.cancelarEdicionCumpleanos(); cargarCumpleanos(); } } catch (err) { console.error(err); } }); const formAnuncios = document.getElementById('form-anuncios'); if (formAnuncios) formAnuncios.addEventListener('submit', async (e) => { e.preventDefault(); const titulo = document.getElementById('input-titulo-anuncio').value; const contenido = document.getElementById('input-contenido-anuncio').value; const activoCheck = document.getElementById('input-activo-anuncio'); const activo = activoCheck ? activoCheck.checked : true; try { const res = await fetch('/api/admin/anuncios', { method: 'POST', headers: getHeaders(true), body: JSON.stringify({ titulo, contenido, activo }) }); if (res.ok) { formAnuncios.reset(); cargarAnuncios(); } } catch (err) { console.error(err); } }); const formCanciones = document.getElementById('form-canciones'); if (formCanciones) formCanciones.addEventListener('submit', async (e) => { e.preventDefault(); const titulo = document.getElementById('input-titulo-cancion').value; const letra = document.getElementById('input-letra-cancion').value; try { const res = await fetch('/api/admin/canciones', { method: 'POST', headers: getHeaders(true), body: JSON.stringify({ titulo, letra, autor: "" }) }); if (res.ok) { formCanciones.reset(); cargarCanciones(); } } catch (err) { console.error(err); } }); const formBosquejo = document.getElementById('form-bosquejo'); if (formBosquejo) formBosquejo.addEventListener('submit', (e) => { e.preventDefault(); const titulo = document.getElementById('input-titulo-slide').value; const contenido = document.getElementById('input-contenido-slide').value; const citaInput = document.getElementById('input-cita-slide'); const cita = citaInput ? citaInput.value.trim() : ''; bosquejoSlides.push({ id: Date.now(), titulo, contenido, cita }); formBosquejo.reset(); renderTablaBosquejo(); }); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAdminPanel); else initAdminPanel();
async function cargarFondos() { try { const data = await API.media.getBackgrounds(); renderizarGaleriaFondos(data.backgrounds); } catch(e) { document.getElementById('galeria-fondos').innerHTML = '<p class="text-danger text-center w-100 fw-bold">Error al conectar.</p>'; } }
function renderizarGaleriaFondos(fondos) { const container = document.getElementById('galeria-fondos'); if (!fondos || fondos.length === 0) { container.innerHTML = '<p class="text-muted text-center w-100">Catálogo vacío.</p>'; return; } container.innerHTML = fondos.map(f => { const isVid = f.filename.match(/\.(mp4|webm)$/i); const prev = isVid ? `<video src="${f.url}" class="card-img-top object-fit-cover border-bottom border-secondary" style="height: 140px; background: #000;" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>` : `<img src="${f.url}" class="card-img-top object-fit-cover border-bottom border-secondary" style="height: 140px; background: #000;">`; return `<div class="col-sm-6 col-md-4 col-lg-3"><div class="card h-100">${prev}<div class="card-body p-3 d-flex flex-column justify-content-between"><p class="text-white small text-truncate mb-3 fw-bold" title="${f.filename}">${f.filename}</p><button class="btn btn-sm btn-outline-danger w-100" onclick="eliminarFondo('${f.raw_filename}')">🗑️ Eliminar</button></div></div></div>`; }).join(''); }
async function eliminarFondo(filename) { if(!confirm('¿Destruir este fondo?')) return; const ok = await API.media.deleteBackground(filename); if(ok) cargarFondos(); else alert("Error al eliminar."); }
function renderTablaBosquejo() { const tbody = document.querySelector('#tabla-bosquejo tbody'); if (!tbody) return; tbody.innerHTML = ''; bosquejoSlides.forEach((s, i) => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${i + 1}</td><td><strong>${s.titulo}</strong></td><td style="white-space: pre-wrap; font-size: 0.9em;">${s.contenido}${s.cita ? `<br><span class="text-warning fw-bold">📖 ${s.cita}</span>` : ''}</td><td><button class="btn-danger" style="padding: 0.3rem 0.6rem;" onclick="eliminarSlideBosquejo(${s.id})">❌</button></td>`; tbody.appendChild(tr); }); }
function eliminarSlideBosquejo(id) { bosquejoSlides = bosquejoSlides.filter(s => s.id !== id); renderTablaBosquejo(); }
async function guardarBosquejoEnServidor() { const btn = document.querySelector('button[onclick="guardarBosquejoEnServidor()"]'); const orig = btn.innerText; btn.innerText = 'Sincronizando...'; btn.disabled = true; const ok = await API.predica.saveBosquejo(bosquejoSlides); if(ok) { btn.innerText = '✅ Publicado'; setTimeout(() => { btn.innerText = orig; btn.disabled = false; }, 2000); } else { alert("Error de red."); btn.innerText = orig; btn.disabled = false; } }
async function cargarCanciones() { try { const res = await fetch('/api/admin/canciones', { headers: getHeaders(false) }); if (!res.ok) throw new Error(); globalCatalog = await res.json(); const setlistRes = await API.canciones.getSetlist(); currentSetlistIds = setlistRes.canciones_ids || []; renderizarTablasMusica(); } catch (e) { console.error(e); } }
function renderizarTablasMusica() { const tbodyCat = document.querySelector('#tabla-canciones tbody'); const tbodySet = document.querySelector('#tabla-setlist tbody'); if (!tbodyCat || !tbodySet) return; tbodyCat.innerHTML = ''; tbodySet.innerHTML = ''; globalCatalog.forEach(item => { const tr = document.createElement('tr'); tr.innerHTML = `<td><strong>${item.titulo}</strong></td><td class="text-end"><div class="d-flex gap-2 justify-content-end"><button class="btn btn-sm btn-outline-success" onclick="agregarASetlist(${item.id})">➕ Añadir</button><button class="btn btn-sm btn-outline-danger" onclick="eliminarCancion(${item.id})">🗑️</button></div></td>`; tbodyCat.appendChild(tr); }); currentSetlistIds.forEach(id => { const song = globalCatalog.find(c => c.id === id); if(song) { const tr = document.createElement('tr'); tr.innerHTML = `<td>🎶 <strong>${song.titulo}</strong></td><td class="text-center"><button class="btn btn-sm btn-outline-danger" onclick="quitarDeSetlist(${song.id})">❌</button></td>`; tbodySet.appendChild(tr); } }); }
function agregarASetlist(id) { if(!currentSetlistIds.includes(id)) { currentSetlistIds.push(id); renderizarTablasMusica(); } }
function quitarDeSetlist(id) { currentSetlistIds = currentSetlistIds.filter(setId => setId !== id); renderizarTablasMusica(); }
async function guardarSetlistEnServidor() { const btn = document.querySelector('button[onclick="guardarSetlistEnServidor()"]'); const orig = btn.innerText; btn.innerText = 'Sincronizando...'; btn.disabled = true; const ok = await API.canciones.saveSetlist(currentSetlistIds); if(ok) { btn.innerText = '✅ Publicado'; setTimeout(() => { btn.innerText = orig; btn.disabled = false; }, 2000); } else { alert("Error de red."); btn.innerText = orig; btn.disabled = false; } }
async function eliminarCancion(id) { if (!confirm('¿Eliminar esta canción?')) return; try { const res = await fetch(`/api/admin/canciones/${id}`, { method: 'DELETE', headers: getHeaders(false) }); if (res.ok) { currentSetlistIds = currentSetlistIds.filter(setId => setId !== id); cargarCanciones(); } } catch (e) { console.error(e); } }
async function cargarCumpleanos() { try { const res = await fetch('/api/admin/birthdays', { headers: getHeaders(false) }); if (!res.ok) throw new Error(); renderizarTablaCumpleanos(await res.json()); } catch (e) { console.error(e); } }
function renderizarTablaCumpleanos(data) { const tbody = document.querySelector('#tabla-cumpleanos tbody'); if (!tbody) return; tbody.innerHTML = ''; const h5 = document.querySelector('#cumpleanos-pane .card-header h5'); if (h5) { let badge = document.getElementById('badge-cumpleanos'); if (!badge) { badge = document.createElement('span'); badge.id = 'badge-cumpleanos'; badge.className = 'badge bg-warning text-dark ms-2 align-middle'; h5.appendChild(badge); } badge.textContent = data.length + (data.length === 1 ? ' cumpleañero' : ' cumpleañeros'); } data.forEach(item => { const tr = document.createElement('tr'); let badge = item.es_hoy ? ' <span style="color: #ef4444; font-weight: bold; font-size: 0.8em; margin-left: 8px;">[HOY]</span>' : (item.es_manana ? ' <span style="color: #f59e0b; font-weight: bold; font-size: 0.8em; margin-left: 8px;">[MAÑANA]</span>' : ''); tr.innerHTML = `<td><strong>${item.nombre}</strong>${badge}</td><td class="text-muted">${item.fecha}</td><td class="text-end"><button class="btn btn-sm btn-outline-primary" onclick="editarCumpleanos(${item.id})">✏️ Editar</button> <button class="btn btn-sm btn-outline-danger" onclick="eliminarCumpleanos(${item.id})">🗑️ Eliminar</button></td>`; tbody.appendChild(tr); }); }
async function eliminarCumpleanos(id) { if (!confirm('¿Eliminar registro?')) return; try { const res = await fetch(`/api/admin/birthdays/${id}`, { method: 'DELETE', headers: getHeaders(false) }); if (res.ok) cargarCumpleanos(); } catch (e) { console.error(e); } }
async function cargarAnuncios() { try { const res = await fetch('/api/admin/anuncios', { headers: getHeaders(false) }); if (!res.ok) throw new Error(); renderizarTablaAnuncios(await res.json()); } catch (e) { console.error(e); } }
function renderizarTablaAnuncios(data) { const tbody = document.querySelector('#tabla-anuncios tbody'); if (!tbody) return; tbody.innerHTML = ''; data.forEach(item => { const tr = document.createElement('tr'); const estado = item.activo ? '🟢 Activo' : '🔴 Inactivo'; const toggle = item.activo ? 'Desactivar' : 'Activar'; tr.innerHTML = `<td><strong>${item.titulo}</strong></td><td class="text-muted">${item.contenido}</td><td><span class="badge ${item.activo ? 'bg-success' : 'bg-secondary'}">${estado}</span></td><td class="text-end"><div class="d-flex gap-2 justify-content-end"><button class="btn btn-sm btn-outline-info" onclick="cambiarEstadoAnuncio(${item.id}, ${!item.activo})">${toggle}</button><button class="btn btn-sm btn-outline-danger" onclick="eliminarAnuncio(${item.id})">🗑️</button></div></td>`; tbody.appendChild(tr); }); }
async function cambiarEstadoAnuncio(id, estado) { await fetch(`/api/admin/anuncios/${id}`, { method: 'PUT', headers: getHeaders(true), body: JSON.stringify({ activo: estado }) }); cargarAnuncios(); }
async function eliminarAnuncio(id) { if (!confirm('¿Eliminar anuncio?')) return; await fetch(`/api/admin/anuncios/${id}`, { method: 'DELETE', headers: getHeaders(false) }); cargarAnuncios(); }
window.exportarPredica = async function() { try { const bosquejo = await API.predica.getBosquejo(); const payload = { "firma_sistema": "proyeccion_liturgica_predica", "fecha": new Date().toISOString(), "diapositivas": bosquejo.diapositivas || [] }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Predica_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url); } catch (e) { alert("Error al exportar: " + e.message); } };
window.exportarSetlist = async function() { try { const setlist = await API.canciones.getSetlist(); const payload = { "firma_sistema": "proyeccion_liturgica_setlist", "fecha": new Date().toISOString(), "canciones_ids": setlist.canciones_ids || [] }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Setlist_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url); } catch (e) { alert("Error al exportar: " + e.message); } };
window.importarArchivoGlobal = function(inputElement) { const file = inputElement.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async function(e) { try { const json = JSON.parse(e.target.result); if (json.firma_sistema === "proyeccion_liturgica_backup_maestro") { if (confirm("📦 Respaldo Maestro detectado. ¿Sobrescribir?")) { await API.predica.saveBosquejo(json.predica); await API.canciones.saveSetlist(json.setlist); alert("✅ Respaldo importado."); window.location.reload(); } } else if (json.firma_sistema === "proyeccion_liturgica_predica" || json.diapositivas) { if (confirm("📖 Archivo de PRÉDICA. ¿Sobrescribir?")) { await API.predica.saveBosquejo(json.diapositivas || json); alert("✅ Prédica importada."); window.location.reload(); } } else if (json.firma_sistema === "proyeccion_liturgica_setlist" || json.canciones_ids) { if (confirm("🎵 Archivo de SETLIST. ¿Sobrescribir?")) { await API.canciones.saveSetlist(json.canciones_ids || json); alert("✅ Setlist importado."); window.location.reload(); } } else { alert("❌ Archivo no reconocido."); } } catch (err) { alert("❌ Error al leer el archivo."); } }; reader.readAsText(file); inputElement.value = ''; };

let editandoCumpleanosId = null;

window.editarCumpleanos = async function(id) {
    try {
        const res = await fetch('/api/admin/birthdays', { headers: getHeaders(false) });
        if (!res.ok) return;
        const data = await res.json();
        const item = data.find(x => x.id === id);
        if (!item) return;
        editandoCumpleanosId = id;
        document.getElementById('input-nombre').value = item.nombre;
        document.getElementById('input-fecha').value = item.fecha_completa;
        const btn = document.querySelector('#form-cumpleanos button[type="submit"]');
        if (btn) { btn.dataset.textoOriginal = btn.innerText; btn.innerText = 'Guardar Cambios'; }
        document.getElementById('input-nombre').focus();
    } catch (e) { console.error(e); }
};

window.cancelarEdicionCumpleanos = function() {
    editandoCumpleanosId = null;
    const form = document.getElementById('form-cumpleanos');
    if (form) form.reset();
    const btn = document.querySelector('#form-cumpleanos button[type="submit"]');
    if (btn && btn.dataset.textoOriginal) btn.innerText = btn.dataset.textoOriginal;
};

const formAudios = document.getElementById('form-audios');
if (formAudios) formAudios.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-upload-audio');
    const status = document.getElementById('upload-status-audio');
    const orig = btn.innerText;
    btn.innerText = 'Subiendo...';
    btn.disabled = true;
    status.innerText = '';
    const url = await API.media.upload('input-audio-file', 'audio');
    if (url) { status.innerText = 'Audio subido.'; status.style.color = '#16a34a'; formAudios.reset(); cargarAudios(); }
    else { status.innerText = 'Fallo.'; status.style.color = '#dc2626'; }
    btn.innerText = orig;
    btn.disabled = false;
});

async function cargarAudios() {
    try {
        const res = await fetch('/api/media/audios', { headers: getHeaders(false) });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const cont = document.getElementById('galeria-audios');
        if (!cont) return;
        cont.innerHTML = '';
        const audios = data.audios || [];
        if (audios.length === 0) { cont.innerHTML = '<p class="text-muted text-center small mb-0">Aun no hay audios subidos.</p>'; return; }
        const list = document.createElement('div');
        list.className = 'list-group';
        audios.forEach(a => {
            const item = document.createElement('div');
            item.className = 'list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center';
            const safeName = a.raw_filename.replace(/'/g, '');
            item.innerHTML = '<span class="small">' + a.filename + '</span><button class="btn btn-sm btn-outline-danger" onclick="eliminarAudio(\'' + safeName + '\')">Eliminar</button>';
            list.appendChild(item);
        });
        cont.appendChild(list);
    } catch (e) { console.error(e); }
}

window.eliminarAudio = async function(rawFilename) {
    if (!confirm('Eliminar este audio del sistema?')) return;
    try {
        const res = await fetch('/api/media/audios/' + encodeURIComponent(rawFilename), { method: 'DELETE', headers: getHeaders(false) });
        if (res.ok) cargarAudios();
    } catch (e) { console.error(e); }
};
