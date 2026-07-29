from sqlalchemy import extract
from datetime import datetime, timedelta
from database.connection import SessionLocal
from database.models import Cumpleanos


def obtener_cumpleanos_rango(dias_pasados=7, dias_futuros=2):
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
                    "dias_diff": i
                })
        return sorted(resultados, key=lambda x: x['dias_diff'])


def crear_cumpleanos(nombre: str, fecha_str: str):
    with SessionLocal() as db:
        fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
        nuevo = Cumpleanos(nombre=nombre, fecha_nacimiento=fecha)
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return {"id": nuevo.id, "nombre": nuevo.nombre, "fecha": fecha_str}


def eliminar_cumpleanos(id: int):
    with SessionLocal() as db:
        c = db.query(Cumpleanos).filter(Cumpleanos.id == id).first()
        if c:
            db.delete(c)
            db.commit()
            return True
        return False