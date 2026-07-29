from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import os

from services.birthday_service import obtener_cumpleanos_rango, crear_cumpleanos, eliminar_cumpleanos

router = APIRouter()
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

from fastapi.templating import Jinja2Templates
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

class CumpleanosCreate(BaseModel):
    nombre: str
    fecha: str

@router.get("/admin", response_class=HTMLResponse)
async def admin_panel(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="admin.html"
    )

@router.get("/api/admin/birthdays")
async def get_birthdays():
    return obtener_cumpleanos_rango()

@router.post("/api/admin/birthdays")
async def add_birthday(data: CumpleanosCreate):
    return crear_cumpleanos(data.nombre, data.fecha)

@router.delete("/api/admin/birthdays/{id}")
async def delete_birthday(id: int):
    if eliminar_cumpleanos(id):
        return {"message": "Eliminado"}
    raise HTTPException(status_code=404, detail="No encontrado")