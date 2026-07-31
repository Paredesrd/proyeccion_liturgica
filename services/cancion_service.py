"""Servicios para gestión del cancionero litúrgico."""
from database.connection import SessionLocal
from database.models import Cancion


def obtener_todas_canciones():
    """Obtiene el catálogo completo de canciones en orden alfabético."""
    try:
        with SessionLocal() as db:
            canciones = db.query(Cancion).order_by(Cancion.titulo.asc()).all()
            return [
                {
                    "id": c.id,
                    "titulo": c.titulo,
                    "autor": c.autor,
                    "letra": c.letra
                }
                for c in canciones
            ]
    except Exception as e:
        print(f"Error al obtener canciones: {e}")
        return []


def crear_cancion(titulo: str, autor: str, letra: str):
    """Registra una nueva canción en la base de datos."""
    try:
        with SessionLocal() as db:
            if not titulo or not titulo.strip():
                raise ValueError("El título de la canción no puede estar vacío.")
            if not letra or not letra.strip():
                raise ValueError("La letra de la canción no puede estar vacía.")

            nueva = Cancion(
                titulo=titulo.strip(),
                autor=autor.strip() if autor else "Desconocido",
                letra=letra.strip()
            )
            db.add(nueva)
            db.commit()
            db.refresh(nueva)
            return {
                "id": nueva.id,
                "titulo": nueva.titulo,
                "autor": nueva.autor,
                "letra": nueva.letra
            }
    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        print(f"Error al crear canción: {e}")
        raise


def actualizar_cancion(id: int, titulo: str = None, autor: str = None, letra: str = None):
    """Actualiza los metadatos o la letra de una canción existente."""
    try:
        with SessionLocal() as db:
            cancion = db.query(Cancion).filter(Cancion.id == id).first()
            if not cancion:
                return None

            if titulo is not None:
                if not titulo.strip():
                    raise ValueError("El título no puede estar vacío.")
                cancion.titulo = titulo.strip()

            if autor is not None:
                cancion.autor = autor.strip()

            if letra is not None:
                if not letra.strip():
                    raise ValueError("La letra no puede estar vacía.")
                cancion.letra = letra.strip()

            db.commit()
            db.refresh(cancion)
            return {
                "id": cancion.id,
                "titulo": cancion.titulo,
                "autor": cancion.autor,
                "letra": cancion.letra
            }
    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        print(f"Error al actualizar canción: {e}")
        raise


def eliminar_cancion(id: int):
    """Borra una canción del catálogo permanentemente."""
    try:
        with SessionLocal() as db:
            cancion = db.query(Cancion).filter(Cancion.id == id).first()
            if cancion:
                db.delete(cancion)
                db.commit()
                return True
            return False
    except Exception as e:
        print(f"Error al eliminar canción: {e}")
        return False