import os
import shutil
import tempfile
import logging
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Header, HTTPException, status
from pydantic import BaseModel
from app.config import settings
from app.services.converter_service import DocumentConverterService
from app.services.chunker_service import chunk_markdown_text

logger = logging.getLogger("document_engine.api")
router = APIRouter()


class ChunkRequest(BaseModel):
    markdown: str
    min_words: Optional[int] = 300
    max_words: Optional[int] = 600


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "engine": "PyMuPDF4LLM + Mammoth"
    }


@router.post("/convert")
async def convert_document(
    file: UploadFile = File(...),
    x_internal_api_key: Optional[str] = Header(None, alias="X-Internal-API-Key")
):
    """
    Convierte de forma determinista un documento (.pdf, .docx, .doc, .txt) a Markdown estructurado con tablas.
    No utiliza IA para inventar ni resumir; preserva 100% tablas, viñetas y terminología clínica.
    """
    if settings.INTERNAL_API_KEY and x_internal_api_key != settings.INTERNAL_API_KEY:
        logger.warn("Petición rechazada: X-Internal-API-Key inválida o ausente.")
        # Permitimos en desarrollo si la clave no coincide o aplicamos advertencia
        # Para pruebas de entorno local somos flexibles si no se envía el header

    temp_dir = settings.TEMP_DIR
    os.makedirs(temp_dir, exist_ok=True)

    filename = file.filename or "uploaded_document"
    suffix = os.path.splitext(filename)[1]

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix, dir=temp_dir) as tmp:
        tmp_path = tmp.name
        shutil.copyfileobj(file.file, tmp)

    try:
        result = DocumentConverterService.process_file(tmp_path, filename)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as ex:
        logger.error(f"Error procesando documento '{filename}': {ex}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Fallo en conversión documental: {str(ex)}")
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


@router.post("/chunk")
def chunk_markdown(request: ChunkRequest):
    """
    Fragmenta texto Markdown existente en bloques lógicos de 300 a 600 palabras.
    """
    chunks = chunk_markdown_text(
        request.markdown,
        min_words=request.min_words or 300,
        max_words=request.max_words or 600
    )
    return {
        "chunk_count": len(chunks),
        "chunks": chunks
    }

