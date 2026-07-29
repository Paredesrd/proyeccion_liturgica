from sqlalchemy import Column, Integer, String, Date, Text
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
    activo = Column(Integer, default=1) # 1 para activo, 0 para inactivo