-- =============================================================================
-- Migración V26: Fragmentación Semántica de Corpus (Chunks), Almacenamiento en Disco y Embeddings
-- Implementa la partición en bloques lógicos (300-600 palabras) para RAG cerrado en LEVA.
-- =============================================================================

-- 1. Intentar activar pgvector si la extensión está presente en el servidor PostgreSQL
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pgvector extension no disponible en este entorno, utilizando fallback de embeddings JSONB';
END $$;

-- 2. Añadir campos de almacenamiento de archivo en disco en clinical_corpus_documents
ALTER TABLE clinical_corpus_documents
    ADD COLUMN IF NOT EXISTS file_storage_path VARCHAR(500),
    ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);

-- 3. Tabla de Fragmentos Semánticos (Chunks de 300 a 600 palabras)
CREATE TABLE IF NOT EXISTS clinical_corpus_chunks (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL REFERENCES clinical_corpus_documents(id) ON DELETE CASCADE,
    protocol_code VARCHAR(50),
    chunk_index INT NOT NULL,
    title VARCHAR(200),
    content TEXT NOT NULL,
    word_count INT NOT NULL DEFAULT 0,
    embedding JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_corpus_chunks_doc   ON clinical_corpus_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_corpus_chunks_proto ON clinical_corpus_chunks(protocol_code);
CREATE INDEX IF NOT EXISTS idx_corpus_chunks_idx   ON clinical_corpus_chunks(document_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_corpus_chunks_title ON clinical_corpus_chunks(title);

-- 4. Semilla de Chunks para los Protocolos TBE Iniciales (corp-tbe-001, 002, 003)
INSERT INTO clinical_corpus_chunks (id, document_id, protocol_code, chunk_index, title, content, word_count)
VALUES
(
    'chk-tbe-001-1',
    'corp-tbe-001',
    'TBE-PANICO-001',
    0,
    'Ataque de Pánico: SPR y Tentativas Redundantes',
    'OBJETIVO: Interrumpir la tentativa de solución redundante de evitación y control que hace perder el control. SISTEMA PERCEPTIVO-REACTIVO: Fóbico. El sujeto intenta controlar sus reacciones fisiológicas espontáneas, lo que provoca una escalada simbiótica hacia el pánico. TENTATIVAS DE SOLUCIÓN COMUNES: 1) Evitación sistemática de situaciones y lugares. 2) Búsqueda continua de ayuda y acompañamiento. 3) Hipervigilancia de sensaciones somáticas.',
    60
),
(
    'chk-tbe-001-2',
    'corp-tbe-001',
    'TBE-PANICO-001',
    1,
    'Ataque de Pánico: Prescripciones TBE (La Peor Fantasía)',
    'ESTRATAGEMA TBE: Apagar el fuego añadiendo leña. ESTRATAGEMA DE DIÁLOGO: Reestructuración analógica de la trampa del control. PRESCRIPCIONES: 1) La Peor Fantasía: Cada media hora programada, colocarse en una habitación a oscuras y esforzarse activamente en convocar los peores miedos durante 30 minutos cronometrados. Si se busca el miedo voluntariamente, este se desvanece. 2) Diario de a Bordo: Anotar en libreta cada episodio con hora, lugar y sensación somática en el momento exacto.',
    78
),
(
    'chk-tbe-002-1',
    'corp-tbe-002',
    'TBE-TOC-002',
    0,
    'TOC: SPR y Tentativas de Control de la Duda',
    'OBJETIVO: Quebrar la lógica del ritual y la duda patológica. SISTEMA PERCEPTIVO-REACTIVO: Obsesivo-compulsivo. El sujeto cree que mediante la acción ritualizada previene catástrofes o tranquiliza la duda obsesiva. TENTATIVAS DE SOLUCIÓN: 1) Ejecución repetitiva de rituales de control o limpieza. 2) Implicación y delegación en familiares para confirmar certezas.',
    55
),
(
    'chk-tbe-002-2',
    'corp-tbe-002',
    'TBE-TOC-002',
    1,
    'TOC: Prescripciones Estratégicas (Violación del Ritual)',
    'ESTRATAGEMA TBE: Vencer sin combatir; introducir una pequeña infracción que altere la secuencia del ritual. PRESCRIPCIONES: 1) Si lo haces una vez, debes hacerlo cinco veces exactas: transformar el ritual preventivo en una obligación penosa y agobiante. 2) La pequeña transgresión diaria deliberada.',
    47
)
ON CONFLICT (id) DO NOTHING;

