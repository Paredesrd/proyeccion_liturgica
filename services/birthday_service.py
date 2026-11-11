from sqlalchemy import extract
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database.models import Cumpleanos
from core.logger import log
from schemas.admin_schemas import CumpleanosCreate


def obtener_cumpleanos_rango(db: Session):
    """
    Obtiene los cumpleaños en una ventana estricta de 7 días:
    Desde el miércoles pasado hasta el martes siguiente.
    """
    try:
        hoy = datetime.now()
        # En Python: Lunes=0, Martes=1, Miércoles=2, Jueves=3, Viernes=4, Sábado=5, Domingo=6
        # Fórmula para hallar cuántos días restar para llegar al miércoles más cercano hacia atrás
        dias_desde_miercoles = (hoy.weekday() - 2) % 7
        fecha_inicio = hoy - timedelta(days=dias_desde_miercoles)

        resultados = []

        # Iterar exactamente los 7 días (Miércoles [0] a Martes [6])
        for i in range(7):
            fecha_objetivo = fecha_inicio + timedelta(days=i)
            mes = fecha_objetivo.month
            dia = fecha_objetivo.day

            cumpleaneros = db.query(Cumpleanos).filter(
                extract('month', Cumpleanos.fecha_nacimiento) == mes,
                extract('day', Cumpleanos.fecha_nacimiento) == dia
            ).all()

            for c in cumpleaneros:
                # Calcula si es exactamente hoy o mañana para las etiquetas visuales
                diff_dias = (fecha_objetivo.date() - hoy.date()).days

                resultados.append({
                    "id": c.id,
                    "nombre": c.nombre,
                    "fecha": fecha_objetivo.strftime("%d/%m"),
                    "dias_diff": diff_dias,
                    "es_hoy": diff_dias == 0,
                    "es_manana": diff_dias == 1
                })

        # Retorna la lista en el orden natural cronológico (Miércoles a Martes)
        return resultados
    except Exception as e:
        log.error(f"Error al obtener cumpleaños en la ventana semanal: {str(e)}")
        return []


def crear_cumpleanos(db: Session, data: CumpleanosCreate):
    """Crea un nuevo registro de cumpleaños."""
    try:
        fecha = datetime.strptime(data.fecha, "%Y-%m-%d").date()
        nuevo = Cumpleanos(nombre=data.nombre.strip(), fecha_nacimiento=fecha)
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return {"id": nuevo.id, "nombre": nuevo.nombre, "fecha": data.fecha}
    except Exception as e:
        db.rollback()
        log.error(f"Error al crear cumpleaños: {str(e)}")
        raise


def eliminar_cumpleanos(db: Session, id: int):
    """Elimina un registro de cumpleaños por ID."""
    try:
        c = db.query(Cumpleanos).filter(Cumpleanos.id == id).first()
        if c:
            db.delete(c)
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        log.error(f"Error al eliminar cumpleaños ID {id}: {str(e)}")
        return False


def obtener_todos_cumpleanos(db: Session):
    """Obtiene todos los cumpleaños ordenados por fecha."""
    try:
        todos = db.query(Cumpleanos).order_by(
            extract('month', Cumpleanos.fecha_nacimiento),
            extract('day', Cumpleanos.fecha_nacimiento)
        ).all()
        return [
            {
                "id": c.id,
                "nombre": c.nombre,
                "fecha": c.fecha_nacimiento.strftime("%d/%m"),
                "fecha_completa": c.fecha_nacimiento.strftime("%Y-%m-%d")
            }
            for c in todos
        ]
    except Exception as e:
        log.error(f"Error al obtener todos los cumpleaños: {str(e)}")
        return []


def actualizar_cumpleanos(db: Session, id: int, data: CumpleanosCreate):
    """Actualiza nombre y fecha de un registro de cumpleanos."""
    try:
        c = db.query(Cumpleanos).filter(Cumpleanos.id == id).first()
        if not c:
            return None
        c.nombre = data.nombre.strip()
        c.fecha_nacimiento = datetime.strptime(data.fecha, "%Y-%m-%d").date()
        db.commit()
        db.refresh(c)
        return {"id": c.id, "nombre": c.nombre, "fecha": data.fecha}
    except Exception as e:
        db.rollback()
        log.error(f"Error al actualizar cumpleanos ID {id}: {str(e)}")
        raise
