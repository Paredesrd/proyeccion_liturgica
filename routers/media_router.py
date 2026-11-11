from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request, Depends
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import PredicaSlide, SetlistItem
import os
import shutil
import uuid
import re

router = APIRouter()

from core.config import BASE_DIR
MEDIA_DIR = os.path.join(BASE_DIR, "static", "media")
DATA_DIR = os.path.join(BASE_DIR, "static", "data")

os.makedirs(os.path.join(MEDIA_DIR, "audio"), exist_ok=True)
os.makedirs(os.path.join(MEDIA_DIR, "backgrounds"), exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

SETLIST_FILE = os.path.join(DATA_DIR, "setlist.json")
PREDICA_FILE = os.path.join(DATA_DIR, "predica.json")

# Restricción estricta de formatos
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".webm"}


def _sanitize_filename(name: str) -> str:
    clean_name = name.replace(" ", "_")
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '', clean_name)
    return clean_name


@router.post("/api/media/upload")
async def upload_media(file: UploadFile = File(...), media_type: str = Form(...)):
    if media_type not in ["audio", "backgrounds"]:
        raise HTTPException(status_code=400, detail="Tipo de medio no soportado.")

    ext = os.path.splitext(file.filename)[1].lower()
    if media_type == "backgrounds" and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Formato no permitido. Use JPG, PNG, WEBP, MP4 o WEBM.")

    safe_name = _sanitize_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex[:6]}_{safe_name}"
    file_path = os.path.join(MEDIA_DIR, media_type, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fallo de E/S en disco: {str(e)}")

    return {
        "url": f"/static/media/{media_type}/{unique_filename}",
        "original_filename": file.filename
    }


@router.get("/api/media/backgrounds")
def get_backgrounds():
    bg_dir = os.path.join(MEDIA_DIR, "backgrounds")
    files = []
    if os.path.exists(bg_dir):
        for filename in os.listdir(bg_dir):
            if os.path.isfile(os.path.join(bg_dir, filename)):
                if filename.startswith("default."):
                    continue
                display_name = filename.split('_', 1)[1] if '_' in filename else filename
                files.append({
                    "filename": display_name,
                    "raw_filename": filename,
                    "url": f"/static/media/backgrounds/{filename}"
                })
    return {"backgrounds": files}


@router.delete("/api/media/backgrounds/{filename}")
def delete_background(filename: str):
    safe_filename = os.path.basename(filename)  # Previene ataques de salto de directorio
    file_path = os.path.join(MEDIA_DIR, "backgrounds", safe_filename)

    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return {"message": "Fondo eliminado físicamente del servidor."}
        except Exception as e:
            raise HTTPException(status_code=500, detail="Error de permisos al intentar borrar.")

    raise HTTPException(status_code=404, detail="El archivo no existe en el disco.")


@router.get("/api/media/setlist")
def get_setlist(db: Session = Depends(get_db)):
    items = db.query(SetlistItem).order_by(SetlistItem.orden).all()
    return {"canciones_ids": [item.cancion_id for item in items]}

@router.post("/api/media/setlist")
async def update_setlist(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    ids = data.get("canciones_ids", [])
    db.query(SetlistItem).delete()
    for i, cid in enumerate(ids):
        db.add(SetlistItem(cancion_id=cid, orden=i))
    db.commit()
    return {"status": "ok"}


@router.get("/api/predica/bosquejo")
def get_bosquejo(db: Session = Depends(get_db)):
    slides = db.query(PredicaSlide).order_by(PredicaSlide.orden).all()
    return {"diapositivas": [{"id": s.id, "titulo": s.titulo, "contenido": s.contenido, "cita": s.cita or ""} for s in slides]}

@router.post("/api/predica/bosquejo")
async def save_bosquejo(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    slides = data.get("diapositivas", [])
    db.query(PredicaSlide).delete()
    for i, slide in enumerate(slides):
        db.add(PredicaSlide(
            orden=i, 
            titulo=slide["titulo"], 
            contenido=slide["contenido"], 
            cita=slide.get("cita", "")
        ))
    db.commit()
    return {"status": "ok"}
@router.get("/api/media/audios")
def get_audios():
    audio_dir = os.path.join(MEDIA_DIR, "audio")
    files = []
    if os.path.exists(audio_dir):
        for filename in os.listdir(audio_dir):
            if os.path.isfile(os.path.join(audio_dir, filename)):
                if filename.startswith("default."):
                    continue
                display_name = filename.split('_', 1)[1] if '_' in filename else filename
                files.append({
                    "filename": display_name,
                    "raw_filename": filename,
                    "url": f"/static/media/audio/{filename}"
                })
    return {"audios": files}


@router.delete("/api/media/audios/{filename}")
def delete_audio(filename: str):
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(MEDIA_DIR, "audio", safe_filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return {"message": "Audio eliminado del servidor."}
        except Exception:
            raise HTTPException(status_code=500, detail="Error de permisos al intentar borrar.")
    raise HTTPException(status_code=404, detail="El archivo no existe en el disco.")
from sqlalchemy import text as sql_text


@router.get("/api/config/lote/{prefijo}")
def get_config_lote(prefijo: str, db: Session = Depends(get_db)):
    db.execute(sql_text("CREATE TABLE IF NOT EXISTS configuracion (clave VARCHAR PRIMARY KEY, valor TEXT)"))
    db.commit()
    rows = db.execute(sql_text("SELECT clave, valor FROM configuracion WHERE clave LIKE :p"), {"p": prefijo + "%"}).fetchall()
    return {"valores": {r[0]: r[1] for r in rows}}


@router.post("/api/config/lote")
async def save_config_lote(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    valores = data.get("valores", {})
    db.execute(sql_text("CREATE TABLE IF NOT EXISTS configuracion (clave VARCHAR PRIMARY KEY, valor TEXT)"))
    for k, v in valores.items():
        db.execute(sql_text("DELETE FROM configuracion WHERE clave = :k"), {"k": k})
        db.execute(sql_text("INSERT INTO configuracion (clave, valor) VALUES (:k, :v)"), {"k": k, "v": str(v)})
    db.commit()
    return {"status": "ok"}
