from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from core.logger import log
from schemas.admin_schemas import OfrendaCreate
from services import birthday_service, anuncio_service, ofrenda_service

router = APIRouter()


class ConnectionManager:
    """Gestiona las conexiones WebSocket con aislamiento Preview / Program."""

    def __init__(self):
        self.live_projectors: list[WebSocket] = []
        self.preview_monitors: list[WebSocket] = []
        self.control_clients: list[WebSocket] = []

    async def connect_live(self, websocket: WebSocket):
        await websocket.accept()
        self.live_projectors.append(websocket)
        log.info(f"Proyector EN VIVO conectado. Total activos: {len(self.live_projectors)}")

    async def connect_preview(self, websocket: WebSocket):
        await websocket.accept()
        self.preview_monitors.append(websocket)
        log.info(f"Monitor PREVIEW conectado. Total activos: {len(self.preview_monitors)}")

    async def connect_control(self, websocket: WebSocket):
        await websocket.accept()
        self.control_clients.append(websocket)
        log.info(f"Cliente de control conectado. Total activos: {len(self.control_clients)}")

    def disconnect(self, websocket: WebSocket, client_type: str):
        if client_type == "live" and websocket in self.live_projectors:
            self.live_projectors.remove(websocket)
            log.info(f"Proyector EN VIVO desconectado. Restantes: {len(self.live_projectors)}")
        elif client_type == "preview" and websocket in self.preview_monitors:
            self.preview_monitors.remove(websocket)
            log.info(f"Monitor PREVIEW desconectado. Restantes: {len(self.preview_monitors)}")
        elif client_type == "control" and websocket in self.control_clients:
            self.control_clients.remove(websocket)
            log.info(f"Cliente de control desconectado. Restantes: {len(self.control_clients)}")

    async def send_to_live(self, message: dict):
        for client in self.live_projectors[:]:
            try:
                await client.send_json(message)
            except Exception as e:
                log.error(f"Fallo de transmisión a Proyector LIVE: {str(e)}")
                self.disconnect(client, "live")

    async def send_to_preview(self, message: dict):
        for client in self.preview_monitors[:]:
            try:
                await client.send_json(message)
            except Exception as e:
                log.error(f"Fallo de transmisión a Monitor PREVIEW: {str(e)}")
                self.disconnect(client, "preview")


manager = ConnectionManager()


@router.websocket("/ws/{client_type}")
async def websocket_endpoint(websocket: WebSocket, client_type: str):
    if client_type == "live":
        await manager.connect_live(websocket)
        try:
            while True:
                await websocket.receive_text()  # Keepalive
        except WebSocketDisconnect:
            manager.disconnect(websocket, "live")
        except Exception as e:
            log.error(f"Excepción en WS LIVE: {str(e)}")
            manager.disconnect(websocket, "live")

    elif client_type == "preview":
        await manager.connect_preview(websocket)
        try:
            while True:
                await websocket.receive_text()  # Keepalive
        except WebSocketDisconnect:
            manager.disconnect(websocket, "preview")
        except Exception as e:
            log.error(f"Excepción en WS PREVIEW: {str(e)}")
            manager.disconnect(websocket, "preview")

    elif client_type == "control":
        await manager.connect_control(websocket)
        try:
            while True:
                data = await websocket.receive_json()
                # El motor de enrutamiento: Decide a qué canal enviar la señal
                target = data.get("target", "all")

                if target == "live":
                    await manager.send_to_live(data)
                elif target == "preview":
                    await manager.send_to_preview(data)
                else:
                    # Comandos de emergencia o globales (clear, blackout) van a ambas pantallas
                    await manager.send_to_live(data)
                    await manager.send_to_preview(data)

        except WebSocketDisconnect:
            manager.disconnect(websocket, "control")
        except Exception as e:
            log.error(f"Excepción en WS CONTROL: {str(e)}")
            manager.disconnect(websocket, "control")


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