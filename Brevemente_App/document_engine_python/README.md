# Brevemente - Document Engine (Microservicio de Conversión a Markdown)

Microservicio ligero y determinista para transformar protocolos y manuales clínicos (`.pdf`, `.docx`, `.doc`, `.txt`) a formato **Markdown estructurado (`.md`)** respetando tablas, columnas y encabezados sin intervención ni alucinaciones de IA.

## Principio de Responsabilidad Única (SRP)
- **`transcript_engine_python`**: Exclusivamente audio (`faster-whisper`), señales y transcripción de voz.
- **`document_engine_python`**: Exclusivamente conversión de documentos estructurados a Markdown y fragmentación semántica (300-600 palabras).

## Tecnologías
- **Python 3.11+ / FastAPI**
- **PyMuPDF4LLM**: Extracción de alta fidelidad de tablas y estructura desde PDF a Markdown.
- **Mammoth & python-docx**: Extracción determinista de Word (.docx) a Markdown tabular.

## Endpoints
- `GET /v1/health`: Estado de salud del microservicio.
- `POST /v1/convert`: Carga multipart de archivo y retorno de Markdown con conteo de palabras, páginas y chunks.
- `POST /v1/chunk`: Fragmentación semántica en bloques de 300-600 palabras.

