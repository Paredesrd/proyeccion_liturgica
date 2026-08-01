import subprocess
import sys
import time
import webbrowser
import socket
from desktop import run_desktop_app
from core.config import settings
from core.logger import log


def get_local_ip():
    """Obtiene la IP local asignada por el router (LAN/WLAN)."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


if __name__ == "__main__":
    local_ip = get_local_ip()

    log.info("Iniciando infraestructura de backend en red local...")
    print("================================================================")
    print("ACCESO WEB DISPONIBLE (Para cualquier dispositivo en la misma red):")
    print(f" -> Control:     http://{local_ip}:{settings.PORT}/")
    print(f" -> Proyector:   http://{local_ip}:{settings.PORT}/projector")
    print(f" -> Admin:       http://{local_ip}:{settings.PORT}/admin")
    print("================================================================\n")

    server_process = subprocess.Popen(
        [
            sys.executable, "-m", "uvicorn", "web_app:app",
            "--host", settings.HOST,
            "--port", str(settings.PORT)
        ],
        stdout=sys.stdout,
        stderr=sys.stderr
    )

    time.sleep(3)
    log.info("Servidor en línea. Desplegando interfaces de escritorio nativas...")

    admin_url = f"http://127.0.0.1:{settings.PORT}/admin"
    webbrowser.open(admin_url)

    try:
        run_desktop_app()
    finally:
        log.warning("Cerrando GUI. Interrumpiendo subprocesos de red...")
        server_process.terminate()
        server_process.wait()
        log.info("Sistema detenido correctamente.")