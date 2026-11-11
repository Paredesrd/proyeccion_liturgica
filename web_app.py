from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
import socket

from core.config import settings
from core.logger import log
from database.connection import init_db
from routers import admin_router, projection_router, media_router, bible_router, search_router

if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION
)

# Configuración de CORS estricta pero funcional para red local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montaje de recursos estáticos y plantillas
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# Registro unificado de Routers
app.include_router(admin_router.router)
app.include_router(projection_router.router)
app.include_router(media_router.router)
app.include_router(bible_router.router)
app.include_router(search_router.router)


@app.on_event("startup")
async def startup_event():
    log.info("Iniciando motor del servidor y componentes de persistencia...")
    init_db()


def get_local_ip() -> str:
    """Obtiene la IP local de forma pasiva y sin requerir Internet."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


@app.get("/api/system/access")
def api_system_access():
    """
    Entrega las URLs activas del sistema con la IP real detectada,
    para el modal de Acceso Remoto del Panel de Control.
    """
    ip = get_local_ip()
    base = f"http://{ip}:{settings.PORT}"
    return {
        "local_ip": ip,
        "port": settings.PORT,
        "urls": {
            "control": f"{base}/",
            "projector": f"{base}/projector",
            "admin": f"{base}/admin",
            "stage": f"{base}/stage",
        },
    }


@app.get("/", response_class=HTMLResponse)
async def get_control_panel(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="control.html"
    )


@app.get("/stage", response_class=HTMLResponse)
async def get_stage_view(request: Request):
    return templates.TemplateResponse(request=request, name="stage.html")

@app.get("/projector", response_class=HTMLResponse)
async def get_projector_view(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="projector.html"
    )