document.addEventListener('DOMContentLoaded', () => {
    cargarCumpleanos();

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
            }
        } catch (error) {
            console.error('Error al agregar cumpleaños:', error);
        }
    });
});

async function cargarCumpleanos() {
    try {
        const response = await fetch('/api/admin/birthdays');
        const data = await response.json();
        renderizarTabla(data);
    } catch (error) {
        console.error('Error al cargar cumpleaños:', error);
    }
}

function renderizarTabla(data) {
    const tbody = document.querySelector('#tabla-cumpleanos tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nombre}</td>
            <td>${item.fecha}</td>
            <td><button class="btn-danger" onclick="eliminarCumpleanos(${item.id})">Eliminar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

async function eliminarCumpleanos(id) {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
        const response = await fetch(`/api/admin/birthdays/${id}`, { method: 'DELETE' });
        if (response.ok) {
            cargarCumpleanos();
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
    }
}