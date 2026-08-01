from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import re
import unicodedata

from database.connection import get_bible_db
from core.logger import log

router = APIRouter()

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

def normalize(text_val):
    if not text_val: return ""
    text_val = text_val.lower().strip()
    text_val = re.sub(r'^1\s*', '1', text_val)
    text_val = re.sub(r'^2\s*', '2', text_val)
    text_val = re.sub(r'^3\s*', '3', text_val)
    text_val = text_val.replace(" ", "")
    return ''.join(c for c in unicodedata.normalize('NFD', text_val) if unicodedata.category(c) != 'Mn')

def get_standard_book(search_term):
    norm_term = normalize(search_term)
    for standard, aliases in BIBLE_ALIASES.items():
        if norm_term == standard or standard.startswith(norm_term):
            return standard
        for a in aliases:
            if norm_term == a or a.startswith(norm_term):
                return standard
    return None

@router.get("/api/bible/versions")
def get_versions(db: Session = Depends(get_bible_db)):
    try:
        query = text("SELECT DISTINCT version FROM versiculos ORDER BY version")
        result = db.execute(query).fetchall()
        return {"versiones": [row[0] for row in result]}
    except Exception as e:
        log.error(f"Error al obtener versiones bíblicas: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al consultar versiones")

@router.get("/api/bible/books")
def get_books(version: str = "RVR1960", db: Session = Depends(get_bible_db)):
    try:
        query = text("SELECT DISTINCT nombre_libro_original FROM versiculos WHERE version = :version")
        result = db.execute(query, {"version": version}).fetchall()
        return {"libros": [row[0] for row in result]}
    except Exception as e:
        log.error(f"Error al obtener libros bíblicos: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al consultar libros")

@router.get("/api/bible/search")
def search_bible(libro: str, capitulo: str, version: str = "RVR1960", db: Session = Depends(get_bible_db)):
    std_book = get_standard_book(libro)
    if not std_book:
        raise HTTPException(status_code=404, detail=f"[ERROR_LIBRO] Libro '{libro}' no reconocido.")

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

    try:
        check_query = text("SELECT 1 FROM versiculos WHERE version = :version AND libro = :libro AND capitulo = :capitulo LIMIT 1")
        exists = db.execute(check_query, {"version": version, "libro": std_book, "capitulo": chap_num}).fetchone()
        if not exists:
            raise HTTPException(status_code=404, detail=f"[ERROR_CAPÍTULO] El capítulo {chap_num} no existe en este libro.")

        if not verse_str:
            data_query = text("SELECT versiculo, texto, nombre_libro_original FROM versiculos WHERE version = :version AND libro = :libro AND capitulo = :capitulo ORDER BY versiculo")
            rows = db.execute(data_query, {"version": version, "libro": std_book, "capitulo": chap_num}).fetchall()

            final_text = "\n".join([f"{r[0]}. {r[1]}" for r in rows])
            ref_name = rows[0][2]
            referencia = f"{ref_name} {chap_num}"
        else:
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
                raise HTTPException(status_code=400, detail="[ERROR_SINTAXIS] Formato de versículo inválido.")

            placeholders = ','.join(f':v{i}' for i in range(len(req_verses)))
            params = {"version": version, "libro": std_book, "capitulo": chap_num}
            for i, v in enumerate(req_verses):
                params[f"v{i}"] = v

            data_query = text(f"SELECT versiculo, texto, nombre_libro_original FROM versiculos WHERE version = :version AND libro = :libro AND capitulo = :capitulo AND versiculo IN ({placeholders}) ORDER BY versiculo")
            rows = db.execute(data_query, params).fetchall()

            if not rows:
                raise HTTPException(status_code=404, detail=f"[ERROR_VERSÍCULO] Versículo(s) {verse_str} no encontrado(s).")

            final_text = "\n".join([f"{r[0]}. {r[1]}" for r in rows])
            ref_name = rows[0][2]
            referencia = f"{ref_name} {chap_num}"

        return {
            "referencia": referencia,
            "version": version,
            "texto": final_text
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        log.error(f"Error crítico en búsqueda bíblica: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al procesar búsqueda bíblica")