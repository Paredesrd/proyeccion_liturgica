from models import SessionLocal, Cumpleanos, TextoBiblico
from datetime import datetime, timedelta
from sqlalchemy import extract


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def buscar_texto_biblico(referencia: str):
    with SessionLocal() as db:
        # Búsqueda insensible a mayúsculas y parcial
        return db.query(TextoBiblico).filter(TextoBiblico.referencia.ilike(f"%{referencia}%")).first()


def obtener_cumpleanos_semana():
    with SessionLocal() as db:
        hoy = datetime.now()
        # Lógica simplificada para obtener cumpleaños en un rango de +/- 7 días
        # Nota: En SQLite, el manejo de fechas requiere extracción de mes y día.
        # Esta es una implementación robusta para el rango solicitado.
        resultados = []
        for i in range(-7, 8):  # Semana pasada a próximos 7 días
            fecha_objetivo = hoy + timedelta(days=i)
            mes = fecha_objetivo.month
            dia = fecha_objetivo.day

            cumpleaneros = db.query(Cumpleanos).filter(
                extract('month', Cumpleanos.fecha_nacimiento) == mes,
                extract('day', Cumpleanos.fecha_nacimiento) == dia
            ).all()

            for c in cumpleaneros:
                resultados.append({
                    "nombre": c.nombre,
                    "fecha": fecha_objetivo.strftime("%d/%m"),
                    "dias_diff": i
                })

        # Ordenar por proximidad (días diff ascendente)
        return sorted(resultados, key=lambda x: x['dias_diff'])