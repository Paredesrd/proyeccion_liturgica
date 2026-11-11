import os
from pathlib import Path
import subprocess
import shutil

def fix_y_recompilar():
    base = Path(r"C:\Users\`pc\PycharmProjects\proyeccion_liturgica")

    # 1. PATCH: main.py (Añadir freeze_support)
    main_p = base / "main.py"
    c_main = main_p.read_text(encoding="utf-8")
    if "multiprocessing.freeze_support()" not in c_main:
        c_main = c_main.replace(
            "import sys\nimport os\n",
            "import sys\nimport os\nimport multiprocessing\n"
        )
        c_main = c_main.replace(
            "if __name__ == \"__main__\":",
            "if __name__ == \"__main__\":\n    multiprocessing.freeze_support()"
        )
        main_p.write_text(c_main, encoding="utf-8")
        print("[PATCH] multiprocessing.freeze_support() anadido a main.py.")

    # 2. PATCH: web_app.py (Separar estáticos del ejecutable vs medios externos)
    web_p = base / "web_app.py"
    c_web = web_p.read_text(encoding="utf-8")
    if "BUNDLED_DIR" not in c_web:
        c_web = c_web.replace(
            "if getattr(sys, 'frozen', False):\n    BASE_DIR = sys._MEIPASS\nelse:\n    BASE_DIR = os.path.dirname(os.path.abspath(__file__))",
            "from core.config import BASE_DIR\nif getattr(sys, 'frozen', False):\n    BUNDLED_DIR = sys._MEIPASS\nelse:\n    BUNDLED_DIR = os.path.dirname(os.path.abspath(__file__))"
        )
        old_mount = 'app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")'
        new_mount = '''EXTERNAL_MEDIA_DIR = os.path.join(BASE_DIR, "static", "media")
os.makedirs(EXTERNAL_MEDIA_DIR, exist_ok=True)
app.mount("/static/media", StaticFiles(directory=EXTERNAL_MEDIA_DIR), name="media")
app.mount("/static", StaticFiles(directory=os.path.join(BUNDLED_DIR, "static")), name="static")'''
        c_web = c_web.replace(old_mount, new_mount)
        web_p.write_text(c_web, encoding="utf-8")
        print("[PATCH] web_app.py: Rutas separadas (estaticos internos vs medios externos).")

    # 3. PATCH: media_router.py (Guardar medios en carpeta externa persistente)
    media_p = base / "routers" / "media_router.py"
    c_media = media_p.read_text(encoding="utf-8")
    if "from core.config import BASE_DIR" not in c_media:
        c_media = c_media.replace(
            'BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))',
            'from core.config import BASE_DIR'
        )
        media_p.write_text(c_media, encoding="utf-8")
        print("[PATCH] media_router.py: Guardado de medios movido a carpeta externa persistente.")

    print("\nRecompilando el ejecutable (por favor espera)...")

    # Respaldar medios existentes en la carpeta dist (si los hay) para no perderlos al recompilar
    dist_media = base / "dist" / "ProyeccionLiturgica" / "static" / "media"
    temp_media = base / "temp_media_backup"
    if dist_media.exists():
        shutil.move(str(dist_media), str(temp_media))

    if (base / "build").exists(): shutil.rmtree(base / "build")
    if (base / "dist").exists(): shutil.rmtree(base / "dist")

    comando = [
        ".\\.venv\\Scripts\\pyinstaller.exe",
        "--noconfirm",
        "--onedir",
        "--console",
        "--name", "ProyeccionLiturgica",
        "--add-data", "templates;templates",
        "--add-data", "static;static",
        "--hidden-import", "uvicorn.logging",
        "--hidden-import", "uvicorn.loops",
        "--hidden-import", "uvicorn.loops.auto",
        "--hidden-import", "uvicorn.protocols",
        "--hidden-import", "uvicorn.protocols.http",
        "--hidden-import", "uvicorn.protocols.http.auto",
        "--hidden-import", "uvicorn.protocols.websockets",
        "--hidden-import", "uvicorn.protocols.websockets.auto",
        "--hidden-import", "uvicorn.lifespan",
        "--hidden-import", "uvicorn.lifespan.on",
        "main.py"
    ]
    subprocess.run(comando, check=True)

    dist_dir = base / "dist" / "ProyeccionLiturgica"
    shutil.copy2(base / "liturgia.db", dist_dir / "liturgia.db")
    os.makedirs(dist_dir / "database", exist_ok=True)
    shutil.copy2(base / "database" / "biblias.db", dist_dir / "database" / "biblias.db")

    dist_media_new = dist_dir / "static" / "media"
    if temp_media.exists():
        if dist_media_new.exists(): shutil.rmtree(dist_media_new)
        shutil.move(str(temp_media), str(dist_media_new))
        print("[OK] Medios existentes restaurados en dist.")
    elif (base / "static" / "media").exists():
        if dist_media_new.exists(): shutil.rmtree(dist_media_new)
        shutil.copytree(base / "static" / "media", dist_media_new)
        print("[OK] Medios iniciales copiados desde el codigo fuente.")

    print("\n[COMPLETADO] Ejecuta ahora:", dist_dir / "ProyeccionLiturgica.exe")

if __name__ == "__main__":
    fix_y_recompilar()
