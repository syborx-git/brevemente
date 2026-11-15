import logging
from typing import Tuple, List
import mammoth
from docx import Document

logger = logging.getLogger("document_engine.docx")


def convert_docx_to_markdown(file_path: str) -> Tuple[str, int, int, List[str]]:
    """
    Convierte de forma determinista un documento Word (.docx) a Markdown estructurado con tablas,
    respetando encabezados y jerarquías clínicas.
    """
    markdown_text = ""

    # 1. Intentar conversión con Mammoth (convierte tablas a Markdown y respeta negritas/listas)
    try:
        with open(file_path, "rb") as docx_file:
            result = mammoth.convert_to_markdown(docx_file)
            markdown_text = result.value
            if result.messages:
                for msg in result.messages:
                    logger.debug(f"[Mammoth] {msg}")
    except Exception as ex:
        logger.warn(f"Mammoth falló ({ex}), aplicando extractor determinista python-docx...")

    # 2. Fallback con python-docx si mammoth no produjo contenido
    if not markdown_text or len(markdown_text.strip()) < 30:
        try:
            doc = Document(file_path)
            lines = []

            for p in doc.paragraphs:
                text = p.text.strip()
                if not text:
                    continue
                if p.style and p.style.name.startswith("Heading 1"):
                    lines.append(f"# {text}")
                elif p.style and p.style.name.startswith("Heading 2"):
                    lines.append(f"## {text}")
                elif p.style and p.style.name.startswith("Heading 3"):
                    lines.append(f"### {text}")
                else:
                    lines.append(text)

            # Extraer tablas a sintaxis Markdown | Col | Col |
            for table in doc.tables:
                rows_md = []
                for row_idx, row in enumerate(table.rows):
                    cells = [cell.text.replace("\n", " ").strip() for cell in row.cells]
                    row_line = "| " + " | ".join(cells) + " |"
                    rows_md.append(row_line)
                    if row_idx == 0:
                        separator = "| " + " | ".join(["---"] * len(cells)) + " |"
                        rows_md.append(separator)

                if rows_md:
                    lines.append("\n" + "\n".join(rows_md) + "\n")

            markdown_text = "\n\n".join(lines)
        except Exception as docx_ex:
            logger.warn(f"python-docx no pudo procesar ({docx_ex}). Intentando extractor binario defensivo para .doc legacy...")
            try:
                with open(file_path, "rb") as bf:
                    raw_bytes = bf.read()
                # Extracción defensiva de bloques de texto legibles en UTF-8 / UTF-16LE / Latin-1
                extracted_lines = []
                for encoding in ["utf-8", "utf-16le", "latin-1"]:
                    try:
                        decoded = raw_bytes.decode(encoding, errors="ignore")
                        candidates = [
                            line.strip() for line in decoded.splitlines()
                            if len(line.strip()) > 3 and any(c.isalnum() for c in line)
                        ]
                        if len(candidates) > len(extracted_lines):
                            extracted_lines = candidates
                    except Exception:
                        continue

                if extracted_lines:
                    markdown_text = "\n\n".join(extracted_lines)
                else:
                    markdown_text = f"Error al procesar documento Word: {docx_ex}"
            except Exception as bin_ex:
                logger.error(f"Error en extractor binario .doc: {bin_ex}")
                markdown_text = f"Error al procesar documento Word: {docx_ex}"

    # Estimar conteo de palabras y páginas
    words = len(markdown_text.split())
    estimated_pages = max(1, round(words / 350))

    # Detectar secciones
    sections = []
    for line in markdown_text.splitlines():
        trimmed = line.strip()
        if trimmed.startswith("#"):
            section_title = trimmed.lstrip("#").strip()
            if section_title and section_title not in sections:
                sections.append(section_title)

    return markdown_text, estimated_pages, words, sections

