import os
import sys
from pydantic_settings import BaseSettings

# Lógica para detectar si corremos como .exe o como código fuente
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(os.path.abspath(sys.executable))
else:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sistema de Proyección Litúrgica"
    VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Las bases de datos vivirán afuera del .exe
    DATABASE_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'liturgia.db')}"
    BIBLE_DB_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'database', 'biblias.db')}"

    SECRET_KEY: str = "cambiar-esto-en-produccion-inmediatamente"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
