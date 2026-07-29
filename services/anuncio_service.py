"""Servicios para gestión de anuncios litúrgicos."""
from datetime import datetime
from database.connection import SessionLocal
from database.models import Anuncio


def obtener_anuncios_activos():
    """Obtiene todos los anuncios activos."""
    try:
        with SessionLocal() as db:
            anuncios = db.query(Anuncio).filter(Anuncio.activo == True).all()
            return [
                {
                    "id": a.id,
                    "titulo": a.titulo,
                    "contenido": a.contenido,
                    "activo": a.activo
                }
                for a in anuncios
            ]
    except Exception as e:
        print(f"Error al obtener anuncios: {e}")
        return []


def obtener_todos_anuncios():
    """Obtiene todos los anuncios (activos e inactivos)."""
    try:
        with SessionLocal() as db:
            anuncios = db.query(Anuncio).order_by(Anuncio.id.desc()).all()
            return [
                {
                    "id": a.id,
                    "titulo": a.titulo,
                    "contenido": a.contenido,
                    "activo": a.activo
                }
                for a in anuncios
            ]
    except Exception as e:
        print(f"Error al obtener todos los anuncios: {e}")
        return []


def crear_anuncio(titulo: str, contenido: str, activo: bool = True):
    """Crea un nuevo anuncio con validación."""
    try:
        with SessionLocal() as db:
            if not titulo or not titulo.strip():
                raise ValueError("El título no puede estar vacío")
            if not contenido or not contenido.strip():
                raise ValueError("El contenido no puede estar vacío")
            
            nuevo = Anuncio(titulo=titulo.strip(), contenido=contenido.strip(), activo=activo)
            db.add(nuevo)
            db.commit()
            db.refresh(nuevo)
            return {
                "id": nuevo.id,
                "titulo": nuevo.titulo,
                "contenido": nuevo.contenido,
                "activo": nuevo.activo
            }
    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        print(f"Error al crear anuncio: {e}")
        raise


def actualizar_anuncio(id: int, titulo: str = None, contenido: str = None, activo: bool = None):
    """Actualiza un anuncio existente."""
    try:
        with SessionLocal() as db:
            anuncio = db.query(Anuncio).filter(Anuncio.id == id).first()
            if not anuncio:
                return None
            
            if titulo is not None:
                if not titulo.strip():
                    raise ValueError("El título no puede estar vacío")
                anuncio.titulo = titulo.strip()
            
            if contenido is not None:
                if not contenido.strip():
                    raise ValueError("El contenido no puede estar vacío")
                anuncio.contenido = contenido.strip()
            
            if activo is not None:
                anuncio.activo = activo
            
            db.commit()
            db.refresh(anuncio)
            return {
                "id": anuncio.id,
                "titulo": anuncio.titulo,
                "contenido": anuncio.contenido,
                "activo": anuncio.activo
            }
    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        print(f"Error al actualizar anuncio: {e}")
        raise


def eliminar_anuncio(id: int):
    """Elimina un anuncio por ID."""
    try:
        with SessionLocal() as db:
            anuncio = db.query(Anuncio).filter(Anuncio.id == id).first()
            if anuncio:
                db.delete(anuncio)
                db.commit()
                return True
            return False
    except Exception as e:
        print(f"Error al eliminar anuncio: {e}")
        return False
