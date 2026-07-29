import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BIBLE_DATA_PATH = os.path.join(BASE_DIR, "static", "data", "bible.json")

BIBLE_DATA = {}
if os.path.exists(BIBLE_DATA_PATH):
    with open(BIBLE_DATA_PATH, 'r', encoding='utf-8') as f:
        BIBLE_DATA = json.load(f)


def buscar_versiculo(libro: str, capitulo: str, version: str = "RVR1960"):
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