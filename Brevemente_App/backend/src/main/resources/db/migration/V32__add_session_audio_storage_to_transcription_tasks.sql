-- V32: Persistencia del audio original de la sesión clínica (referencia en BD, archivo en volumen del servidor)
ALTER TABLE transcription_tasks
    ADD COLUMN IF NOT EXISTS audio_storage_path   TEXT,
    ADD COLUMN IF NOT EXISTS audio_content_type   VARCHAR(100),
    ADD COLUMN IF NOT EXISTS audio_size_bytes     BIGINT;

CREATE INDEX IF NOT EXISTS idx_transcription_tasks_session_created
    ON transcription_tasks (session_id, created_at DESC);

