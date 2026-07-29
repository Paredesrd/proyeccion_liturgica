from sqlalchemy import extract
from datetime import datetime, timedelta
from database.connection import SessionLocal
from database.models import Cumpleanos


def obtener_cumpleanos_rango(dias_pasados=7, dias_futuros=2):
    """Obtiene los cumpleaños en un rango de fechas alrededor de hoy."""
    try:
        with SessionLocal() as db:
            hoy = datetime.now()
            resultados = []
            for i in range(-dias_pasados, dias_futuros + 1):
                fecha_objetivo = hoy + timedelta(days=i)
                mes = fecha_objetivo.month
                dia = fecha_objetivo.day

                cumpleaneros = db.query(Cumpleanos).filter(
                    extract('month', Cumpleanos.fecha_nacimiento) == mes,
                    extract('day', Cumpleanos.fecha_nacimiento) == dia
                ).all()

                for c in cumpleaneros:
                    resultados.append({
                        "id": c.id,
                        "nombre": c.nombre,
                        "fecha": fecha_objetivo.strftime("%d/%m"),
                        "dias_diff": i,
                        "es_hoy": i == 0,
                        "es_manana": i == 1
                    })
            return sorted(resultados, key=lambda x: x['dias_diff'])
    except Exception as e:
        print(f"Error al obtener cumpleaños: {e}")
        return []


def crear_cumpleanos(nombre: str, fecha_str: str):
    """Crea un nuevo registro de cumpleaños con validación."""
    try:
        with SessionLocal() as db:
            # Validar formato de fecha
            fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
            
            # Validar que el nombre no esté vacío
            if not nombre or not nombre.strip():
                raise ValueError("El nombre no puede estar vacío")
            
            nuevo = Cumpleanos(nombre=nombre.strip(), fecha_nacimiento=fecha)
            db.add(nuevo)
            db.commit()
            db.refresh(nuevo)
            return {"id": nuevo.id, "nombre": nuevo.nombre, "fecha": fecha_str}
    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        print(f"Error al crear cumpleaños: {e}")
        raise


def eliminar_cumpleanos(id: int):
    """Elimina un registro de cumpleaños por ID."""
    try:
        with SessionLocal() as db:
            c = db.query(Cumpleanos).filter(Cumpleanos.id == id).first()
            if c:
                db.delete(c)
                db.commit()
                return True
            return False
    except Exception as e:
        print(f"Error al eliminar cumpleaños: {e}")
        return False


def obtener_todos_cumpleanos():
    """Obtiene todos los cumpleaños ordenados por fecha."""
    try:
        with SessionLocal() as db:
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
        print(f"Error al obtener todos los cumpleaños: {e}")
        return []