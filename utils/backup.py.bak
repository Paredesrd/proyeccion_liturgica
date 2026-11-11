import os
import shutil
import datetime
from pathlib import Path
from core.logger import log

def realizar_backup():
    base_dir = Path(__file__).resolve().parent.parent
    backup_dir = base_dir / "backups"
    backup_dir.mkdir(exist_ok=True)
    
    fecha = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    nombre_zip = backup_dir / f"respaldo_liturgia_{fecha}"
    
    try:
        log.info("Iniciando respaldo automático del sistema...")
        # Copiamos la BD
        db_file = base_dir / "liturgia.db"
        if db_file.exists():
            shutil.copy2(db_file, backup_dir / f"liturgia_{fecha}.db")
            
        # Creamos el ZIP de fondos (opcional, pero recomendado)
        shutil.make_archive(str(nombre_zip), 'zip', base_dir / "static" / "media" / "backgrounds")
        
        log.info(f"✅ Respaldo completado con éxito en: {nombre_zip}.zip")
    except Exception as e:
        log.error(f"❌ Fallo crítico al crear el respaldo: {str(e)}")
