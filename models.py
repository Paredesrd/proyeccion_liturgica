from sqlalchemy import create_engine, Column, Integer, String, Date, Text
from sqlalchemy.orm import declarative_base, sessionmaker
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "liturgia.db")

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Cumpleanos(Base):
    __tablename__ = "cumpleanos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)


class TextoBiblico(Base):
    __tablename__ = "textos_biblicos"
    id = Column(Integer, primary_key=True, index=True)
    referencia = Column(String, index=True, nullable=False)  # Ej: "Juan 3:16"
    texto = Column(Text, nullable=False)
    version = Column(String, default="RVR1960")


def init_db():
    Base.metadata.create_all(bind=engine)

    # Semilla inicial de datos si la tabla está vacía
    with SessionLocal() as session:
        if session.query(TextoBiblico).count() == 0:
            session.add_all([
                TextoBiblico(referencia="Juan 3:16",
                             texto="Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna."),
                TextoBiblico(referencia="Salmos 23:1", texto="Jehová es mi pastor; nada me faltará.")
            ])
            session.commit()