let ws = null;
let currentModule = null;

// Elementos DOM cacheados
const connectionStatusEl = document.getElementById('connection-status');
const activeModuleNameEl = document.getElementById('active-module-name');
const dynamicControlsEl = document.getElementById('dynamic-controls');

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/control`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        if (connectionStatusEl) {
            connectionStatusEl.textContent = 'Conectado al Proyector';
            connectionStatusEl.className = 'status-connected';
        }
        console.log('✅ Conectado al servidor WebSocket');
    };

    ws.onclose = () => {
        if (connectionStatusEl) {
            connectionStatusEl.textContent = 'Desconectado';
            connectionStatusEl.className = 'status-disconnected';
        }
        console.warn('⚠️ WebSocket cerrado. Reconectando en 3 segundos...');
        setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
    };
}

function sendCommand(action, data = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const payload = { action, module: currentModule, ...data };
        ws.send(JSON.stringify(payload));
        console.log('📤 Enviando comando:', action, data);
    } else {
        console.warn('⚠️ WebSocket no está conectado. Comando no enviado:', action);
        alert('No hay conexión con el proyector. Verifique que la ventana del proyector esté abierta.');
    }
}

function activateModule(moduleName) {
    currentModule = moduleName;

    // Actualizar UI de botones
    document.querySelectorAll('.module-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.module === moduleName) {
            btn.classList.add('active');
        }
    });

    // Actualizar nombre del módulo activo
    if (activeModuleNameEl) {
        activeModuleNameEl.textContent = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    }
    
    sendCommand('set_module', { module: moduleName });
    renderDynamicControls(moduleName);
}

async function renderDynamicControls(moduleName) {
    if (!dynamicControlsEl) return;
    
    let html = '';

    if (moduleName === 'inicializacion') {
        html = `
            <div class="control-group">
                <button onclick="sendCommand('set_text', { title: 'Bienvenidos', text: 'El servicio comenzará en breve' })" class="btn-primary">
                    🎬 Mostrar Bienvenida
                </button>
                <button onclick="sendCommand('play_media', { type: 'audio', src: '/static/media/audio/instrumental.mp3', volume: 0.5 })" class="btn-secondary">
                    🎵 Iniciar Música de Fondo
                </button>
            </div>
        `;
    } else if (moduleName === 'alabanzas') {
        html = `
            <div class="control-group">
                <button onclick="sendCommand('set_text', { title: 'Alabanza', text: 'Estrofa 1\\nLetra de la canción aquí' })" class="btn-primary">
                    📝 Mostrar Estrofa 1
                </button>
                <button onclick="sendCommand('set_background', { type: 'video', src: '/static/media/backgrounds/worship_loop.mp4' })" class="btn-secondary">
                    🎥 Fondo Video Alabanza
                </button>
            </div>
        `;
    } else if (moduleName === 'saludos') {
        html = `
            <div class="control-group">
                <button onclick="sendCommand('set_text', { title: '¡Bienvenidos!', text: 'Nos alegramos de verte hoy' })" class="btn-primary">
                    👋 Mostrar Saludo
                </button>
            </div>
        `;
    } else if (moduleName === 'predica') {
        html = `
            <div class="control-group">
                <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                    <select id="bible-book" class="form-select">
                        <option value="">Cargando libros...</option>
                    </select>
                    <input type="text" id="bible-chapter" placeholder="Cap." class="form-input" maxlength="3">
                    <button onclick="searchAndProjectBible()" class="btn-success">📖 Proyectar Versículo</button>
                </div>
                <div id="bible-preview" class="bible-preview"></div>
            </div>
        `;
        
        // Cargar libros bíblicos dinámicamente
        loadBibleBooks();
    } else if (moduleName === 'cumpleanos') {
        html = `
            <div class="control-group">
                <button onclick="projectBirthdays()" class="btn-primary">
                    🎂 Cargar Cumpleaños de la Semana
                </button>
                <div id="birthday-preview" class="birthday-preview"></div>
            </div>
        `;
        
        // Cargar vista previa de cumpleaños
        loadBirthdayPreview();
    } else if (moduleName === 'anuncios') {
        html = `
            <div class="control-group">
                <button onclick="projectAnuncios()" class="btn-primary">
                    📢 Proyectar Anuncios Activos
                </button>
                <div id="anuncios-preview" class="anuncios-preview"></div>
            </div>
        `;
        
        // Cargar vista previa de anuncios
        loadAnunciosPreview();
    } else if (moduleName === 'ofrendas') {
        html = `
            <div class="control-group">
                <p class="info-text">Módulo para registro y proyección de ofrendas.</p>
                <button onclick="sendCommand('set_text', { title: 'Ofrendas', text: 'Momento de ofrendas\\n\\n\"Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre.\" - 2 Corintios 9:7' })" class="btn-primary">
                    💰 Mostrar Pantalla de Ofrendas
                </button>
            </div>
        `;
    } else if (moduleName === 'cenia') {
        html = `
            <div class="control-group">
                <button onclick="sendCommand('set_text', { title: 'Santa Cena', text: 'En memoria de nuestro Señor Jesucristo' })" class="btn-primary">
                    🍷 Mostrar Título Santa Cena
                </button>
                <button onclick="sendCommand('set_text', { title: 'El Pan', text: 'Tomad, comed; esto es mi cuerpo que por vosotros es partido; haced esto en memoria de mí. - 1 Corintios 11:24' })" class="btn-secondary">
                    🥖 Proyectar Texto del Pan
                </button>
                <button onclick="sendCommand('set_text', { title: 'La Copa', text: 'Esta copa es el nuevo pacto en mi sangre; haced esto todas las veces que la bebiereis, en memoria de mí. - 1 Corintios 11:25' })" class="btn-secondary">
                    🍇 Proyectar Texto de la Copa
                </button>
            </div>
        `;
    } else {
        html = `<p class="info-text">Módulo <strong>${moduleName}</strong> listo para operar.</p>`;
    }

    dynamicControlsEl.innerHTML = html;
}

// ==================== FUNCIONES DE BIBLIA ====================

async function loadBibleBooks() {
    const selectEl = document.getElementById('bible-book');
    if (!selectEl) return;
    
    try {
        const response = await fetch('/api/bible/books');
        const data = await response.json();
        
        if (data.libros && data.libros.length > 0) {
            selectEl.innerHTML = '<option value="">Seleccione libro</option>' + 
                data.libros.map(libro => `<option value="${libro}">${libro}</option>`).join('');
        } else {
            selectEl.innerHTML = '<option value="">No hay libros disponibles</option>';
        }
    } catch (error) {
        console.error('Error al cargar libros:', error);
        selectEl.innerHTML = '<option value="">Error al cargar</option>';
    }
}

async function searchAndProjectBible() {
    const bookSelect = document.getElementById('bible-book');
    const chapterInput = document.getElementById('bible-chapter');
    const previewEl = document.getElementById('bible-preview');

    if (!bookSelect || !chapterInput || !previewEl) return;
    
    const book = bookSelect.value;
    const chapter = chapterInput.value.trim();

    if (!book) {
        previewEl.textContent = "⚠️ Por favor, seleccione un libro.";
        previewEl.className = 'bible-preview warning';
        return;
    }
    
    if (!chapter) {
        previewEl.textContent = "⚠️ Por favor, ingrese un número de capítulo.";
        previewEl.className = 'bible-preview warning';
        return;
    }

    previewEl.textContent = "🔍 Buscando...";
    previewEl.className = 'bible-preview loading';

    try {
        const response = await fetch(`/api/bible/search?libro=${encodeURIComponent(book)}&capitulo=${encodeURIComponent(chapter)}&version=RVR1960`);
        const data = await response.json();

        if (data.error) {
            previewEl.textContent = `❌ Error: ${data.error}`;
            previewEl.className = 'bible-preview error';
            return;
        }

        previewEl.textContent = `${data.referencia} (${data.version})\n\n${data.texto}`;
        previewEl.className = 'bible-preview success';

        // Enviar al proyector inmediatamente
        sendCommand('show_bible_verse', {
            reference: data.referencia,
            version: data.version,
            text: data.texto
        });
    } catch (error) {
        previewEl.textContent = "❌ Error de conexión al buscar.";
        previewEl.className = 'bible-preview error';
        console.error(error);
    }
}

// ==================== FUNCIONES DE CUMPLEAÑOS ====================

async function loadBirthdayPreview() {
    const previewEl = document.getElementById('birthday-preview');
    if (!previewEl) return;
    
    previewEl.textContent = "🔍 Cargando cumpleaños...";
    
    try {
        const response = await fetch('/api/projection/birthdays');
        const data = await response.json();
        
        if (data.cumpleanos && data.cumpleanos.length > 0) {
            previewEl.innerHTML = `<p class="success-text">✅ ${data.cumpleanos.length} cumpleaños encontrados esta semana</p>`;
        } else {
            previewEl.innerHTML = '<p class="info-text">ℹ️ No hay cumpleaños registrados esta semana</p>';
        }
    } catch (error) {
        previewEl.textContent = "❌ Error al cargar cumpleaños";
        console.error(error);
    }
}

async function projectBirthdays() {
    try {
        const response = await fetch('/api/projection/birthdays');
        const data = await response.json();
        
        if (data.cumpleanos && data.cumpleanos.length > 0) {
            sendCommand('load_birthdays', { birthdays: data.cumpleanos });
        } else {
            alert('No hay cumpleaños registrados esta semana');
        }
    } catch (error) {
        console.error('Error al obtener cumpleaños:', error);
        alert('Error al cargar cumpleaños');
    }
}

// ==================== FUNCIONES DE ANUNCIOS ====================

async function loadAnunciosPreview() {
    const previewEl = document.getElementById('anuncios-preview');
    if (!previewEl) return;
    
    previewEl.textContent = "🔍 Cargando anuncios...";
    
    try {
        const response = await fetch('/api/projection/anuncios');
        const data = await response.json();
        
        if (data.anuncios && data.anuncios.length > 0) {
            previewEl.innerHTML = `<p class="success-text">✅ ${data.anuncios.length} anuncios activos disponibles</p>`;
        } else {
            previewEl.innerHTML = '<p class="info-text">ℹ️ No hay anuncios activos</p>';
        }
    } catch (error) {
        previewEl.textContent = "❌ Error al cargar anuncios";
        console.error(error);
    }
}

async function projectAnuncios() {
    try {
        const response = await fetch('/api/projection/anuncios');
        const data = await response.json();
        
        if (data.anuncios && data.anuncios.length > 0) {
            sendCommand('load_anuncios', { anuncios: data.anuncios });
        } else {
            alert('No hay anuncios activos para proyectar');
        }
    } catch (error) {
        console.error('Error al obtener anuncios:', error);
        alert('Error al cargar anuncios');
    }
}

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
    console.log('🎛️ Panel de Control Litúrgico inicializado');
});