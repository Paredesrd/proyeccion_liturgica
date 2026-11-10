from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from core.logger import log
from schemas.admin_schemas import OfrendaCreate
from services import birthday_service, anuncio_service, ofrenda_service

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.live_projectors: list[WebSocket] = []
        self.preview_monitors: list[WebSocket] = []
        self.control_clients: list[WebSocket] = []
        self.stage_clients: list[WebSocket] = []

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

    async def connect_stage(self, websocket: WebSocket):
        await websocket.accept()
        self.stage_clients.append(websocket)
        log.info(f"Monitor de ESCENARIO conectado. Total activos: {len(self.stage_clients)}")

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
        elif client_type == "stage" and websocket in self.stage_clients:
            self.stage_clients.remove(websocket)
            log.info(f"Monitor de ESCENARIO desconectado. Restantes: {len(self.stage_clients)}")

    async def send_to_live(self, message: dict):
        for client in self.live_projectors[:]:
            try: await client.send_json(message)
            except Exception: self.disconnect(client, "live")

    async def send_to_preview(self, message: dict):
        for client in self.preview_monitors[:]:
            try: await client.send_json(message)
            except Exception: self.disconnect(client, "preview")

    async def send_to_stage(self, message: dict):
        for client in self.stage_clients[:]:
            try: await client.send_json(message)
            except Exception: self.disconnect(client, "stage")

manager = ConnectionManager()

current_scene_state = {
    "background": {"type": "color", "color": "#000000"},
    "audio": None,
    "text": {"title": "", "text": "", "variant": "clear"},
    "blackout": False
}

@router.websocket("/ws/{client_type}")
async def websocket_endpoint(websocket: WebSocket, client_type: str):
    if client_type == "live":
        await manager.connect_live(websocket)
        try:
            await websocket.send_json({"action": "sync_scene", "state": current_scene_state})
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(websocket, "live")
        except Exception as e:
            log.error(f"Excepción en WS LIVE: {str(e)}")
            manager.disconnect(websocket, "live")

    elif client_type == "preview":
        await manager.connect_preview(websocket)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(websocket, "preview")
        except Exception as e:
            log.error(f"Excepción en WS PREVIEW: {str(e)}")
            manager.disconnect(websocket, "preview")

    elif client_type == "stage":
        await manager.connect_stage(websocket)
        try:
            await websocket.send_json({"action": "sync_stage", "state": current_scene_state})
            while True:
                data = await websocket.receive_json()
                action = data.get("action")

                # --- RUTA 1: PRÉDICA (Desde la Tablet) ---
                if action == "set_text":
                    current_scene_state["text"] = {
                        "title": data.get("title", ""),
                        "text": data.get("text", ""),
                        "variant": data.get("variant", "predica"),
                        "next_title": data.get("next_title", ""),
                        "next_text": data.get("next_text", ""),
                        "id": data.get("id")
                    }
                    await manager.send_to_live(data)
                    await manager.send_to_preview(data)
                    await manager.send_to_stage({"action": "update_stage", "current_title": data.get("title", ""), "current_text": data.get("text", ""), "next_title": data.get("next_title", ""), "next_text": data.get("next_text", ""), "id": data.get("id")})
                
                # --- RUTA 2: BIBLIA (Desde la Tablet) ---
                elif action == "bible_sync":
                    payload_live = {
                        "action": "show_bible_verse",
                        "target": "all",
                        "reference": data.get("reference"),
                        "text": data.get("text"),
                        "version": data.get("version")
                    }
                    current_scene_state["text"] = {
                        "title": data.get("reference"), 
                        "text": data.get("text"), 
                        "variant": "biblia",
                        "version": data.get("version"),
                        "libro_db": data.get("libro_db"),
                        "capitulo": data.get("capitulo"),
                        "versiculo": data.get("versiculo")
                    }
                    await manager.send_to_live(payload_live)
                    await manager.send_to_preview(payload_live)

        except WebSocketDisconnect:
            manager.disconnect(websocket, "stage")
        except Exception as e:
            log.error(f"Excepción en WS STAGE: {str(e)}")
            manager.disconnect(websocket, "stage")

    elif client_type == "control":
        await manager.connect_control(websocket)
        try:
            while True:
                data = await websocket.receive_json()
                target = data.get("target", "all")

                if target in ["live", "all"]:
                    if data["action"] == "set_background":
                        current_scene_state["background"] = data
                    elif data["action"] in ["play_media", "stop_media"]:
                        current_scene_state["audio"] = data
                    elif data["action"] == "set_text":
                        current_scene_state["text"] = {
                            "title": data.get("title", ""),
                            "text": data.get("text", ""),
                            "variant": data.get("variant", "clear"),
                            "next_title": data.get("next_title", ""),
                            "next_text": data.get("next_text", ""),
                            "id": data.get("id")
                        }
                        await manager.send_to_stage({
                            "action": "update_stage", 
                            "current_title": data.get("title", ""), 
                            "current_text": data.get("text", ""), 
                            "next_title": data.get("next_title", ""), 
                            "next_text": data.get("next_text", ""), 
                            "id": data.get("id")
                        })
                    elif data["action"] == "blackout":
                        current_scene_state["blackout"] = True
                    elif data["action"] == "clear":
                        current_scene_state["blackout"] = False
                        current_scene_state["text"] = {"title": "", "text": "", "variant": "clear"}
                        current_scene_state["audio"] = {"action": "stop_media"}
                    elif data["action"] == "show_bible_verse":
                        # Guardar estado global y enviar a la tablet con todos los datos
                        current_scene_state["text"] = {
                            "title": data.get("reference", ""),
                            "text": data.get("text", ""),
                            "variant": "biblia",
                            "version": data.get("version", "RVR1960"),
                            "libro_db": data.get("libro_db"),
                            "capitulo": data.get("capitulo"),
                            "versiculo": data.get("versiculo")
                        }
                        await manager.send_to_stage({
                            "action": "show_bible_verse",
                            "reference": data.get("reference", ""),
                            "text": data.get("text", ""),
                            "version": data.get("version", "RVR1960"),
                            "libro_db": data.get("libro_db"),
                            "capitulo": data.get("capitulo"),
                            "versiculo": data.get("versiculo")
                        })

                if target == "live":
                    await manager.send_to_live(data)
                elif target == "preview":
                    await manager.send_to_preview(data)
                else:
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
