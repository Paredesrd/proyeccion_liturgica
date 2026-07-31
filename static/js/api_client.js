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
                const response = await fetch('/api/media/upload', { method: 'POST', body: formData });
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
            const response = await fetch('/api/media/backgrounds');
            if(!response.ok) throw new Error("Falla al listar catálogo de fondos");
            return await response.json();
        }
    },
    bible: {
        getVersions: async () => {
            const response = await fetch('/api/bible/versions');
            if(!response.ok) throw new Error("Falla al extraer las versiones bíblicas");
            return await response.json();
        },
        getBooks: async (version = "RVR1960") => {
            const response = await fetch(`/api/bible/books?version=${encodeURIComponent(version)}`);
            if(!response.ok) throw new Error("Falla de acceso a datos bíblicos");
            return await response.json();
        },
        searchVerse: async (book, chapter, version="RVR1960") => {
            const response = await fetch(`/api/bible/search?libro=${encodeURIComponent(book)}&capitulo=${encodeURIComponent(chapter)}&version=${version}`);
            return { ok: response.ok, data: await response.json() };
        }
    },
    canciones: {
        getAll: async () => {
            const response = await fetch('/api/admin/canciones');
            if(!response.ok) throw new Error("Falla al extraer el cancionero");
            return await response.json();
        },
        getSetlist: async () => {
            const response = await fetch('/api/media/setlist');
            if(!response.ok) return { canciones_ids: [] };
            return await response.json();
        },
        saveSetlist: async (ids) => {
            const response = await fetch('/api/media/setlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ canciones_ids: ids })
            });
            return response.ok;
        }
    },
    predica: {
        getBosquejo: async () => {
            const response = await fetch('/api/predica/bosquejo');
            if(!response.ok) return { diapositivas: [] };
            return await response.json();
        },
        saveBosquejo: async (slides) => {
            const response = await fetch('/api/predica/bosquejo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ diapositivas: slides })
            });
            return response.ok;
        }
    },
    projection: {
        getBirthdays: async () => {
            const response = await fetch('/api/projection/birthdays');
            if(!response.ok) throw new Error("Falla al extraer lotes de cumpleaños");
            return await response.json();
        },
        getAnuncios: async () => {
            const response = await fetch('/api/projection/anuncios');
            if(!response.ok) throw new Error("Falla al extraer lotes de anuncios");
            return await response.json();
        },
        registerOfrenda: async (tipo, monto, desc, anonima) => {
            let url = `/api/projection/ofrenda?tipo=${encodeURIComponent(tipo)}&anonima=${anonima}`;
            if (monto !== '') url += `&monto=${encodeURIComponent(monto)}`;
            if (desc !== '') url += `&descripcion=${encodeURIComponent(desc)}`;

            const response = await fetch(url, { method: 'POST' });
            return { ok: response.ok, data: await response.json() };
        },
        getTotalOfrendas: async () => {
            const response = await fetch('/api/projection/ofrendas/total');
            if(!response.ok) throw new Error("Falla en consolidación de datos financieros");
            return await response.json();
        }
    }
};