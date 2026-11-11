import logging
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.endpoints import router as v1_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger("document_engine")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Microservicio determinista para convertir protocolos clínicos (PDF/DOCX) a Markdown estructurado con tablas (PyMuPDF4LLM)."
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router
app.include_router(v1_router, prefix="/v1")


@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/v1/health"
    }


if __name__ == "__main__":
    import uvicorn
    settings.ensure_directories()
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

