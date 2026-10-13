import json
import logging
import os
import shutil
import uuid
from pathlib import Path
from typing import Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    Security,
    UploadFile,
    status,
)

from app.config import settings
from app.dependencies import get_whisper_service, verify_api_key
from app.schemas.transcription import (
    AsyncTranscriptionInitResponse,
    HealthResponse,
    ModelListResponse,
    ModelSwitchRequest,
    TranscriptionResponse,
    TranscriptionStatus,
)
from app.services.whisper_service import WhisperService

logger = logging.getLogger("transcription_engine.api.v1")

router = APIRouter(prefix="/v1")


async def _save_upload_file_to_temp(upload_file: UploadFile, task_id: str) -> str:
    """Saves uploaded multipart file stream to disk in chunks."""
    file_ext = Path(upload_file.filename).suffix if upload_file.filename else ".audio"
    temp_filename = f"{task_id}_{uuid.uuid4().hex[:8]}{file_ext}"
    destination_path = os.path.join(settings.TEMP_DIR, temp_filename)

    with open(destination_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return destination_path


@router.post(
    "/transcribe",
    response_model=AsyncTranscriptionInitResponse,
    status_code=status.HTTP_202_ACCEPTED,
    tags=["Transcription"],
    summary="Asynchronous transcription with webhook callback",
)
async def transcribe_async(
    request: Request,
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None, description="Archivo de audio (MP3, WAV, M4A, OGG)."),
    file_path: Optional[str] = Form(None, description="Ruta absoluta local en volumen compartido (dejar vacío si se sube archivo)."),
    task_id: Optional[str] = Form(None, description="UUID único de la tarea generado por Spring Boot.", examples=["c1f8a8b2-4d2a-4b91-9e8c-3a1b2c3d4e5f"]),
    callback_url: Optional[str] = Form(None, description="URL del backend donde notificar el resultado vía POST.", examples=["http://localhost:8080/api/v1/internal/transcriptions/callback"]),
    language: Optional[str] = Form("es", description="Idioma del audio ('es', 'en') o 'auto' para autodetección."),
    _auth: str = Security(verify_api_key),
    whisper_service: WhisperService = Depends(get_whisper_service),
):
    """
    Initiates asynchronous transcription.
    Accepts audio file upload OR local shared path, immediately returns HTTP 202 Accepted,
    and dispatches background task to transcribe and POST results back to callback_url.
    """
    content_type = request.headers.get("content-type", "")

    # Handle application/json payloads if requested
    if content_type.startswith("application/json"):
        try:
            body = await request.json()
            task_id = body.get("task_id")
            file_path = body.get("file_path")
            callback_url = body.get("callback_url")
            language = body.get("language", "es")
        except Exception as parse_err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Malformed JSON body: {parse_err}",
            )

    if not task_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="'task_id' is required.",
        )

    # Determine audio source
    target_audio_path: str
    is_temp = False

    if file and file.filename:
        target_audio_path = await _save_upload_file_to_temp(file, task_id)
        is_temp = True
    elif file_path:
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Local audio file '{file_path}' does not exist on disk.",
            )
        target_audio_path = file_path
        is_temp = False
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'file' upload or 'file_path' must be provided.",
        )

    logger.info(
        f"Queuing async transcription task: task_id='{task_id}', "
        f"audio='{target_audio_path}', callback='{callback_url}', lang='{language}'"
    )

    # Dispatch to background task execution
    background_tasks.add_task(
        whisper_service.process_async_task,
        task_id=task_id,
        audio_path=target_audio_path,
        is_temp_file=is_temp,
        callback_url=callback_url,
        language=language,
    )

    return AsyncTranscriptionInitResponse(
        task_id=task_id,
        status=TranscriptionStatus.PROCESSING,
    )


@router.post(
    "/transcribe/sync",
    response_model=TranscriptionResponse,
    status_code=status.HTTP_200_OK,
    tags=["Transcription"],
    summary="Synchronous audio transcription",
)
async def transcribe_sync(
    request: Request,
    file: Optional[UploadFile] = File(None, description="Archivo de audio para transcripción inmediata."),
    file_path: Optional[str] = Form(None, description="Ruta local en el servidor (dejar vacío si se sube archivo)."),
    task_id: Optional[str] = Form(None, description="UUID de la tarea.", examples=["e4d8a1c9-772b-45fc-9a6d-23910b8cf812"]),
    language: Optional[str] = Form("es", description="Idioma ('es', 'en') o 'auto'."),
    _auth: str = Security(verify_api_key),
    whisper_service: WhisperService = Depends(get_whisper_service),
):
    """
    Performs synchronous transcription and returns structured JSON response directly.
    Respects the concurrency semaphore before executing.
    """
    content_type = request.headers.get("content-type", "")

    # Handle application/json payloads if requested
    if content_type.startswith("application/json"):
        try:
            body = await request.json()
            task_id = body.get("task_id")
            file_path = body.get("file_path")
            language = body.get("language", "es")
        except Exception as parse_err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Malformed JSON body: {parse_err}",
            )

    if not task_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="'task_id' is required.",
        )

    target_audio_path: str
    is_temp = False

    if file and file.filename:
        target_audio_path = await _save_upload_file_to_temp(file, task_id)
        is_temp = True
    elif file_path:
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Local audio file '{file_path}' does not exist on disk.",
            )
        target_audio_path = file_path
        is_temp = False
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'file' upload or 'file_path' must be provided.",
        )

    try:
        response = await whisper_service.execute_transcription(
            task_id=task_id,
            audio_path=target_audio_path,
            language=language,
        )
        return response
    finally:
        if is_temp and os.path.exists(target_audio_path):
            try:
                os.remove(target_audio_path)
            except OSError as err:
                logger.warning(f"Could not delete temporary audio file '{target_audio_path}': {err}")


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["Monitoring"],
    summary="Health check and resource inspection",
)
async def health_check(
    whisper_service: WhisperService = Depends(get_whisper_service),
):
    """
    Health check endpoint reporting model status, device, compute type,
    and semaphore availability in real time.
    """
    concurrency_stats = await whisper_service.get_concurrency_status()
    performance_stats = whisper_service.get_performance_status()

    return HealthResponse(
        status="healthy",
        model_loaded=whisper_service.is_loaded(),
        model_name=settings.WHISPER_MODEL_SIZE,
        device=settings.WHISPER_DEVICE,
        compute_type=settings.WHISPER_COMPUTE_TYPE,
        concurrency=concurrency_stats,
        performance=performance_stats,
    )


@router.get(
    "/models",
    response_model=ModelListResponse,
    status_code=status.HTTP_200_OK,
    tags=["Monitoring"],
    summary="List available Whisper model profiles",
)
async def list_models(
    _auth: str = Security(verify_api_key),
    whisper_service: WhisperService = Depends(get_whisper_service),
):
    """
    Lista los perfiles de modelos disponibles (base, small, large-v3-turbo, large-v3)
    y señala cuál está actualmente activo en memoria.
    """
    profiles = settings.get_supported_model_profiles(settings.WHISPER_MODEL_SIZE)
    return ModelListResponse(
        active_model=settings.WHISPER_MODEL_SIZE,
        device=settings.WHISPER_DEVICE,
        compute_type=settings.WHISPER_COMPUTE_TYPE,
        available_models=profiles,
    )


@router.post(
    "/models/switch",
    status_code=status.HTTP_200_OK,
    tags=["Monitoring"],
    summary="Switch Whisper model dynamically in memory",
)
async def switch_model(
    payload: ModelSwitchRequest,
    _auth: str = Security(verify_api_key),
    whisper_service: WhisperService = Depends(get_whisper_service),
):
    """
    Cambia dinámicamente el modelo cargado en memoria RAM (por ejemplo, a 'large-v3-turbo')
    sin necesidad de reiniciar el microservicio.
    """
    try:
        result = await whisper_service.switch_model(
            model_name=payload.model_name,
            compute_type=payload.compute_type,
        )
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo cargar el modelo '{payload.model_name}': {str(exc)}",
        )

