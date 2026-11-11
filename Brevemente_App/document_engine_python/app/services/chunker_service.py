import re
from typing import List, Dict, Any


def chunk_markdown_text(
    markdown_text: str,
    min_words: int = 300,
    max_words: int = 600
) -> List[Dict[str, Any]]:
    """
    Divide un documento Markdown en bloques semánticos coherentes de entre 300 y 600 palabras.
    Respeta encabezados Markdown (#, ##, ###) y párrafos para no romper tablas ni criterios clínicos.
    """
    if not markdown_text or not markdown_text.strip():
        return []

    # Dividir el documento por encabezados o bloques de doble salto de línea
    sections_raw = re.split(r'\n(?=#{1,4}\s)', markdown_text)
    chunks: List[Dict[str, Any]] = []

    current_chunk_lines: List[str] = []
    current_word_count = 0
    current_title = "Introducción / Generalidades"
    chunk_index = 0

    for section in sections_raw:
        section = section.strip()
        if not section:
            continue

        # Extraer el título del encabezado si existe
        header_match = re.match(r'^#{1,4}\s+(.+)', section)
        if header_match:
            detected_title = header_match.group(1).strip()
        else:
            detected_title = current_title

        section_words = len(section.split())

        # Si agregar esta sección excede el tamaño máximo y ya tenemos contenido suficiente
        if current_word_count + section_words > max_words and current_word_count >= min_words:
            # Emitir chunk actual
            chunk_content = "\n\n".join(current_chunk_lines).strip()
            chunks.append({
                "chunk_index": chunk_index,
                "title": current_title,
                "content": chunk_content,
                "word_count": len(chunk_content.split())
            })
            chunk_index += 1
            current_chunk_lines = [section]
            current_word_count = section_words
            current_title = detected_title
        else:
            current_chunk_lines.append(section)
            current_word_count += section_words
            if not current_title or current_title == "Introducción / Generalidades":
                current_title = detected_title

    # Emitir el último chunk residual si contiene texto
    if current_chunk_lines:
        chunk_content = "\n\n".join(current_chunk_lines).strip()
        if chunk_content:
            chunks.append({
                "chunk_index": chunk_index,
                "title": current_title,
                "content": chunk_content,
                "word_count": len(chunk_content.split())
            })

    return chunks

