import os
import logging
from typing import Tuple, List, Dict, Any
from app.services.pdf_converter import convert_pdf_to_markdown
from app.services.docx_converter import convert_docx_to_markdown
from app.services.chunker_service import chunk_markdown_text

logger = logging.getLogger("document_engine.converter")


class DocumentConverterService:
    @staticmethod
    def process_file(
        file_path: str,
        original_filename: str
    ) -> Dict[str, Any]:
        """
        Determina la extensión del archivo y aplica el extractor determinista adecuado.
        """
        ext = os.path.splitext(original_filename)[1].lower()

        markdown_text = ""
        page_count = 1
        word_count = 0
        sections: List[str] = []

        if ext == ".pdf":
            logger.info(f"Convirtiendo PDF: {original_filename}")
            markdown_text, page_count, word_count, sections = convert_pdf_to_markdown(file_path)

        elif ext in [".docx", ".doc"]:
            logger.info(f"Convirtiendo Word: {original_filename}")
            markdown_text, page_count, word_count, sections = convert_docx_to_markdown(file_path)

        elif ext in [".txt", ".md", ".markdown"]:
            logger.info(f"Leyendo texto plano / Markdown: {original_filename}")
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                markdown_text = f.read()
            word_count = len(markdown_text.split())
            page_count = max(1, round(word_count / 350))
            sections = [
                line.lstrip("#").strip()
                for line in markdown_text.splitlines()
                if line.strip().startswith("#")
            ]

        else:
            raise ValueError(f"Formato no soportado: '{ext}'. Se aceptan .pdf, .docx, .doc, .txt, .md")

        # Generar fragmentación semántica en bloques de 300 a 600 palabras
        chunks = chunk_markdown_text(markdown_text)

        return {
            "filename": original_filename,
            "extension": ext,
            "page_count": page_count,
            "word_count": word_count,
            "markdown": markdown_text,
            "sections": sections,
            "chunk_count": len(chunks),
            "chunks": chunks
        }

