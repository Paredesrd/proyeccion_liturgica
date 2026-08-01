import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Sistema de Proyección Litúrgica"
    VERSION: str = "1.0.0"

    # Red y Despliegue
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Base de Datos Unificada (Múltiples Motores)
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATABASE_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'liturgia.db')}"
    BIBLE_DB_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'database', 'biblias.db')}"

    # Seguridad
    SECRET_KEY: str = "cambiar-esto-en-produccion-inmediatamente"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()