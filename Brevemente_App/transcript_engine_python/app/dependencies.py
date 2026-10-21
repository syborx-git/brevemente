from typing import Optional

from fastapi import HTTPException, Request, Security, status
from fastapi.security import APIKeyHeader

from app.config import settings
from app.services.whisper_service import WhisperService

api_key_header = APIKeyHeader(
    name="X-Internal-API-Key",
    description="Clave de seguridad interna compartida (INTERNAL_API_KEY). Ingrésala aquí para autorizar tus pruebas.",
    auto_error=False,
)


async def verify_api_key(
    api_key: Optional[str] = Security(api_key_header),
) -> str:
    """
    Validates internal shared secret header between Spring Boot backend and this microservice.
    """
    if not api_key or api_key != settings.INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid or missing X-Internal-API-Key header.",
        )
    return api_key


def get_whisper_service(request: Request) -> WhisperService:
    """
    Retrieves the singleton WhisperService stored on app.state during lifespan startup.
    """
    service = getattr(request.app.state, "whisper_service", None)
    if not service or not isinstance(service, WhisperService):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Whisper transcription service is not ready or initialized.",
        )
    return service
