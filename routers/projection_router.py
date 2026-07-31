from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.responses import JSONResponse
import logging

from services.birthday_service import obtener_cumpleanos_rango
from services.anuncio_service import obtener_anuncios_activos
from services.ofrenda_service import crear_ofrenda, obtener_total_ofrendas

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    """Gestiona las conexiones WebSocket para sincronización en tiempo real."""

    def __init__(self):
        self.projector_clients: list[WebSocket] = []
        self.control_clients: list[WebSocket] = []

    async def connect_projector(self, websocket: WebSocket):
        await websocket.accept()
        self.projector_clients.append(websocket)
        logger.info(f"Proyector/Monitor conectado. Total: {len(self.projector_clients)}")

    async def connect_control(self, websocket: WebSocket):
        await websocket.accept()
        self.control_clients.append(websocket)
        logger.info(f"Cliente de control conectado. Total: {len(self.control_clients)}")

    def disconnect_projector(self, websocket: WebSocket):
        if websocket in self.projector_clients:
            self.projector_clients.remove(websocket)
        logger.info(f"Proyector/Monitor desconectado. Total: {len(self.projector_clients)}")

    def disconnect_control(self, websocket: WebSocket):
        if websocket in self.control_clients:
            self.control_clients.remove(websocket)
        logger.info(f"Cliente de control desconectado. Total: {len(self.control_clients)}")

    async def send_to_projector(self, message: dict):
        """Envía un mensaje a todos los proyectores y monitores activos."""
        for client in self.projector_clients[:]:
            try:
                await client.send_json(message)
            except Exception as e:
                logger.error(f"Error al enviar al proyector/monitor: {e}")
                self.disconnect_projector(client)

    async def broadcast_to_controls(self, message: dict):
        """Difunde un mensaje a todos los clientes de control."""
        for client in self.control_clients[:]:
            try:
                await client.send_json(message)
            except Exception:
                self.control_clients.remove(client)


manager = ConnectionManager()


# Las conexiones WebSocket REQUIEREN obligatoriamente async
@router.websocket("/ws/{client_type}")
async def websocket_endpoint(websocket: WebSocket, client_type: str):
    """Endpoint WebSocket para comunicación en tiempo real."""
    if client_type == "projector":
        await manager.connect_projector(websocket)
        try:
            while True:
                data = await websocket.receive_json()
                logger.info(f"Mensaje del proyector: {data}")
        except WebSocketDisconnect:
            manager.disconnect_projector(websocket)
        except Exception as e:
            logger.error(f"Error en WebSocket del proyector: {e}")
            manager.disconnect_projector(websocket)

    elif client_type == "control":
        await manager.connect_control(websocket)
        try:
            while True:
                data = await websocket.receive_json()
                await manager.send_to_projector(data)
        except WebSocketDisconnect:
            manager.disconnect_control(websocket)
        except Exception as e:
            logger.error(f"Error en WebSocket de control: {e}")
            manager.disconnect_control(websocket)


# ==================== RUTAS DE PROYECCIÓN (SÍNCRONAS) ====================

@router.get("/api/projection/birthdays")
def get_projection_birthdays():
    """Obtiene cumpleaños de la semana para proyección."""
    return {"cumpleanos": obtener_cumpleanos_rango()}


@router.get("/api/projection/anuncios")
def get_projection_anuncios():
    """Obtiene anuncios activos para proyección."""
    return {"anuncios": obtener_anuncios_activos()}


@router.post("/api/projection/ofrenda")
def register_ofrenda(tipo: str, monto: int = None, descripcion: str = None, anonima: bool = False):
    """Registra una ofrenda y opcionalmente la proyecta."""
    try:
        resultado = crear_ofrenda(tipo, monto, descripcion, anonima=anonima)
        return resultado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al registrar ofrenda")


@router.get("/api/projection/ofrendas/total")
def get_ofrendas_total():
    """Obtiene el total de ofrendas."""
    return obtener_total_ofrendas()