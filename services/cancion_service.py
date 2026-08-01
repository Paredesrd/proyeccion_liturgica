"""Servicios para gestión del cancionero litúrgico."""
from sqlalchemy.orm import Session
from database.models import Cancion
from core.logger import log
from schemas.admin_schemas import CancionCreate, CancionUpdate

def obtener_todas_canciones(db: Session):
    """Obtiene el catálogo completo de canciones en orden alfabético."""
    try:
        canciones = db.query(Cancion).order_by(Cancion.titulo.asc()).all()
        return [{"id": c.id, "titulo": c.titulo, "autor": c.autor, "letra": c.letra} for c in canciones]
    except Exception as e:
        log.error(f"Error al obtener canciones: {str(e)}")
        return []

def crear_cancion(db: Session, data: CancionCreate):
    """Registra una nueva canción en la base de datos."""
    try:
        nueva = Cancion(
            titulo=data.titulo.strip(),
            autor=data.autor.strip() if data.autor else "Desconocido",
            letra=data.letra.strip()
        )
        db.add(nueva)
        db.commit()
        db.refresh(nueva)
        return {"id": nueva.id, "titulo": nueva.titulo, "autor": nueva.autor, "letra": nueva.letra}
    except Exception as e:
        db.rollback()
        log.error(f"Error al crear canción: {str(e)}")
        raise

def actualizar_cancion(db: Session, id: int, data: CancionUpdate):
    """Actualiza los metadatos o la letra de una canción existente."""
    try:
        cancion = db.query(Cancion).filter(Cancion.id == id).first()
        if not cancion:
            return None

        if data.titulo is not None:
            cancion.titulo = data.titulo.strip()
        if data.autor is not None:
            cancion.autor = data.autor.strip()
        if data.letra is not None:
            cancion.letra = data.letra.strip()

        db.commit()
        db.refresh(cancion)
        return {"id": cancion.id, "titulo": cancion.titulo, "autor": cancion.autor, "letra": cancion.letra}
    except Exception as e:
        db.rollback()
        log.error(f"Error al actualizar canción ID {id}: {str(e)}")
        raise

def eliminar_cancion(db: Session, id: int):
    """Borra una canción del catálogo permanentemente."""
    try:
        cancion = db.query(Cancion).filter(Cancion.id == id).first()
        if cancion:
            db.delete(cancion)
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        log.error(f"Error al eliminar canción ID {id}: {str(e)}")
        return False