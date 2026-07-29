"""Servicios para gestión de ofrendas litúrgicas."""
from datetime import datetime, date
from database.connection import SessionLocal
from database.models import Ofrenda


def obtener_ofrendas_por_fecha(fecha_inicio: date = None, fecha_fin: date = None):
    """Obtiene ofrendas en un rango de fechas."""
    try:
        with SessionLocal() as db:
            query = db.query(Ofrenda)
            
            if fecha_inicio:
                query = query.filter(Ofrenda.fecha >= fecha_inicio)
            if fecha_fin:
                query = query.filter(Ofrenda.fecha <= fecha_fin)
            
            ofrendas = query.order_by(Ofrenda.fecha.desc()).all()
            return [
                {
                    "id": o.id,
                    "tipo": o.tipo,
                    "monto": o.monto,
                    "descripcion": o.descripcion,
                    "fecha": o.fecha.strftime("%Y-%m-%d"),
                    "anonima": o.anonima
                }
                for o in ofrendas
            ]
    except Exception as e:
        print(f"Error al obtener ofrendas: {e}")
        return []


def obtener_total_ofrendas(fecha_inicio: date = None, fecha_fin: date = None):
    """Obtiene el total monetario de ofrendas en un rango de fechas."""
    try:
        with SessionLocal() as db:
            query = db.query(Ofrenda).filter(Ofrenda.monto != None)
            
            if fecha_inicio:
                query = query.filter(Ofrenda.fecha >= fecha_inicio)
            if fecha_fin:
                query = query.filter(Ofrenda.fecha <= fecha_fin)
            
            total = sum(o.monto for o in query.all() if o.monto)
            return {"total": total, "moneda": "USD"}
    except Exception as e:
        print(f"Error al calcular total de ofrendas: {e}")
        return {"total": 0, "moneda": "USD"}


def crear_ofrenda(tipo: str, monto: int = None, descripcion: str = None, 
                  fecha: str = None, anonima: bool = False):
    """Crea un nuevo registro de ofrenda."""
    try:
        with SessionLocal() as db:
            if not tipo or not tipo.strip():
                raise ValueError("El tipo de ofrenda no puede estar vacío")
            
            # Validar monto si es ofrenda monetaria
            if monto is not None and monto < 0:
                raise ValueError("El monto no puede ser negativo")
            
            fecha_obj = None
            if fecha:
                fecha_obj = datetime.strptime(fecha, "%Y-%m-%d").date()
            else:
                fecha_obj = date.today()
            
            nueva = Ofrenda(
                tipo=tipo.strip(),
                monto=monto,
                descripcion=descripcion.strip() if descripcion else None,
                fecha=fecha_obj,
                anonima=anonima
            )
            db.add(nueva)
            db.commit()
            db.refresh(nueva)
            return {
                "id": nueva.id,
                "tipo": nueva.tipo,
                "monto": nueva.monto,
                "descripcion": nueva.descripcion,
                "fecha": nueva.fecha.strftime("%Y-%m-%d"),
                "anonima": nueva.anonima
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
