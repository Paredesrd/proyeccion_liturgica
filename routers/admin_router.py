from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
import os

from services.birthday_service import obtener_cumpleanos_rango, crear_cumpleanos, eliminar_cumpleanos, obtener_todos_cumpleanos
from services.anuncio_service import obtener_todos_anuncios, crear_anuncio, actualizar_anuncio, eliminar_anuncio
from services.ofrenda_service import obtener_todas_ofrendas, crear_ofrenda, eliminar_ofrenda
from services.bible_service import buscar_textos_biblicos

router = APIRouter()
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

from fastapi.templating import Jinja2Templates
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

class CumpleanosCreate(BaseModel):
    nombre: str = Field(..., min_length=1, description="Nombre completo de la persona")
    fecha: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="Fecha en formato YYYY-MM-DD")

class AnuncioCreate(BaseModel):
    titulo: str = Field(..., min_length=1, description="Título del anuncio")
    contenido: str = Field(..., min_length=1, description="Contenido del anuncio")
    color: str = Field(default="#3498db", description="Color del anuncio")
    activo: bool = True

class AnuncioUpdate(BaseModel):
    titulo: str | None = Field(None, min_length=1)
    contenido: str | None = Field(None, min_length=1)
    color: str | None = None
    activo: bool | None = None

class OfrendaCreate(BaseModel):
    concepto: str = Field(..., min_length=1, description="Concepto de la ofrenda")
    monto: float = Field(..., gt=0, description="Monto de la ofrenda")
    fecha: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="Fecha en formato YYYY-MM-DD")

@router.get("/admin", response_class=HTMLResponse)
async def admin_panel(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="admin.html"
    )

@router.get("/api/admin/birthdays")
async def get_birthdays():
    """Obtiene todos los cumpleaños registrados."""
    return obtener_todos_cumpleanos()

@router.get("/api/admin/birthdays/week")
async def get_birthdays_week():
    """Obtiene los cumpleaños de la semana (7 días atrás y 2 adelante)."""
    return obtener_cumpleanos_rango()

@router.post("/api/admin/birthdays")
async def add_birthday(data: CumpleanosCreate):
    """Crea un nuevo registro de cumpleaños."""
    try:
        return crear_cumpleanos(data.nombre, data.fecha)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al crear cumpleaños")

@router.delete("/api/admin/birthdays/{id}")
async def delete_birthday(id: int):
    """Elimina un cumpleaños por ID."""
    if eliminar_cumpleanos(id):
        return {"message": "Eliminado correctamente"}
    raise HTTPException(status_code=404, detail="No encontrado")

# ==================== RUTAS DE ANUNCIOS ====================

@router.get("/api/admin/anuncios")
async def get_anuncios():
    """Obtiene todos los anuncios."""
    return obtener_todos_anuncios()

@router.post("/api/admin/anuncios")
async def create_anuncio(data: AnuncioCreate):
    """Crea un nuevo anuncio."""
    try:
        return crear_anuncio(data.titulo, data.contenido, data.activo, data.color)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al crear anuncio")

@router.put("/api/admin/anuncios/{id}")
async def update_anuncio(id: int, data: AnuncioUpdate):
    """Actualiza un anuncio existente."""
    try:
        resultado = actualizar_anuncio(
            id=id,
            titulo=data.titulo,
            contenido=data.contenido,
            color=data.color,
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
async def delete_anuncio(id: int):
    """Elimina un anuncio por ID."""
    if eliminar_anuncio(id):
        return {"message": "Eliminado correctamente"}
    raise HTTPException(status_code=404, detail="No encontrado")

# ==================== RUTAS DE OFRENDAS ====================

@router.get("/api/admin/ofrendas")
async def get_ofrendas():
    """Obtiene todas las ofrendas registradas."""
    return obtener_todas_ofrendas()

@router.post("/api/admin/ofrendas")
async def create_ofrenda(data: OfrendaCreate):
    """Crea un nuevo registro de ofrenda."""
    try:
        return crear_ofrenda(data.concepto, data.monto, data.fecha)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al crear ofrenda")

@router.delete("/api/admin/ofrendas/{id}")
async def delete_ofrenda(id: int):
    """Elimina una ofrenda por ID."""
    if eliminar_ofrenda(id):
        return {"message": "Eliminado correctamente"}
    raise HTTPException(status_code=404, detail="No encontrado")

# ==================== RUTAS DE TEXTOS BÍBLICOS ====================

@router.get("/api/admin/textos")
async def get_textos(busqueda: str = ""):
    """Obtiene todos los textos bíblicos o busca por término."""
    return buscar_textos_biblicos(busqueda)