// Configuración centralizada de red
const CONFIG = {
    API_KEY: 'cambiar-esto-en-produccion-inmediatamente',
    headers: function(isJson = true) {
        const h = { 'X-API-Key': this.API_KEY };
        if (isJson) h['Content-Type'] = 'application/json';
        return h;
    }
};

export const API = {
    media: {
        upload: async (fileInputId, mediaCategory) => {
            const fileInput = document.getElementById(fileInputId);
            if (!fileInput || fileInput.files.length === 0) return null;

            const file = fileInput.files[0];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('media_type', mediaCategory);

            try {
                const response = await fetch('/api/media/upload', {
                    method: 'POST',
                    headers: { 'X-API-Key': CONFIG.API_KEY },
                    body: formData
                });
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.detail || 'Fallo en la ingesta del servidor.');
                }
                const data = await response.json();
                return data.url;
            } catch (error) {
                console.error('Error de I/O en subida:', error);
                alert(`Fallo al inyectar archivo: ${error.message}`);
                return null;
            }
        },
        getBackgrounds: async () => {
            const response = await fetch('/api/media/backgrounds', { headers: CONFIG.headers() });
            if(!response.ok) throw new Error("Falla al listar catálogo de fondos");
            return await response.json();
        },
        deleteBackground: async (filename) => {
            const response = await fetch(`/api/media/backgrounds/${encodeURIComponent(filename)}`, {
                method: 'DELETE',
                headers: CONFIG.headers(false)
            });
            return response.ok;
        }
    },
    bible: {
        getVersions: async () => {
            const response = await fetch('/api/bible/versions', { headers: CONFIG.headers() });
            if(!response.ok) throw new Error("Falla al extraer las versiones bíblicas");
            return await response.json();
        },
        getBooks: async (version = "RVR1960") => {
            const response = await fetch(`/api/bible/books?version=${encodeURIComponent(version)}`, { headers: CONFIG.headers() });
            if(!response.ok) throw new Error("Falla de acceso a datos bíblicos");
            return await response.json();
        },
        searchVerse: async (book, chapter, version="RVR1960") => {
            const response = await fetch(`/api/bible/search?libro=${encodeURIComponent(book)}&capitulo=${encodeURIComponent(chapter)}&version=${version}`, { headers: CONFIG.headers() });
            return { ok: response.ok, data: await response.json() };
        }
    },
    canciones: {
        getAll: async () => {
            const response = await fetch('/api/admin/canciones', { headers: CONFIG.headers() });
            if(!response.ok) throw new Error("Falla al extraer el cancionero");
            return await response.json();
        },
        getSetlist: async () => {
            const response = await fetch('/api/media/setlist', { headers: CONFIG.headers() });
            if(!response.ok) return { canciones_ids: [] };
            return await response.json();
        },
        saveSetlist: async (ids) => {
            const response = await fetch('/api/media/setlist', {
                method: 'POST',
                headers: CONFIG.headers(),
                body: JSON.stringify({ canciones_ids: ids })
            });
            return response.ok;
        }
    },
    predica: {
        getBosquejo: async () => {
            const response = await fetch('/api/predica/bosquejo', { headers: CONFIG.headers() });
            if(!response.ok) return { diapositivas: [] };
            return await response.json();
        },
        saveBosquejo: async (slides) => {
            const response = await fetch('/api/predica/bosquejo', {
                method: 'POST',
                headers: CONFIG.headers(),
                body: JSON.stringify({ diapositivas: slides })
            });
            return response.ok;
        }
    },
    projection: {
        getBirthdays: async () => {
            const response = await fetch('/api/projection/birthdays', { headers: CONFIG.headers() });
            if(!response.ok) throw new Error("Falla al extraer lotes de cumpleaños");
            return await response.json();
        },
        getAnuncios: async () => {
            const response = await fetch('/api/projection/anuncios', { headers: CONFIG.headers() });
            if(!response.ok) throw new Error("Falla al extraer lotes de anuncios");
            return await response.json();
        },
        registerOfrenda: async (tipo, monto, desc, anonima) => {
            const payload = {
                tipo: tipo,
                monto: monto !== '' ? parseInt(monto) : null,
                descripcion: desc !== '' ? desc : null,
                anonima: anonima
            };

            const response = await fetch('/api/projection/ofrenda', {
                method: 'POST',
                headers: CONFIG.headers(),
                body: JSON.stringify(payload)
            });
            return { ok: response.ok, data: await response.json() };
        },
        getTotalOfrendas: async () => {
            const response = await fetch('/api/projection/ofrendas/total', { headers: CONFIG.headers() });
            if(!response.ok) throw new Error("Falla en consolidación de datos financieros");
            return await response.json();
        }
    }
};