import os
from pathlib import Path


def generar_contexto_ia(directorio_raiz, archivo_salida):
    """
    Escanea el directorio del proyecto y consolida todo el código fuente
    relevante en un solo archivo de texto para análisis de IA.
    """
    # Directorios que la IA no necesita para entender la lógica del código
    directorios_ignorados = {
        '.venv', 'venv', 'env', '.git', '.idea', '__pycache__',
        'build', 'dist', 'static', 'templates', 'External Libraries'
    }

    # Extensiones de archivos binarios, logs o irrelevantes para la lógica pura
    extensiones_ignoradas = {
        '.db', '.sqlite', '.sqlite3', '.pyc', '.pyd', '.pyo',
        '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.exe',
        '.bat', '.spec', '.log'
    }

    # Archivos específicos a ignorar
    archivos_ignorados = {
        'generar_contexto.py',  # Excluir este mismo script
        '.gitignore'
    }

    raiz = Path(directorio_raiz)
    salida_path = Path(archivo_salida)

    with open(salida_path, 'w', encoding='utf-8') as f:
        f.write("# CONTEXTO DEL PROYECTO PARA IA\n")
        f.write("Este archivo contiene la estructura de directorios y el código fuente principal del proyecto.\n\n")

        # 1. Imprimir la estructura del árbol del proyecto
        f.write("## ESTRUCTURA DE DIRECTORIOS\n")
        f.write("```text\n")
        for root, dirs, files in os.walk(raiz):
            # Modificar la lista 'dirs' in-place para no entrar en carpetas ignoradas
            dirs[:] = [d for d in dirs if d not in directorios_ignorados]

            nivel = root.replace(str(raiz), '').count(os.sep)
            indentacion = ' ' * 4 * nivel
            nombre_carpeta = os.path.basename(root)
            if nombre_carpeta:  # Evita imprimir una línea vacía para la raíz absoluta
                f.write(f"{indentacion}{nombre_carpeta}/\n")

            sub_indentacion = ' ' * 4 * (nivel + 1)
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext not in extensiones_ignoradas and file not in archivos_ignorados:
                    f.write(f"{sub_indentacion}{file}\n")
        f.write("```\n\n")

        # 2. Imprimir el contenido de cada archivo válido
        f.write("## CÓDIGO FUENTE\n")
        for root, dirs, files in os.walk(raiz):
            # Mantener la restricción de carpetas
            dirs[:] = [d for d in dirs if d not in directorios_ignorados]

            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in extensiones_ignoradas or file in archivos_ignorados:
                    continue

                ruta_completa = Path(root) / file
                ruta_relativa = ruta_completa.relative_to(raiz)

                f.write(f"\n### ARCHIVO: {ruta_relativa}\n")

                # Asignar el tipo de bloque de código correcto
                tipo_bloque = "python" if ext == ".py" else ("text" if ext == ".txt" else "")
                f.write(f"```{tipo_bloque}\n")

                try:
                    with open(ruta_completa, 'r', encoding='utf-8') as source_file:
                        f.write(source_file.read())
                except Exception as e:
                    f.write(f"Error al leer el archivo: {str(e)}\n")

                f.write("\n```\n")

    print(f"Contexto extraído y actualizado exitosamente en: {archivo_salida}")


if __name__ == "__main__":
    # Obtiene la ruta donde se está ejecutando el script (raíz de proyeccion_liturgica)
    directorio_actual = os.getcwd()

    # Nombre del archivo independiente que se generará
    archivo_destino = "contexto_proyecto_ia.txt"

    generar_contexto_ia(directorio_actual, archivo_destino)