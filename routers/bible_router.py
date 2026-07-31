from fastapi import APIRouter, HTTPException
import sqlite3
import os
import re
import unicodedata

router = APIRouter()

DB_PATH = os.path.join("database", "biblias.db")

# Diccionario canónico integrado para búsquedas ultrarrápidas
BIBLE_ALIASES = {
    "genesis": ["gen"], "exodo": ["exo"], "levitico": ["lev"], "numeros": ["num"], "deuteronomio": ["deut", "deu"],
    "josue": ["jos"], "jueces": ["jue"], "rut": ["rut"],
    "1samuel": ["1sam", "1sa", "1sm"], "2samuel": ["2sam", "2sa", "2sm"],
    "1reyes": ["1rey", "1re"], "2reyes": ["2rey", "2re"],
    "1cronicas": ["1cro", "1cr"], "2cronicas": ["2cro", "2cr"],
    "esdras": ["esd"], "nehemias": ["neh"], "ester": ["est"],
    "job": ["job"], "salmos": ["sal", "slm"], "proverbios": ["prov", "pro", "prv", "probervios"],
    "eclesiastes": ["ecl"], "cantares": ["can", "cnt"],
    "isaias": ["isa"], "jeremias": ["jer"], "lamentaciones": ["lam"], "ezequiel": ["eze"], "daniel": ["dan", "dnl"],
    "oseas": ["ose", "hozeas"], "joel": ["joe"], "amos": ["amo"], "abdias": ["abd"], "jonas": ["jon"],
    "miqueas": ["miq"],
    "nahum": ["nah"], "habacuc": ["hab"], "sofonias": ["sof"], "hageo": ["hag"], "zacarias": ["zac"],
    "malaquias": ["mal"],
    "mateo": ["mat"], "marcos": ["mar", "mrk"], "lucas": ["luc", "luk"], "juan": ["jn", "jhn", "jua"],
    "hechos": ["hech", "hch", "act"],
    "romanos": ["rom"], "1corintios": ["1cor", "1co"], "2corintios": ["2cor", "2co"],
    "galatas": ["gal"], "efesios": ["efe", "eph"], "filipenses": ["fil", "php"], "colosenses": ["col"],
    "1tesalonicenses": ["1tes", "1ts"], "2tesalonicenses": ["2tes", "2ts"],
    "1timoteo": ["1tim", "1ti"], "2timoteo": ["2tim", "2ti"], "tito": ["tit"], "filemon": ["flm"],
    "hebreos": ["heb", "ebreos"], "santiago": ["stg", "san", "jas"],
    "1pedro": ["1pe", "1ped", "1pt"], "2pedro": ["2pe", "2ped", "2pt"],
    "1juan": ["1jn", "1ju"], "2juan": ["2jn", "2ju"], "3juan": ["3jn", "3ju"], "judas": ["jud"],
    "apocalipsis": ["apoc", "apo", "rev"]
}


def normalize(text):
    if not text: return ""
    text = text.lower().strip()
    text = re.sub(r'^1\s*', '1', text)
    text = re.sub(r'^2\s*', '2', text)
    text = re.sub(r'^3\s*', '3', text)
    text = text.replace(" ", "")
    return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')


def get_standard_book(search_term):
    norm_term = normalize(search_term)
    for standard, aliases in BIBLE_ALIASES.items():
        if norm_term == standard or standard.startswith(norm_term):
            return standard
        for a in aliases:
            if norm_term == a or a.startswith(norm_term):
                return standard
    return None


def get_db_connection():
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=500, detail="Base de datos no encontrada. Ejecute el script de migración.")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@router.get("/api/bible/versions")
def get_versions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT version FROM versiculos ORDER BY version")
    versions = [row['version'] for row in cursor.fetchall()]
    conn.close()
    return {"versiones": versions}


@router.get("/api/bible/books")
def get_books(version: str = "RVR1960"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT nombre_libro_original FROM versiculos WHERE version = ?", (version,))
    books = [row['nombre_libro_original'] for row in cursor.fetchall()]
    conn.close()
    return {"libros": books}


@router.get("/api/bible/search")
def search_bible(libro: str, capitulo: str, version: str = "RVR1960"):
    std_book = get_standard_book(libro)
    if not std_book:
        raise HTTPException(status_code=404, detail=f"[ERROR_LIBRO] Libro '{libro}' no reconocido.")

    # 1. PARSEO DE CAPÍTULO Y VERSÍCULO
    chap_str = capitulo.strip()
    verse_str = None
    if ":" in capitulo:
        parts = capitulo.split(":", 1)
        chap_str = parts[0].strip()
        verse_str = parts[1].strip()

    try:
        chap_num = int(re.sub(r'\D', '', chap_str))
    except ValueError:
        raise HTTPException(status_code=400, detail="[ERROR_SINTAXIS] El capítulo debe ser un número válido.")

    conn = get_db_connection()
    cursor = conn.cursor()

    # 2. VERIFICACIÓN DE CAPÍTULO EN BD
    cursor.execute("SELECT 1 FROM versiculos WHERE version=? AND libro=? AND capitulo=? LIMIT 1",
                   (version, std_book, chap_num))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"[ERROR_CAPÍTULO] El capítulo {chap_num} no existe en este libro.")

    # 3. EXTRACCIÓN MEDIANTE SQL (Precisión absoluta)
    if not verse_str:
        # Extraer capítulo entero
        cursor.execute(
            "SELECT versiculo, texto, nombre_libro_original FROM versiculos WHERE version=? AND libro=? AND capitulo=? ORDER BY versiculo",
            (version, std_book, chap_num))
        rows = cursor.fetchall()

        final_text = "\n".join([f"{r['versiculo']}. {r['texto']}" for r in rows])
        ref_name = rows[0]['nombre_libro_original']
        referencia = f"{ref_name} {chap_num}"
    else:
        # Extraer versículos específicos o rangos
        req_verses = []
        if "-" in verse_str:
            nums = re.findall(r'\d+', verse_str)
            if len(nums) >= 2:
                req_verses = list(range(int(nums[0]), int(nums[1]) + 1))
            elif len(nums) == 1:
                req_verses = [int(nums[0])]
        else:
            nums = re.findall(r'\d+', verse_str)
            if nums:
                req_verses = [int(nums[0])]

        if not req_verses:
            conn.close()
            raise HTTPException(status_code=400, detail="[ERROR_SINTAXIS] Formato de versículo inválido.")

        # Inyección segura de parámetros SQL IN ()
        placeholders = ','.join('?' * len(req_verses))
        query = f"SELECT versiculo, texto, nombre_libro_original FROM versiculos WHERE version=? AND libro=? AND capitulo=? AND versiculo IN ({placeholders}) ORDER BY versiculo"

        cursor.execute(query, [version, std_book, chap_num] + req_verses)
        rows = cursor.fetchall()

        if not rows:
            conn.close()
            raise HTTPException(status_code=404, detail=f"[ERROR_VERSÍCULO] Versículo(s) {verse_str} no encontrado(s).")

        final_text = "\n".join([f"{r['versiculo']}. {r['texto']}" for r in rows])
        ref_name = rows[0]['nombre_libro_original']
        referencia = f"{ref_name} {chap_num}"

    conn.close()

    return {
        "referencia": referencia,
        "version": version,
        "texto": final_text
    }