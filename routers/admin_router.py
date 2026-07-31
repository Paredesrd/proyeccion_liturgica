from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
import os

from services.birthday_service import obtener_cumpleanos_rango, crear_cumpleanos, eliminar_cumpleanos, obtener_todos_cumpleanos
from services.anuncio_service import obtener_todos_anuncios, crear_anuncio, actualizar_anuncio, eliminar_anuncio
from services.cancion_service import obtener_todas_canciones, crear_cancion, actualizar_cancion, eliminar_cancion

router = APIRouter()
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

from fastapi.templating import Jinja2Templates
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# ==================== ESQUEMAS PYDANTIC ====================

class CumpleanosCreate(BaseModel):
    nombre: str = Field(..., min_length=1, description="Nombre completo de la persona")
    fecha: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="Fecha en formato YYYY-MM-DD")

class AnuncioCreate(BaseModel):
    titulo: str = Field(..., min_length=1, description="Título del anuncio")
    contenido: str = Field(..., min_length=1, description="Contenido del anuncio")
    activo: bool = True

class AnuncioUpdate(BaseModel):
    titulo: str | None = Field(None, min_length=1)
    contenido: str | None = Field(None, min_length=1)
    activo: bool | None = None

class CancionCreate(BaseModel):
    titulo: str = Field(..., min_length=1, description="Título de la canción")
    autor: str | None = Field(None, description="Autor o ministerio")
    letra: str = Field(..., min_length=1, description="Letra completa de la canción")

class CancionUpdate(BaseModel):
    titulo: str | None = Field(None, min_length=1)
    autor: str | None = Field(None)
    letra: str | None = Field(None, min_length=1)

# ==================== RUTAS BASE ====================

@router.get("/admin", response_class=HTMLResponse)
def admin_panel(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="admin.html"
    )

# ==================== RUTAS DE CUMPLEAÑOS ====================

@router.get("/api/admin/birthdays")
def get_birthdays():
    return obtener_todos_cumpleanos()

@router.get("/api/admin/birthdays/week")
def get_birthdays_week():
    return obtener_cumpleanos_rango()

@router.post("/api/admin/birthdays")
def add_birthday(data: CumpleanosCreate):
    try:
        return crear_cumpleanos(data.nombre, data.fecha)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al crear cumpleaños")

@router.delete("/api/admin/birthdays/{id}")
def delete_birthday(id: int):
    if eliminar_cumpleanos(id):
        return {"message": "Eliminado correctamente"}
    raise HTTPException(status_code=404, detail="No encontrado")

# ==================== RUTAS DE ANUNCIOS ====================

@router.get("/api/admin/anuncios")
def get_anuncios():
    return obtener_todos_anuncios()

@router.post("/api/admin/anuncios")
def create_anuncio(data: AnuncioCreate):
    try:
        return crear_anuncio(data.titulo, data.contenido, data.activo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al crear anuncio")

@router.put("/api/admin/anuncios/{id}")
def update_anuncio(id: int, data: AnuncioUpdate):
    try:
        resultado = actualizar_anuncio(
            id=id,
            titulo=data.titulo,
            contenido=data.contenido,
            activo=data.activo
        )
        if resultado is None:
            raise HTTPException(status_code=404, detail="Anuncio no encontrado")
        return resultado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al actualizar anuncio")

@router.delete("/api/admin/anuncios/{id}")
def delete_anuncio(id: int):
    if eliminar_anuncio(id):
        return {"message": "Eliminado correctamente"}
    raise HTTPException(status_code=404, detail="No encontrado")

# ==================== RUTAS DE CANCIONERO ====================

@router.get("/api/admin/canciones")
def get_canciones():
    return obtener_todas_canciones()

@router.post("/api/admin/canciones")
def add_cancion(data: CancionCreate):
    try:
        return crear_cancion(data.titulo, data.autor, data.letra)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al registrar canción")

@router.put("/api/admin/canciones/{id}")
def edit_cancion(id: int, data: CancionUpdate):
    try:
        resultado = actualizar_cancion(
            id=id,
            titulo=data.titulo,
            autor=data.autor,
            letra=data.letra
        )
        if resultado is None:
            raise HTTPException(status_code=404, detail="Canción no encontrada")
        return resultado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al actualizar canción")

@router.delete("/api/admin/canciones/{id}")
def drop_cancion(id: int):
    if eliminar_cancion(id):
        return {"message": "Canción eliminada correctamente"}
    raise HTTPException(status_code=404, detail="Canción no encontrada")