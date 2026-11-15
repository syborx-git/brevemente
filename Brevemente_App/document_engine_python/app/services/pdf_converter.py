import logging
import fitz  # PyMuPDF
from typing import Tuple, List

logger = logging.getLogger("document_engine.pdf")


def convert_pdf_to_markdown(file_path: str) -> Tuple[str, int, int, List[str]]:
    """
    Convierte de forma determinista un PDF a Markdown estructurado con tablas,
    respetando encabezados clínicos y tablas sin alteración semántica por IA.
    """
    try:
        doc = fitz.open(file_path)
        page_count = len(doc)
        doc.close()
    except Exception as e:
        logger.error(f"Error abriendo PDF con PyMuPDF: {e}")
        page_count = 1

    markdown_text = ""

    # 1. Intentar extracción de alta fidelidad con pymupdf4llm (Markdown con tablas | col | ... |)
    try:
        import pymupdf4llm
        logger.info(f"Procesando PDF con pymupdf4llm: {file_path}")
        markdown_text = pymupdf4llm.to_markdown(file_path)
    except Exception as ex:
        logger.warn(f"pymupdf4llm falló ({ex}), aplicando extractor determinista nativo PyMuPDF...")

    # 2. Fallback determinista si pymupdf4llm no produjo texto suficiente
    if not markdown_text or len(markdown_text.strip()) < 50:
        doc = fitz.open(file_path)
        pages_md = []
        for page_idx, page in enumerate(doc):
            # Extraer bloques de texto estructurados
            text = page.get_text("text")
            if text.strip():
                pages_md.append(f"<!-- Página {page_idx + 1} -->\n{text}")
        doc.close()
        markdown_text = "\n\n".join(pages_md)

    # Estimar conteo de palabras
    words = len(markdown_text.split())

    # Detectar secciones y encabezados (# Titulo, ## Seccion)
    sections = []
    for line in markdown_text.splitlines():
        trimmed = line.strip()
        if trimmed.startswith("#"):
            section_title = trimmed.lstrip("#").strip()
            if section_title and section_title not in sections:
                sections.append(section_title)

    return markdown_text, page_count, words, sections

