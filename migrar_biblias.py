import sqlite3
import json
import os
import re
import unicodedata

DB_PATH = os.path.join("database", "biblias.db")
BIBLE_DIR = os.path.join("static", "data", "bibles")

# Mapeo estricto, exhaustivo y visible de los 66 libros del canon
BIBLE_ALIASES = {
    # Antiguo Testamento - Pentateuco (5)
    "genesis": ["gen"],
    "exodo": ["exo"],
    "levitico": ["lev"],
    "numeros": ["num"],
    "deuteronomio": ["deut", "deu"],

    # Antiguo Testamento - Históricos (12)
    "josue": ["jos"],
    "jueces": ["jue"],
    "rut": ["rut"],
    "1samuel": ["1sam", "1sa", "1sm"],
    "2samuel": ["2sam", "2sa", "2sm"],
    "1reyes": ["1rey", "1re"],
    "2reyes": ["2rey", "2re"],
    "1cronicas": ["1cro", "1cr"],
    "2cronicas": ["2cro", "2cr"],
    "esdras": ["esd"],
    "nehemias": ["neh"],
    "ester": ["est"],

    # Antiguo Testamento - Poéticos (5)
    "job": ["job"],
    "salmos": ["sal", "slm"],
    "proverbios": ["prov", "pro", "prv", "probervios"],
    "eclesiastes": ["ecl"],
    "cantares": ["can", "cnt"],

    # Antiguo Testamento - Profetas Mayores (5)
    "isaias": ["isa"],
    "jeremias": ["jer"],
    "lamentaciones": ["lam"],
    "ezequiel": ["eze"],
    "daniel": ["dan", "dnl"],

    # Antiguo Testamento - Profetas Menores (12)
    "oseas": ["ose", "hozeas"],
    "joel": ["joe"],
    "amos": ["amo"],
    "abdias": ["abd"],
    "jonas": ["jon"],
    "miqueas": ["miq"],
    "nahum": ["nah"],
    "habacuc": ["hab"],
    "sofonias": ["sof"],
    "hageo": ["hag"],
    "zacarias": ["zac"],
    "malaquias": ["mal"],

    # Nuevo Testamento - Evangelios (4)
    "mateo": ["mat"],
    "marcos": ["mar", "mrk"],
    "lucas": ["luc", "luk"],
    "juan": ["jn", "jhn", "jua"],

    # Nuevo Testamento - Histórico (1)
    "hechos": ["hech", "hch", "act"],

    # Nuevo Testamento - Cartas Paulinas (13)
    "romanos": ["rom"],
    "1corintios": ["1cor", "1co"],
    "2corintios": ["2cor", "2co"],
    "galatas": ["gal"],
    "efesios": ["efe", "eph"],
    "filipenses": ["fil", "php"],
    "colosenses": ["col"],
    "1tesalonicenses": ["1tes", "1ts"],
    "2tesalonicenses": ["2tes", "2ts"],
    "1timoteo": ["1tim", "1ti"],
    "2timoteo": ["2tim", "2ti"],
    "tito": ["tit"],
    "filemon": ["flm"],

    # Nuevo Testamento - Cartas Generales (8)
    "hebreos": ["heb", "ebreos"],
    "santiago": ["stg", "san", "jas"],
    "1pedro": ["1pe", "1ped", "1pt"],
    "2pedro": ["2pe", "2ped", "2pt"],
    "1juan": ["1jn", "1ju"],
    "2juan": ["2jn", "2ju"],
    "3juan": ["3jn", "3ju"],
    "judas": ["jud"],

    # Nuevo Testamento - Profético (1)
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


def identify_book(name, usfm):
    n_name = normalize(name)
    n_usfm = normalize(usfm)
    for standard, aliases in BIBLE_ALIASES.items():
        if n_name == standard or n_usfm == standard or standard in n_name:
            return standard
        for a in aliases:
            if n_name == a or n_usfm == a or a in n_name:
                return standard
    return None


def main():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    print(f"Preparando base de datos estructurada en {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("DROP TABLE IF EXISTS versiculos")

    cursor.execute('''
        CREATE TABLE versiculos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT,
            libro TEXT,
            nombre_libro_original TEXT,
            capitulo INTEGER,
            versiculo INTEGER,
            texto TEXT
        )
    ''')

    cursor.execute("CREATE INDEX idx_busqueda ON versiculos(version, libro, capitulo, versiculo)")

    total_inserted = 0

    if not os.path.exists(BIBLE_DIR):
        print(f"Error: No se encontró la ruta {BIBLE_DIR}")
        return

    for filename in os.listdir(BIBLE_DIR):
        if not filename.endswith(".json"): continue

        version = filename.replace(".json", "")
        print(f"Destripando versión JSON: {version}...")

        with open(os.path.join(BIBLE_DIR, filename), 'r', encoding='utf-8') as f:
            data = json.load(f)

        for b in data.get("books", []):
            b_name = b.get("name", "")
            b_usfm = b.get("book_usfm", "")

            std_book = identify_book(b_name, b_usfm)
            if not std_book:
                print(f"  [Advertencia] Libro irreconocible omitido: {b_name}")
                continue

            for c in b.get("chapters", []):
                if c.get("is_chapter") is False:
                    continue

                usfm = str(c.get("chapter_usfm", ""))
                human = str(c.get("current", {}).get("human", ""))

                chap_nums = re.findall(r'\d+', usfm)
                if not chap_nums:
                    chap_nums = re.findall(r'\d+', human)

                if not chap_nums:
                    continue

                chap_num = int(chap_nums[-1])

                for item in c.get("items", []):
                    if item.get("type") == "verse":
                        lines = " ".join(item.get("lines", []))
                        v_nums = item.get("verse_numbers", [])

                        if not isinstance(v_nums, list):
                            v_nums = [v_nums]

                        for v in v_nums:
                            v_digits = re.findall(r'\d+', str(v))
                            if v_digits:
                                vers_num = int(v_digits[0])
                                cursor.execute('''
                                    INSERT INTO versiculos (version, libro, nombre_libro_original, capitulo, versiculo, texto)
                                    VALUES (?, ?, ?, ?, ?, ?)
                                ''', (version, std_book, b_name, chap_num, vers_num, lines))
                                total_inserted += 1

    conn.commit()
    conn.close()
    print(f"¡Migración exitosa! {total_inserted} versículos estructurados en formato SQL.")


if __name__ == '__main__':
    main()