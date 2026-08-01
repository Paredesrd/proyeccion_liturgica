from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
import os

from database.connection import get_db
from core.security import verify_api_key
from schemas.admin_schemas import (
    CumpleanosCreate, AnuncioCreate, AnuncioUpdate,
    CancionCreate, CancionUpdate
)

from services import birthday_service, anuncio_service, cancion_service

router = APIRouter()
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# ==================== RUTAS BASE ====================

@router.get("/admin", response_class=HTMLResponse)
def admin_panel(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="admin.html"
    )

# ==================== RUTAS DE CUMPLEAÑOS ====================
# Nota: Debes refactorizar birthday_service para aceptar db: Session al igual que anuncio_service

@router.get("/api/admin/birthdays", dependencies=[Depends(verify_api_key)])
def get_birthdays(db: Session = Depends(get_db)):
    return birthday_service.obtener_todos_cumpleanos(db)

@router.get("/api/admin/birthdays/week", dependencies=[Depends(verify_api_key)])
def get_birthdays_week(db: Session = Depends(get_db)):
    return birthday_service.obtener_cumpleanos_rango(db)

@router.post("/api/admin/birthdays", dependencies=[Depends(verify_api_key)])
def add_birthday(data: CumpleanosCreate, db: Session = Depends(get_db)):
    try:
        return birthday_service.crear_cumpleanos(db, data)
    except Exception:
        raise HTTPException(status_code=500, detail="Error interno al crear cumpleaños")

@router.delete("/api/admin/birthdays/{id}", dependencies=[Depends(verify_api_key)])
def delete_birthday(id: int, db: Session = Depends(get_db)):
    if birthday_service.eliminar_cumpleanos(db, id):
        return {"message": "Eliminado correctamente"}
    raise HTTPException(status_code=404, detail="No encontrado")

# ==================== RUTAS DE ANUNCIOS ====================

@router.get("/api/admin/anuncios", dependencies=[Depends(verify_api_key)])
def get_anuncios(db: Session = Depends(get_db)):
    return anuncio_service.obtener_todos_anuncios(db)

@router.post("/api/admin/anuncios", dependencies=[Depends(verify_api_key)])
def create_anuncio(data: AnuncioCreate, db: Session = Depends(get_db)):
    try:
        return anuncio_service.crear_anuncio(db, data)
    except Exception:
        raise HTTPException(status_code=500, detail="Error interno al crear anuncio")

@router.put("/api/admin/anuncios/{id}", dependencies=[Depends(verify_api_key)])
def update_anuncio(id: int, data: AnuncioUpdate, db: Session = Depends(get_db)):
    try:
        resultado = anuncio_service.actualizar_anuncio(db, id, data)
        if resultado is None:
            raise HTTPException(status_code=404, detail="Anuncio no encontrado")
        return resultado
    except Exception:
        raise HTTPException(status_code=500, detail="Error interno al actualizar anuncio")

@router.delete("/api/admin/anuncios/{id}", dependencies=[Depends(verify_api_key)])
def delete_anuncio(id: int, db: Session = Depends(get_db)):
    if anuncio_service.eliminar_anuncio(db, id):
        return {"message": "Eliminado correctamente"}
    raise HTTPException(status_code=404, detail="No encontrado")

# ==================== RUTAS DE CANCIONERO ====================
# Nota: Debes refactorizar cancion_service para aceptar db: Session al igual que anuncio_service

@router.get("/api/admin/canciones", dependencies=[Depends(verify_api_key)])
def get_canciones(db: Session = Depends(get_db)):
    return cancion_service.obtener_todas_canciones(db)

@router.post("/api/admin/canciones", dependencies=[Depends(verify_api_key)])
def add_cancion(data: CancionCreate, db: Session = Depends(get_db)):
    try:
        return cancion_service.crear_cancion(db, data)
    except Exception:
        raise HTTPException(status_code=500, detail="Error interno al registrar canción")

@router.put("/api/admin/canciones/{id}", dependencies=[Depends(verify_api_key)])
def edit_cancion(id: int, data: CancionUpdate, db: Session = Depends(get_db)):
    try:
        resultado = cancion_service.actualizar_cancion(db, id, data)
        if resultado is None:
            raise HTTPException(status_code=404, detail="Canción no encontrada")
        return resultado
    except Exception:
        raise HTTPException(status_code=500, detail="Error interno al actualizar canción")

@router.delete("/api/admin/canciones/{id}", dependencies=[Depends(verify_api_key)])
def drop_cancion(id: int, db: Session = Depends(get_db)):
    if cancion_service.eliminar_cancion(db, id):
        return {"message": "Canción eliminada correctamente"}
    raise HTTPException(status_code=404, detail="Canción no encontrada")