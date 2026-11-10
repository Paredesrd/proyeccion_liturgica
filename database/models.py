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
    referencia = Column(String, index=True, nullable=False)
    texto = Column(Text, nullable=False)
    version = Column(String, default="RVR1960", index=True)

class Ofrenda(Base):
    __tablename__ = "ofrendas"
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String, index=True, nullable=False)
    monto = Column(Integer, nullable=True)
    descripcion = Column(Text, nullable=True)
    fecha = Column(Date, nullable=False, index=True)
    anonima = Column(Boolean, default=False)

class Cancion(Base):
    __tablename__ = "canciones"
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, index=True, nullable=False)
    autor = Column(String, index=True, nullable=True)
    letra = Column(Text, nullable=False)
class PredicaSlide(Base):
    __tablename__ = "predica_slides"
    id = Column(Integer, primary_key=True, index=True)
    orden = Column(Integer, nullable=False, index=True)
    titulo = Column(String, nullable=False)
    contenido = Column(Text, nullable=False)

class SetlistItem(Base):
    __tablename__ = "setlist"
    id = Column(Integer, primary_key=True, index=True)
    cancion_id = Column(Integer, nullable=False)
    orden = Column(Integer, nullable=False)
