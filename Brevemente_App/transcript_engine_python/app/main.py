import logging
import os
import sys
from contextlib import asynccontextmanager

# Sanitize corrupted SSL CA bundle environment variables (e.g. from broken PostgreSQL configs)
for _ssl_var in ("CURL_CA_BUNDLE", "SSL_CERT_FILE", "REQUESTS_CA_BUNDLE"):
    _val = os.environ.get(_ssl_var)
    if _val and not os.path.exists(_val):
        os.environ.pop(_ssl_var, None)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.endpoints import router as v1_router
from app.config import settings
from app.services.whisper_service import WhisperService

# Configure Structured Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger("transcription_engine")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler:
    Loads WhisperModel once upon service startup into RAM/VRAM.
    """
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} ({settings.ENV})...")
    settings.ensure_directories()

    # Initialize Whisper Model Service
    whisper_service = WhisperService(settings)
    try:
        await whisper_service.load_model()
    except Exception as exc:
        logger.critical(f"FATAL: Failed to pre-load Whisper model during startup: {exc}", exc_info=True)
        raise exc

    app.state.whisper_service = whisper_service
    logger.info("Service initialized and ready to accept transcription requests.")

    yield

    # Clean-up during shutdown
    logger.info("Shutting down Transcription Engine. Cleaning up resources...")


# OpenAPI Tags Metadata for Swagger UI
tags_metadata = [
    {
        "name": "Transcription",
        "description": "Endpoints para procesamiento de audio (asíncrono con webhook y síncrono directo).",
    },
    {
        "name": "Monitoring",
        "description": "Inspección de salud del microservicio, estado del modelo en memoria y semáforo de concurrencia.",
    },
    {
        "name": "Root",
        "description": "Información general y mapa de rutas de la API.",
    },
]

# Swagger UI Interactive Parameters
swagger_ui_parameters = {
    "persistAuthorization": True,      # Persiste el token entre recargas de página
    "displayRequestDuration": True,   # Muestra la duración exacta de cada petición en ms
    "docExpansion": "list",           # Lista limpia de operaciones
    "filter": True,                   # Buscador integrado de endpoints
    "tryItOutEnabled": True,          # Activa 'Try it out' automáticamente
}

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Microservicio desacoplado y de alto rendimiento para transcripción de audio "
        "con **faster-whisper** (CTranslate2), control de concurrencia por semáforos "
        "y salida compatible con columnas `JSONB` de PostgreSQL en Spring Boot.\n\n"
        "### 🔐 Autenticación para Pruebas:\n"
        "Haz clic en el botón verde **'Authorize'** (arriba a la derecha) e ingresa el valor de "
        f"`{settings.INTERNAL_API_KEY}` para desbloquear los endpoints."
    ),
    openapi_tags=tags_metadata,
    swagger_ui_parameters=swagger_ui_parameters,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred in transcription engine.", "error": str(exc)},
    )


# Register API Routers
app.include_router(v1_router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "endpoints": {
            "health": "/v1/health",
            "async_transcribe": "/v1/transcribe",
            "sync_transcribe": "/v1/transcribe/sync",
            "documentation": "/docs",
        },
    }
