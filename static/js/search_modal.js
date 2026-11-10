let tsAbortController = null;
let tsDebounceTimer = null;
let tsResultados = [];

window.openTextSearch = function() {
    const modal = document.getElementById('text-search-modal');
    if (modal) {
        modal.classList.add('active');
        setTimeout(() => document.getElementById('ts-input').focus(), 80);
    }
};

window.closeTextSearch = function() {
    const modal = document.getElementById('text-search-modal');
    if (modal) {
        modal.classList.remove('active');
        document.getElementById('ts-input').value = '';
        document.getElementById('ts-results').innerHTML = '<div class="ts-empty">Escribe para buscar versículos por texto</div>';
        tsResultados = [];
    }
};

async function ejecutarBusquedaTextual() {
    const input = document.getElementById('ts-input');
    const version = document.getElementById('ts-version').value;
    const resultsDiv = document.getElementById('ts-results');
    const q = input.value.trim();
    
    if (q.length < 2) {
        resultsDiv.innerHTML = '<div class="ts-empty">Escribe al menos 2 caracteres</div>';
        return;
    }
    
    if (tsAbortController) tsAbortController.abort();
    tsAbortController = new AbortController();
    resultsDiv.innerHTML = '<div class="ts-loading">🔍 Buscando...</div>';
    
    try {
        const url = `/api/bible/search-text?q=${encodeURIComponent(q)}${version ? '&version=' + version : ''}`;
        const res = await fetch(url, { signal: tsAbortController.signal });
        const data = await res.json();
        
        if (!res.ok) { resultsDiv.innerHTML = `<div class="ts-empty">${data.detail}</div>`; return; }
        tsResultados = data.resultados || [];
        if (tsResultados.length === 0) { resultsDiv.innerHTML = '<div class="ts-empty">No se encontraron coincidencias</div>'; return; }
        
        resultsDiv.innerHTML = tsResultados.map((r, i) => `
            <div class="ts-result" tabindex="0" data-index="${i}">
                <div class="ts-ref">${r.referencia} <span class="ts-version-badge">${r.version}</span></div>
                <div class="ts-text">${r.snippet}</div>
            </div>
        `).join('');
        
        resultsDiv.querySelectorAll('.ts-result').forEach(el => {
            el.addEventListener('click', () => proyectarResultadoTextual(parseInt(el.dataset.index)));
            el.addEventListener('keydown', (e) => { if (e.key === 'Enter') proyectarResultadoTextual(parseInt(el.dataset.index)); });
        });
    } catch (e) {
        if (e.name !== 'AbortError') resultsDiv.innerHTML = '<div class="ts-empty">Error de conexión</div>';
    }
}

window.proyectarResultadoTextual = function(index) {
    const r = tsResultados[index];
    if (!r) return;
    // EVENTO GLOBAL: No sabe si es Control o Tablet. Solo dispara el evento.
    window.dispatchEvent(new CustomEvent('project_verse', { detail: {
        reference: r.referencia, text: r.texto, version: r.version,
        libro_db: r.libro_db, capitulo: parseInt(r.capitulo), versiculo: parseInt(r.versiculo)
    }}));
    window.closeTextSearch();
};

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('ts-input');
    const select = document.getElementById('ts-version');
    const modal = document.getElementById('text-search-modal');
    if (!modal) return;
    
    if (input) {
        input.addEventListener('input', () => { clearTimeout(tsDebounceTimer); tsDebounceTimer = setTimeout(ejecutarBusquedaTextual, 300); });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') window.closeTextSearch();
            if (e.key === 'Enter' && tsResultados.length > 0) window.proyectarResultadoTextual(0);
        });
    }
    if (select) select.addEventListener('change', ejecutarBusquedaTextual);
    
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (!modal.classList.contains('active')) window.openTextSearch(); else window.closeTextSearch();
        }
        if (e.key === 'Escape' && modal.classList.contains('active')) window.closeTextSearch();
    });
});