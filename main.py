import threading
import uvicorn
import time
from web_app import app
from desktop import run_desktop_app

HOST = "127.0.0.1"
PORT = 8000


def run_fastapi():
    config = uvicorn.Config(app, host=HOST, port=PORT, log_level="warning")
    server = uvicorn.Server(config)
    server.run()


if __name__ == "__main__":
    print("Iniciando servidor...")
    server_thread = threading.Thread(target=run_fastapi, daemon=True)
    server_thread.start()

    time.sleep(3)
    print("Servidor listo. Abriendo ventanas...")

    run_desktop_app()