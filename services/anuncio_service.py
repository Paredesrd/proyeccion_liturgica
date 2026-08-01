"""Servicios para gestión de anuncios litúrgicos."""
from sqlalchemy.orm import Session
from database.models import Anuncio
from core.logger import log
from schemas.admin_schemas import AnuncioCreate, AnuncioUpdate


def obtener_anuncios_activos(db: Session):
    """Obtiene todos los anuncios activos."""
    try:
        anuncios = db.query(Anuncio).filter(Anuncio.activo == True).all()
        return [{"id": a.id, "titulo": a.titulo, "contenido": a.contenido, "activo": a.activo} for a in anuncios]
    except Exception as e:
        log.error(f"Error al obtener anuncios activos: {str(e)}")
        return []


def obtener_todos_anuncios(db: Session):
    """Obtiene todos los anuncios (activos e inactivos)."""
    try:
        anuncios = db.query(Anuncio).order_by(Anuncio.id.desc()).all()
        return [{"id": a.id, "titulo": a.titulo, "contenido": a.contenido, "activo": a.activo} for a in anuncios]
    except Exception as e:
        log.error(f"Error al obtener todos los anuncios: {str(e)}")
        return []


def crear_anuncio(db: Session, data: AnuncioCreate):
    """Crea un nuevo anuncio."""
    try:
        nuevo = Anuncio(
            titulo=data.titulo.strip(),
            contenido=data.contenido.strip(),
            activo=data.activo
        )
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return {"id": nuevo.id, "titulo": nuevo.titulo, "contenido": nuevo.contenido, "activo": nuevo.activo}
    except Exception as e:
        db.rollback()
        log.error(f"Error al crear anuncio: {str(e)}")
        raise


def actualizar_anuncio(db: Session, id: int, data: AnuncioUpdate):
    """Actualiza un anuncio existente."""
    try:
        anuncio = db.query(Anuncio).filter(Anuncio.id == id).first()
        if not anuncio:
            return None

        if data.titulo is not None:
            anuncio.titulo = data.titulo.strip()
        if data.contenido is not None:
            anuncio.contenido = data.contenido.strip()
        if data.activo is not None:
            anuncio.activo = data.activo

        db.commit()
        db.refresh(anuncio)
        return {"id": anuncio.id, "titulo": anuncio.titulo, "contenido": anuncio.contenido, "activo": anuncio.activo}
    except Exception as e:
        db.rollback()
        log.error(f"Error al actualizar anuncio ID {id}: {str(e)}")
        raise


def eliminar_anuncio(db: Session, id: int):
    """Elimina un anuncio por ID."""
    try:
        anuncio = db.query(Anuncio).filter(Anuncio.id == id).first()
        if anuncio:
            db.delete(anuncio)
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        log.error(f"Error al eliminar anuncio ID {id}: {str(e)}")
        return False