from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
import os
import shutil
import uuid
import re
import json

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA_DIR = os.path.join(BASE_DIR, "static", "media")
DATA_DIR = os.path.join(BASE_DIR, "static", "data")

os.makedirs(os.path.join(MEDIA_DIR, "audio"), exist_ok=True)
os.makedirs(os.path.join(MEDIA_DIR, "backgrounds"), exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

SETLIST_FILE = os.path.join(DATA_DIR, "setlist.json")
PREDICA_FILE = os.path.join(DATA_DIR, "predica.json")

def _sanitize_filename(name: str) -> str:
    clean_name = name.replace(" ", "_")
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '', clean_name)
    return clean_name

@router.post("/api/media/upload")
async def upload_media(file: UploadFile = File(...), media_type: str = Form(...)):
    if media_type not in ["audio", "backgrounds"]:
        raise HTTPException(status_code=400, detail="Tipo de medio no soportado.")

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
                    "url": f"/static/media/backgrounds/{filename}"
                })
    return {"backgrounds": files}

@router.get("/api/media/setlist")
def get_setlist():
    if os.path.exists(SETLIST_FILE):
        with open(SETLIST_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"canciones_ids": []}

@router.post("/api/media/setlist")
async def update_setlist(request: Request):
    data = await request.json()
    with open(SETLIST_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f)
    return {"status": "ok"}

@router.get("/api/predica/bosquejo")
def get_bosquejo():
    if os.path.exists(PREDICA_FILE):
        with open(PREDICA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"diapositivas": []}

@router.post("/api/predica/bosquejo")
async def save_bosquejo(request: Request):
    data = await request.json()
    with open(PREDICA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f)
    return {"status": "ok"}