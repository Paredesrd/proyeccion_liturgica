"""Servicios para gestión de ofrendas litúrgicas."""
from datetime import datetime, date
from database.connection import SessionLocal
from database.models import Ofrenda


def obtener_todas_ofrendas():
    """Obtiene todas las ofrendas registradas."""
    try:
        with SessionLocal() as db:
            ofrendas = db.query(Ofrenda).order_by(Ofrenda.fecha.desc()).all()
            return [
                {
                    "id": o.id,
                    "concepto": o.concepto,
                    "monto": float(o.monto),
                    "fecha": o.fecha.strftime("%Y-%m-%d")
                }
                for o in ofrendas
            ]
    except Exception as e:
        print(f"Error al obtener ofrendas: {e}")
        return []


def crear_ofrenda(concepto: str, monto: float, fecha: str):
    """Crea un nuevo registro de ofrenda."""
    try:
        with SessionLocal() as db:
            if not concepto or not concepto.strip():
                raise ValueError("El concepto no puede estar vacío")
            
            if monto <= 0:
                raise ValueError("El monto debe ser mayor a cero")
            
            fecha_obj = datetime.strptime(fecha, "%Y-%m-%d").date()
            
            nueva = Ofrenda(
                concepto=concepto.strip(),
                monto=int(monto * 100),  # Guardar en centavos
                fecha=fecha_obj
            )
            db.add(nueva)
            db.commit()
            db.refresh(nueva)
            return {
                "id": nueva.id,
                "concepto": nueva.concepto,
                "monto": float(nueva.monto / 100),
                "fecha": nueva.fecha.strftime("%Y-%m-%d")
            }
    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        print(f"Error al crear ofrenda: {e}")
        raise


def eliminar_ofrenda(id: int):
    """Elimina una ofrenda por ID."""
    try:
        with SessionLocal() as db:
            ofrenda = db.query(Ofrenda).filter(Ofrenda.id == id).first()
            if ofrenda:
                db.delete(ofrenda)
                db.commit()
                return True
            return False
    except Exception as e:
        print(f"Error al eliminar ofrenda: {e}")
        return False

