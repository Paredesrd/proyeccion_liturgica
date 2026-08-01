"""Servicios para gestión de ofrendas litúrgicas."""
from sqlalchemy.orm import Session
from datetime import datetime, date
from database.models import Ofrenda
from core.logger import log
from schemas.admin_schemas import OfrendaCreate


def obtener_ofrendas_por_fecha(db: Session, fecha_inicio: date = None, fecha_fin: date = None):
    """Obtiene ofrendas en un rango de fechas."""
    try:
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
        log.error(f"Error al obtener ofrendas: {str(e)}")
        return []


def obtener_total_ofrendas(db: Session, fecha_inicio: date = None, fecha_fin: date = None):
    """Obtiene el total monetario de ofrendas en un rango de fechas."""
    try:
        query = db.query(Ofrenda).filter(Ofrenda.monto != None)

        if fecha_inicio:
            query = query.filter(Ofrenda.fecha >= fecha_inicio)
        if fecha_fin:
            query = query.filter(Ofrenda.fecha <= fecha_fin)

        total = sum(o.monto for o in query.all() if o.monto)
        return {"total": total, "moneda": "USD"}
    except Exception as e:
        log.error(f"Error al calcular total de ofrendas: {str(e)}")
        return {"total": 0, "moneda": "USD"}


def crear_ofrenda(db: Session, data: OfrendaCreate):
    """Crea un nuevo registro de ofrenda."""
    try:
        fecha_obj = datetime.strptime(data.fecha, "%Y-%m-%d").date() if data.fecha else date.today()

        nueva = Ofrenda(
            tipo=data.tipo.strip(),
            monto=data.monto,
            descripcion=data.descripcion.strip() if data.descripcion else None,
            fecha=fecha_obj,
            anonima=data.anonima
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
    except Exception as e:
        db.rollback()
        log.error(f"Error al crear ofrenda: {str(e)}")
        raise


def eliminar_ofrenda(db: Session, id: int):
    """Elimina una ofrenda por ID."""
    try:
        ofrenda = db.query(Ofrenda).filter(Ofrenda.id == id).first()
        if ofrenda:
            db.delete(ofrenda)
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        log.error(f"Error al eliminar ofrenda ID {id}: {str(e)}")
        return False