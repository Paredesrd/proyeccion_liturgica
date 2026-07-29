from sqlalchemy import Column, Integer, String, Date, Text, Boolean
from database.connection import Base

class Cumpleanos(Base):
    __tablename__ = "cumpleanos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)

class Anuncio(Base):
    __tablename__ = "anuncios"
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    contenido = Column(Text, nullable=False)
    activo = Column(Boolean, default=True)

class TextoBiblico(Base):
    __tablename__ = "textos_biblicos"
    id = Column(Integer, primary_key=True, index=True)
    referencia = Column(String, index=True, nullable=False)  # Ej: "Juan 3:16"
    texto = Column(Text, nullable=False)
    version = Column(String, default="RVR1960")

class Ofrenda(Base):
    __tablename__ = "ofrendas"
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String, nullable=False)  # "Diezmo", "Ofrenda", "Primicias"
    monto = Column(Integer, nullable=True)  # Null si es ofrenda en especie
    descripcion = Column(Text, nullable=True)
    fecha = Column(Date, nullable=False)
    anonima = Column(Boolean, default=False)