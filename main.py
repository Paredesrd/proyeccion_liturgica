import subprocess
import sys
import time
import webbrowser
import socket
from desktop import run_desktop_app

# 0.0.0.0 expone el servidor a toda la red local para acceso remoto
SERVER_HOST = "0.0.0.0"
PORT = 8000

# El host local interno para la máquina base
CLIENT_HOST = "127.0.0.1"


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
    print("Iniciando servidor de operaciones backend en toda la red local...")
    print("================================================================")
    print("ACCESO WEB DISPONIBLE (Para cualquier dispositivo en la misma red):")
    print(f" -> Control:     http://{local_ip}:{PORT}/")
    print(f" -> Proyector:   http://{local_ip}:{PORT}/projector")
    print(f" -> Admin:       http://{local_ip}:{PORT}/admin")
    print("================================================================\n")

    server_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "web_app:app", "--host", SERVER_HOST, "--port", str(PORT)],
        stdout=sys.stdout,
        stderr=sys.stderr
    )

    time.sleep(3)
    print("Servidor en línea. Desplegando interfaces...")

    # Ejecución mandatoria: Abrir el Administrador en el navegador web predeterminado del SO
    admin_url = f"http://{CLIENT_HOST}:{PORT}/admin"
    webbrowser.open(admin_url)

    try:
        # Despliegue de ventanas nativas para Control y Proyector
        run_desktop_app()
    finally:
        print("Cerrando GUI. Interrumpiendo subprocesos de red...")
        server_process.terminate()
        server_process.wait()