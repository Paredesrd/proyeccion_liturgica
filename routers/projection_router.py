from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from core.logger import log
from schemas.admin_schemas import OfrendaCreate
from services import birthday_service, anuncio_service, ofrenda_service

router = APIRouter()

class ConnectionManager:
    """Gestiona las conexiones WebSocket para sincronización en tiempo real."""

    def __init__(self):
        self.projector_clients: list[WebSocket] = []
        self.control_clients: list[WebSocket] = []

    async def connect_projector(self, websocket: WebSocket):
        await websocket.accept()
        self.projector_clients.append(websocket)
        log.info(f"Proyector/Monitor conectado. Total activos: {len(self.projector_clients)}")

    async def connect_control(self, websocket: WebSocket):
        await websocket.accept()
        self.control_clients.append(websocket)
        log.info(f"Cliente de control conectado. Total activos: {len(self.control_clients)}")

    def disconnect_projector(self, websocket: WebSocket):
        if websocket in self.projector_clients:
            self.projector_clients.remove(websocket)
        log.info(f"Proyector/Monitor desconectado. Total activos: {len(self.projector_clients)}")

    def disconnect_control(self, websocket: WebSocket):
        if websocket in self.control_clients:
            self.control_clients.remove(websocket)
        log.info(f"Cliente de control desconectado. Total activos: {len(self.control_clients)}")

    async def send_to_projector(self, message: dict):
        for client in self.projector_clients[:]:
            try:
                await client.send_json(message)
            except Exception as e:
                log.error(f"Error al enviar mensaje al proyector: {str(e)}")
                self.disconnect_projector(client)

    async def broadcast_to_controls(self, message: dict):
        for client in self.control_clients[:]:
            try:
                await client.send_json(message)
            except Exception as e:
                log.error(f"Error al difundir a controles: {str(e)}")
                self.disconnect_control(client)

manager = ConnectionManager()

@router.websocket("/ws/{client_type}")
async def websocket_endpoint(websocket: WebSocket, client_type: str):
    if client_type == "projector":
        await manager.connect_projector(websocket)
        try:
            while True:
                data = await websocket.receive_json()
                log.info(f"Mensaje recibido del proyector: {data}")
        except WebSocketDisconnect:
            manager.disconnect_projector(websocket)
        except Exception as e:
            log.error(f"Excepción en WS proyector: {str(e)}")
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
            log.error(f"Excepción en WS control: {str(e)}")
            manager.disconnect_control(websocket)

# ==================== RUTAS DE PROYECCIÓN (SÍNCRONAS) ====================

@router.get("/api/projection/birthdays")
def get_projection_birthdays(db: Session = Depends(get_db)):
    return {"cumpleanos": birthday_service.obtener_cumpleanos_rango(db)}

@router.get("/api/projection/anuncios")
def get_projection_anuncios(db: Session = Depends(get_db)):
    return {"anuncios": anuncio_service.obtener_anuncios_activos(db)}

@router.post("/api/projection/ofrenda")
def register_ofrenda(data: OfrendaCreate, db: Session = Depends(get_db)):
    try:
        return ofrenda_service.crear_ofrenda(db, data)
    except Exception as e:
        log.error(f"Error al registrar ofrenda desde proyección: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al registrar ofrenda")

@router.get("/api/projection/ofrendas/total")
def get_ofrendas_total(db: Session = Depends(get_db)):
    return ofrenda_service.obtener_total_ofrendas(db)