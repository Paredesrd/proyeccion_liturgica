from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import JSONResponse

from services.bible_service import buscar_versiculo

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.projector_ws: WebSocket | None = None

    async def connect(self, websocket: WebSocket, client_type: str):
        await websocket.accept()
        if client_type == "projector":
            self.projector_ws = websocket

    def disconnect(self, client_type: str):
        if client_type == "projector":
            self.projector_ws = None

    async def send_to_projector(self, message: dict):
        if self.projector_ws:
            await self.projector_ws.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/{client_type}")
async def websocket_endpoint(websocket: WebSocket, client_type: str):
    await manager.connect(websocket, client_type)
    try:
        while True:
            data = await websocket.receive_json()
            if client_type == "control":
                await manager.send_to_projector(data)
    except WebSocketDisconnect:
        manager.disconnect(client_type)

@router.get("/api/bible/search")
async def search_bible(libro: str = Query(...), capitulo: str = Query(...), version: str = Query("RVR1960")):
    resultado = buscar_versiculo(libro, capitulo, version)
    if not resultado:
        return JSONResponse(status_code=404, content={"error": "Referencia no encontrada"})
    return resultado