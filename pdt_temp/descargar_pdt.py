import requests
import json
import os
import time

# Crear carpeta para guardar los archivos
if not os.path.exists('PDT_JSON'):
    os.makedirs('PDT_JSON')

# Lista de libros de la Biblia con sus capítulos
libros_biblia = {
    # Antiguo Testamento
    'genero': 50, 'exodo': 40, 'levitico': 27, 'numeros': 36, 'deuteronomio': 34,
    'josue': 24, 'jueces': 21, 'rut': 4, '1samuel': 31, '2samuel': 24,
    '1reyes': 22, '2reyes': 25, '1cronicas': 29, '2cronicas': 36, 'esdras': 10,
    'nehemias': 13, 'ester': 10, 'job': 42, 'salmos': 150, 'proverbios': 31,
    'eclesiastes': 12, 'cantares': 8, 'isaias': 66, 'jeremias': 52, 'lamentaciones': 5,
    'ezequiel': 48, 'daniel': 12, 'oseas': 14, 'joel': 3, 'amos': 9,
    'abdias': 1, 'jonas': 4, 'miqueas': 7, 'nahum': 3, 'habacuc': 3,
    'sofonias': 3, 'hageo': 2, 'zacarias': 14, 'malaquias': 4,
    # Nuevo Testamento
    'mateo': 28, 'marcos': 16, 'lucas': 24, 'juan': 21, 'hechos': 28,
    'romanos': 16, '1corintios': 16, '2corintios': 13, 'galatas': 6, 'efesios': 6,
    'filipenses': 4, 'colosenses': 4, '1tesalonicenses': 5, '2tesalonicenses': 3, '1timoteo': 6,
    '2timoteo': 4, 'tito': 3, 'filemon': 1, 'hebreos': 13, 'santiago': 5,
    '1pedro': 5, '2pedro': 3, '1juan': 5, '2juan': 1, '3juan': 1,
    'judas': 1, 'apocalipsis': 22
}

# URL base de la API
url_base = "https://bible-api.deno.dev/api/read/pdt"

print("📖 Iniciando descarga de la PDT (Palabra de Dios para Todos)...")
print("=" * 60)

total_descargado = 0
errores = []

for libro, capitulos in libros_biblia.items():
    print(f"\n📚 Descargando {libro.upper()} ({capitulos} capítulos)...")

    for capitulo in range(1, capitulos + 1):
        try:
            # Construir URL
            url = f"{url_base}/{libro}/{capitulo}"

            # Hacer la petición
            response = requests.get(url, timeout=10)

            if response.status_code == 200:
                datos = response.json()

                # Guardar en archivo JSON
                nombre_archivo = f"PDT_JSON/{libro}_cap{capitulo:02d}.json"
                with open(nombre_archivo, 'w', encoding='utf-8') as f:
                    json.dump(datos, f, ensure_ascii=False, indent=2)

                total_descargado += 1
                print(f"  ✓ Capítulo {capitulo} descargado", end='\r')
            else:
                errores.append(f"{libro} {capitulo} - Error {response.status_code}")

        except Exception as e:
            errores.append(f"{libro} {capitulo} - {str(e)}")

        # Pequeña pausa para no saturar la API
        time.sleep(0.1)

    print(f"  ✅ {libro.upper()} completado")

# Resumen final
print("\n" + "=" * 60)
print(f"✅ Descarga completada!")
print(f"📦 Total de capítulos descargados: {total_descargado}")
print(f"📁 Archivos guardados en: PDT_JSON/")

if errores:
    print(f"\n⚠️ Errores encontrados: {len(errores)}")
    for error in errores[:10]:  # Mostrar primeros 10 errores
        print(f"  - {error}")

print("\n ¡Listo! Ya tienes toda la PDT en formato JSON.")