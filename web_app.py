from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import os

from routers import admin_router, projection_router
from database.connection import init_db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(title="Sistema de Proyección Litúrgica")

app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

app.include_router(admin_router.router)
app.include_router(projection_router.router)

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