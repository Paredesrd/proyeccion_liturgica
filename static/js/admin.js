// ========================================
// CUMPLEAÑOS
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    cargarCumpleanos();
    cargarAnuncios();
    cargarOfrendas();
    cargarTextosBiblicos();

    // Form Cumpleaños
    document.getElementById('form-cumpleanos').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('input-nombre').value;
        const fecha = document.getElementById('input-fecha').value;

        try {
            const response = await fetch('/api/admin/birthdays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, fecha })
            });

            if (response.ok) {
                document.getElementById('form-cumpleanos').reset();
                cargarCumpleanos();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.detail || 'No se pudo agregar'));
            }
        } catch (error) {
            console.error('Error al agregar cumpleaños:', error);
            alert('Error de conexión');
        }
    });

    // Form Anuncios
    document.getElementById('form-anuncios').addEventListener('submit', async (e) => {
        e.preventDefault();
        const titulo = document.getElementById('input-anuncio-titulo').value;
        const contenido = document.getElementById('input-anuncio-contenido').value;
        const color = document.getElementById('input-anuncio-color').value;

        try {
            const response = await fetch('/api/admin/anuncios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo, contenido, color })
            });

            if (response.ok) {
                document.getElementById('form-anuncios').reset();
                cargarAnuncios();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.detail || 'No se pudo agregar'));
            }
        } catch (error) {
            console.error('Error al agregar anuncio:', error);
            alert('Error de conexión');
        }
    });

    // Form Ofrendas
    document.getElementById('form-ofrendas').addEventListener('submit', async (e) => {
        e.preventDefault();
        const concepto = document.getElementById('input-ofrenda-concepto').value;
        const monto = parseFloat(document.getElementById('input-ofrenda-monto').value);
        const fecha = document.getElementById('input-ofrenda-fecha').value;

        try {
            const response = await fetch('/api/admin/ofrendas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ concepto, monto, fecha })
            });

            if (response.ok) {
                document.getElementById('form-ofrendas').reset();
                cargarOfrendas();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.detail || 'No se pudo registrar'));
            }
        } catch (error) {
            console.error('Error al registrar ofrenda:', error);
            alert('Error de conexión');
        }
    });
});

// ========================================
// CUMPLEAÑOS FUNCTIONS
// ========================================
async function cargarCumpleanos() {
    try {
        const response = await fetch('/api/admin/birthdays');
        const data = await response.json();
        renderizarTablaCumpleanos(data);
    } catch (error) {
        console.error('Error al cargar cumpleaños:', error);
    }
}

function renderizarTablaCumpleanos(data) {
    const tbody = document.querySelector('#tabla-cumpleanos tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nombre}</td>
            <td>${formatFecha(item.fecha)}</td>
            <td><button class="btn-danger" onclick="eliminarCumpleanos(${item.id})">Eliminar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

async function eliminarCumpleanos(id) {
    if (!confirm('¿Estás seguro de eliminar este cumpleaños?')) return;

    try {
        const response = await fetch(`/api/admin/birthdays/${id}`, { method: 'DELETE' });
        if (response.ok) {
            cargarCumpleanos();
        } else {
            alert('Error al eliminar');
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error de conexión');
    }
}

// ========================================
// ANUNCIOS FUNCTIONS
// ========================================
async function cargarAnuncios() {
    try {
        const response = await fetch('/api/admin/anuncios');
        const data = await response.json();
        renderizarTablaAnuncios(data);
    } catch (error) {
        console.error('Error al cargar anuncios:', error);
    }
}

function renderizarTablaAnuncios(data) {
    const tbody = document.querySelector('#tabla-anuncios tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.titulo}</td>
            <td>${item.contenido.substring(0, 50)}${item.contenido.length > 50 ? '...' : ''}</td>
            <td><span style="display:inline-block;width:20px;height:20px;background:${item.color};border-radius:3px;"></span></td>
            <td><button class="btn-danger" onclick="eliminarAnuncio(${item.id})">Eliminar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

async function eliminarAnuncio(id) {
    if (!confirm('¿Estás seguro de eliminar este anuncio?')) return;

    try {
        const response = await fetch(`/api/admin/anuncios/${id}`, { method: 'DELETE' });
        if (response.ok) {
            cargarAnuncios();
        } else {
            alert('Error al eliminar');
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error de conexión');
    }
}

// ========================================
// OFRENDAS FUNCTIONS
// ========================================
async function cargarOfrendas() {
    try {
        const response = await fetch('/api/admin/ofrendas');
        const data = await response.json();
        renderizarTablaOfrendas(data);
    } catch (error) {
        console.error('Error al cargar ofrendas:', error);
    }
}

function renderizarTablaOfrendas(data) {
    const tbody = document.querySelector('#tabla-ofrendas tbody');
    tbody.innerHTML = '';

    let total = 0;

    data.forEach(item => {
        total += item.monto;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatFecha(item.fecha)}</td>
            <td>${item.concepto}</td>
            <td>$${item.monto.toFixed(2)}</td>
            <td><button class="btn-danger" onclick="eliminarOfrenda(${item.id})">Eliminar</button></td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('total-ofrendas').textContent = total.toFixed(2);
}

async function eliminarOfrenda(id) {
    if (!confirm('¿Estás seguro de eliminar esta ofrenda?')) return;

    try {
        const response = await fetch(`/api/admin/ofrendas/${id}`, { method: 'DELETE' });
        if (response.ok) {
            cargarOfrendas();
        } else {
            alert('Error al eliminar');
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error de conexión');
    }
}

// ========================================
// TEXTOS BÍBLICOS FUNCTIONS
// ========================================
async function cargarTextosBiblicos() {
    try {
        const response = await fetch('/api/admin/textos');
        const data = await response.json();
        renderizarTablaTextos(data);
        document.getElementById('total-textos').textContent = data.length;
    } catch (error) {
        console.error('Error al cargar textos:', error);
    }
}

function renderizarTablaTextos(data) {
    const tbody = document.querySelector('#tabla-textos tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.referencia}</strong></td>
            <td>${item.texto}</td>
            <td>${item.version}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function buscarTextoBiblico() {
    const busqueda = document.getElementById('input-buscar-texto').value.trim();
    if (!busqueda) {
        alert('Ingresa un término de búsqueda');
        return;
    }

    try {
        const response = await fetch(`/api/admin/textos?busqueda=${encodeURIComponent(busqueda)}`);
        const data = await response.json();
        renderizarTablaTextos(data);
        document.getElementById('total-textos').textContent = data.length;
        
        if (data.length === 0) {
            alert('No se encontraron textos que coincidan con "' + busqueda + '"');
        }
    } catch (error) {
        console.error('Error al buscar:', error);
        alert('Error de conexión');
    }
}

// ========================================
// UTILS
// ========================================
function formatFecha(fechaStr) {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}