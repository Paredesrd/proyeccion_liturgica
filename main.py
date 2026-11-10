import sys
import os

# =====================================================================
# 1. BLINDAJE DE CONSOLA (DEBE ESTAR AQUÍ, EN LA CIMA DEL ARCHIVO)
# =====================================================================
if getattr(sys, 'frozen', False):
    base_path = os.path.dirname(os.path.abspath(sys.executable))
else:
    base_path = os.path.dirname(os.path.abspath(__file__))

log_file = open(os.path.join(base_path, "backend_error.log"), "a", encoding="utf-8")
pass # sys.stdout = log_file
pass # sys.stderr = log_file

# =====================================================================
# 2. IMPORTACIONES DEL SISTEMA
# =====================================================================
import time
import webbrowser
import socket
import threading
import uvicorn

from desktop import run_desktop_app
from utils.backup import realizar_backup
from core.config import settings
from core.logger import log
from web_app import app


def get_local_ip():
    """Obtiene la IP local de forma pasiva y sin requerir Internet."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def start_server():
    """Ejecución del servidor web."""
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)


if __name__ == "__main__":
    local_ip = get_local_ip()
    log.info("Iniciando infraestructura de backend en red local...")

    print("================================================================")
    print("ACCESO WEB DISPONIBLE (Para cualquier dispositivo en la misma red):")
    print(f" -> Control:     http://{local_ip}:{settings.PORT}/")
    print(f" -> Proyector:   http://{local_ip}:{settings.PORT}/projector")
    print(f" -> Admin:       http://{local_ip}:{settings.PORT}/admin")
    print("================================================================\n")

    log_file.flush()

    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    time.sleep(3)

    log.info("Servidor en línea. Desplegando interfaces de escritorio nativas...")

    admin_url = f"http://127.0.0.1:{settings.PORT}/admin"
    webbrowser.open(admin_url)

    try:
        run_desktop_app()
    finally:
        log.warning("Cerrando GUI. El hilo del servidor daemon se destruirá automáticamente.")
        realizar_backup() # <--- RESPALDO AUTOMÁTICO AL CERRAR
        log.info("Sistema detenido correctamente.")
        log_file.close()