from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import os

# Importación de módulos escalables (Incluyendo el router bíblico)
from routers import admin_router, projection_router, media_router, bible_router
from database.connection import init_db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(title="Sistema de Proyección Litúrgica")

# Montaje de estáticos y plantillas
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# Registro de Routers
app.include_router(admin_router.router)
app.include_router(projection_router.router)
app.include_router(media_router.router)
app.include_router(bible_router.router) # Enlace activo del motor de biblias

@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/", response_class=HTMLResponse)
async def get_control_panel(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="control.html"
    )

@app.get("/projector", response_class=HTMLResponse)
async def get_projector_view(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="projector.html"
    )