from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.responses import JSONResponse
import logging

from services.bible_service import buscar_versiculo, obtener_todos_los_libros, obtener_capitulos
from services.birthday_service import obtener_cumpleanos_rango
from services.anuncio_service import obtener_anuncios_activos
from services.ofrenda_service import crear_ofrenda

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class ConnectionManager:
    """Gestiona las conexiones WebSocket para sincronización en tiempo real."""
    def __init__(self):
        self.projector_ws: WebSocket | None = None
        self.control_clients: list[WebSocket] = []

    async def connect_projector(self, websocket: WebSocket):
        await websocket.accept()
        self.projector_ws = websocket
        logger.info("Proyector conectado")

    async def connect_control(self, websocket: WebSocket):
        await websocket.accept()
        self.control_clients.append(websocket)
        logger.info(f"Cliente de control conectado. Total: {len(self.control_clients)}")

    def disconnect_projector(self):
        self.projector_ws = None
        logger.info("Proyector desconectado")

    def disconnect_control(self, websocket: WebSocket):
        if websocket in self.control_clients:
            self.control_clients.remove(websocket)
        logger.info(f"Cliente de control desconectado. Total: {len(self.control_clients)}")

    async def send_to_projector(self, message: dict):
        """Envía un mensaje al proyector."""
        if self.projector_ws:
            try:
                await self.projector_ws.send_json(message)
            except Exception as e:
                logger.error(f"Error al enviar al proyector: {e}")
                self.disconnect_projector()

    async def broadcast_to_controls(self, message: dict):
        """Difunde un mensaje a todos los clientes de control."""
        for client in self.control_clients[:]:  # Copia para evitar problemas si se desconectan
            try:
                await client.send_json(message)
            except Exception:
                self.control_clients.remove(client)

manager = ConnectionManager()

@router.websocket("/ws/{client_type}")
async def websocket_endpoint(websocket: WebSocket, client_type: str):
    """Endpoint WebSocket para comunicación en tiempo real."""
    if client_type == "projector":
        await manager.connect_projector(websocket)
        try:
            while True:
                data = await websocket.receive_json()
                # El proyector puede enviar confirmaciones o estados
                logger.info(f"Mensaje del proyector: {data}")
        except WebSocketDisconnect:
            manager.disconnect_projector()
        except Exception as e:
            logger.error(f"Error en WebSocket del proyector: {e}")
            manager.disconnect_projector()
    
    elif client_type == "control":
        await manager.connect_control(websocket)
        try:
            while True:
                data = await websocket.receive_json()
                # Reenviar comandos del control al proyector
                await manager.send_to_projector(data)
        except WebSocketDisconnect:
            manager.disconnect_control(websocket)
        except Exception as e:
            logger.error(f"Error en WebSocket de control: {e}")
            manager.disconnect_control(websocket)

@router.get("/api/bible/search")
async def search_bible(libro: str = Query(...), capitulo: str = Query(...), version: str = Query("RVR1960")):
    """Busca un versículo bíblico por libro y capítulo."""
    resultado = buscar_versiculo(libro, capitulo, version)
    if not resultado:
        return JSONResponse(
            status_code=404, 
            content={"error": "Referencia no encontrada", "disponibles": obtener_todos_los_libros()}
        )
    return resultado

@router.get("/api/bible/books")
async def get_bible_books():
    """Obtiene la lista de libros bíblicos disponibles."""
    return {"libros": obtener_todos_los_libros()}

@router.get("/api/bible/chapters/{libro}")
async def get_bible_chapters(libro: str):
    """Obtiene los capítulos disponibles para un libro."""
    capitulos = obtener_capitulos(libro)
    if not capitulos:
        return JSONResponse(status_code=404, content={"error": "Libro no encontrado"})
    return {"capitulos": capitulos}

# ==================== RUTAS DE PROYECCIÓN ====================

@router.get("/api/projection/birthdays")
async def get_projection_birthdays():
    """Obtiene cumpleaños de la semana para proyección."""
    return {"cumpleanos": obtener_cumpleanos_rango()}

@router.get("/api/projection/anuncios")
async def get_projection_anuncios():
    """Obtiene anuncios activos para proyección."""
    return {"anuncios": obtener_anuncios_activos()}

@router.post("/api/projection/ofrenda")
async def register_ofrenda(concepto: str, monto: float = None, fecha: str = None):
    """Registra una ofrenda y opcionalmente la proyecta."""
    from datetime import date
    if not fecha:
        fecha = date.today().strftime("%Y-%m-%d")
    try:
        resultado = crear_ofrenda(concepto, monto, fecha)
        return resultado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al registrar ofrenda")