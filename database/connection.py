from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import settings
from core.logger import log

# Motor 1: Datos transaccionales de la aplicación
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Motor 2: Datos de solo lectura (Biblias)
bible_engine = create_engine(
    settings.BIBLE_DB_URL,
    connect_args={"check_same_thread": False}
)
BibleSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=bible_engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_bible_db():
    db = BibleSessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Inicializa el esquema de la base de datos principal."""
    log.info("Verificando integridad del esquema de base de datos...")
    from database.models import Cumpleanos, Anuncio, TextoBiblico, Ofrenda, Cancion

    try:
        Base.metadata.create_all(bind=engine)
        log.info("Esquema de base de datos verificado y activo.")
    except Exception as e:
        log.critical(f"Fallo crítico al inicializar la base de datos: {str(e)}")
        raise e