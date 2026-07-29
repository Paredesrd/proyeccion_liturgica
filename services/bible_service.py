"""Servicios para búsqueda de textos bíblicos."""
import os
import json
from database.connection import SessionLocal
from database.models import TextoBiblico

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BIBLE_DATA_PATH = os.path.join(BASE_DIR, "static", "data", "bible.json")

# Cargar datos JSON solo una vez al iniciar
BIBLE_DATA = {}
if os.path.exists(BIBLE_DATA_PATH):
    with open(BIBLE_DATA_PATH, 'r', encoding='utf-8') as f:
        BIBLE_DATA = json.load(f)


def buscar_versiculo(libro: str, capitulo: str, version: str = "RVR1960"):
    """Busca un versículo en los datos JSON locales."""
    try:
        version_data = BIBLE_DATA.get(version, {})
        libro_data = version_data.get(libro.capitalize(), {})
        versiculos = libro_data.get(capitulo, [])

        if not versiculos:
            return None

        texto_completo = " ".join(versiculos)
        return {
            "referencia": f"{libro.capitalize()} {capitulo}",
            "texto": texto_completo,
            "version": version
        }
    except Exception as e:
        print(f"Error al buscar versículo en JSON: {e}")
        return None


def buscar_texto_en_db(referencia: str):
    """Busca un texto bíblico en la base de datos por referencia parcial."""
    try:
        with SessionLocal() as db:
            resultado = db.query(TextoBiblico).filter(
                TextoBiblico.referencia.ilike(f"%{referencia}%")
            ).first()
            
            if resultado:
                return {
                    "id": resultado.id,
                    "referencia": resultado.referencia,
                    "texto": resultado.texto,
                    "version": resultado.version
                }
            return None
    except Exception as e:
        print(f"Error al buscar texto en DB: {e}")
        return None


def obtener_todos_los_libros():
    """Obtiene la lista de libros disponibles en la Biblia JSON."""
    try:
        if not BIBLE_DATA:
            return []
        
        # Obtener libros de la versión RVR1960 por defecto
        version_data = BIBLE_DATA.get("RVR1960", {})
        return list(version_data.keys())
    except Exception as e:
        print(f"Error al obtener libros: {e}")
        return []


def obtener_capitulos(libro: str):
    """Obtiene los capítulos disponibles para un libro."""
    try:
        if not BIBLE_DATA:
            return []
        
        version_data = BIBLE_DATA.get("RVR1960", {})
        libro_data = version_data.get(libro.capitalize(), {})
        return list(libro_data.keys())
    except Exception as e:
        print(f"Error al obtener capítulos: {e}")
        return []