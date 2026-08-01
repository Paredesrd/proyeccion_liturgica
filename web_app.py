from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import os

from core.config import settings
from core.logger import log
from database.connection import init_db
from routers import admin_router, projection_router, media_router, bible_router

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

@app.on_event("startup")
async def startup_event():
    log.info("Iniciando motor del servidor y componentes de persistencia...")
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