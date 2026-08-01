from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader
from core.config import settings

# Usaremos un encabezado estático por ahora para bloquear acceso público no autorizado
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=True)

def verify_api_key(api_key_header: str = Security(API_KEY_HEADER)):
    # En producción real, esto se validaría contra la base de datos o variables de entorno seguras
    if api_key_header != settings.SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Credenciales de acceso inválidas"
        )
    return api_key_header