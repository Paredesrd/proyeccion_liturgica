from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "liturgia.db")

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Inicializa la base de datos creando todas las tablas y seed data."""
    # IMPORTANTE: Se añade Cancion al import para forzar su creación
    from database.models import Cumpleanos, Anuncio, TextoBiblico, Ofrenda, Cancion

    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)

    # Seed data inicial solo si las tablas están vacías
    with SessionLocal() as session:
        if session.query(TextoBiblico).count() == 0:
            import json
            bible_path = os.path.join(BASE_DIR, "static", "data", "bible.json")
            if os.path.exists(bible_path):
                with open(bible_path, 'r', encoding='utf-8') as f:
                    bible_data = json.load(f)

                # Optimización Crítica: Batch Commit para evitar colapso de RAM
                for version, libros in bible_data.items():
                    for libro, capitulos in libros.items():
                        textos_a_agregar = []
                        for capitulo, versiculos in capitulos.items():
                            texto_completo = " ".join(versiculos)
                            referencia = f"{libro} {capitulo}"
                            textos_a_agregar.append(
                                TextoBiblico(
                                    referencia=referencia,
                                    texto=texto_completo,
                                    version=version
                                )
                            )
                        # Descarga la memoria guardando en DB un libro a la vez
                        if textos_a_agregar:
                            session.add_all(textos_a_agregar)
                            session.commit()

        if session.query(Anuncio).count() == 0:
            session.add_all([
                Anuncio(titulo="Reunión de Jóvenes", contenido="Viernes 7:00 PM - Salón principal", activo=True),
                Anuncio(titulo="Estudio Bíblico", contenido="Miércoles 6:30 PM - Sala 2", activo=True)
            ])
            session.commit()