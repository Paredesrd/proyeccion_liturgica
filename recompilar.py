import os
from pathlib import Path
import subprocess
import shutil

def fix_y_recompilar():
    base = Path(r"C:\Users\`pc\PycharmProjects\proyeccion_liturgica")
    
    # =========================================================
    # 1. PATCH: main.py (Añadir freeze_support)
    # =========================================================
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
        print("✅ [PATCH] multiprocessing.freeze_support() añadido a main.py.")

    # =========================================================
    # 2. PATCH: web_app.py (Rutas compatibles con PyInstaller)
    # =========================================================
    web_p = base / "web_app.py"
    c_web = web_p.read_text(encoding="utf-8")
    
    if "sys._MEIPASS" not in c_web:
        # Añadir import sys
        if "import sys" not in c_web:
            c_web = c_web.replace("import os\n", "import os\nimport sys\n")
            
        # Lógica para encontrar las carpetas static y templates
        c_web = c_web.replace(
            'BASE_DIR = os.path.dirname(os.path.abspath(__file__))',
            '''if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))'''
        )
        web_p.write_text(c_web, encoding="utf-8")
        print("✅ [PATCH] web_app.py: Rutas corregidas para PyInstaller (sys._MEIPASS).")

    # =========================================================
    # 3. RECOMPILAR CON CONSOLA VISIBLE (para ver errores)
    # =========================================================
    print("\n🛠️ Recompilando el ejecutable (por favor espera)...")
    
    # Limpiamos carpetas anteriores
    if (base / "build").exists(): shutil.rmtree(base / "build")
    if (base / "dist").exists(): shutil.rmtree(base / "dist")
    
    comando = [
        ".\\.venv\\Scripts\\pyinstaller.exe",
        "--noconfirm",
        "--onedir",
        "--console", # IMPORTANTE: Consola visible para ver errores si falla
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

    # =========================================================
    # 4. COPIAR BASES DE DATOS
    # =========================================================
    dist_dir = base / "dist" / "ProyeccionLiturgica"
    shutil.copy2(base / "liturgia.db", dist_dir / "liturgia.db")
    os.makedirs(dist_dir / "database", exist_ok=True)
    shutil.copy2(base / "database" / "biblias.db", dist_dir / "database" / "biblias.db")
    
    if (dist_dir / "static" / "media").exists(): shutil.rmtree(dist_dir / "static" / "media")
    shutil.copytree(base / "static" / "media", dist_dir / "static" / "media")

    print("\n🎉 ¡RECOMPILACIÓN COMPLETADA!")
    print(f"👉 Ejecuta ahora: {dist_dir / 'ProyeccionLiturgica.exe'}")

if __name__ == "__main__":
    fix_y_recompilar()
    os.remove(__file__)
