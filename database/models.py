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
    color = Column(String, default="#3498db")  # Color del anuncio
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
    concepto = Column(String, nullable=False)  # Concepto de la ofrenda
    monto = Column(Integer, nullable=False)  # Monto en centavos o unidad entera
    fecha = Column(Date, nullable=False)