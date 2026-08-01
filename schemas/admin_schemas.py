from pydantic import BaseModel, Field

class CumpleanosCreate(BaseModel):
    nombre: str = Field(..., min_length=1, description="Nombre completo de la persona")
    fecha: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="Fecha en formato YYYY-MM-DD")

class AnuncioCreate(BaseModel):
    titulo: str = Field(..., min_length=1, description="Título del anuncio")
    contenido: str = Field(..., min_length=1, description="Contenido del anuncio")
    activo: bool = True

class AnuncioUpdate(BaseModel):
    titulo: str | None = Field(None, min_length=1)
    contenido: str | None = Field(None, min_length=1)
    activo: bool | None = None

class CancionCreate(BaseModel):
    titulo: str = Field(..., min_length=1, description="Título de la canción")
    autor: str | None = Field(None, description="Autor o ministerio")
    letra: str = Field(..., min_length=1, description="Letra completa de la canción")

class CancionUpdate(BaseModel):
    titulo: str | None = Field(None, min_length=1)
    autor: str | None = Field(None)
    letra: str | None = Field(None, min_length=1)

class OfrendaCreate(BaseModel):
    tipo: str = Field(..., min_length=1, description="Tipo de ofrenda")
    monto: int | None = Field(None, ge=0, description="Monto monetario (opcional)")
    descripcion: str | None = None
    fecha: str | None = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$', description="Fecha en formato YYYY-MM-DD")
    anonima: bool = False