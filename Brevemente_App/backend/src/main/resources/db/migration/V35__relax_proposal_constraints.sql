-- V35: Permitir firma digital en reviewed_by_id y relajar restricciones FK para LEVA Copilot
-- 1. Eliminar la restricción de clave foránea en reviewed_by_id (permite registrar firma digital oficial con cédula profesional)
ALTER TABLE leva_clinical_proposals DROP CONSTRAINT IF EXISTS leva_clinical_proposals_reviewed_by_id_fkey;

-- 2. Ampliar el tamaño de reviewed_by_id para soportar nombre completo, título y cédula profesional (NOM-004-SSA3-2012)
ALTER TABLE leva_clinical_proposals ALTER COLUMN reviewed_by_id TYPE VARCHAR(255);

-- 3. Relajar restricciones de claves foráneas de cita_id, terapeuta_id y paciente_id en leva_clinical_proposals
ALTER TABLE leva_clinical_proposals DROP CONSTRAINT IF EXISTS leva_clinical_proposals_cita_id_fkey;
ALTER TABLE leva_clinical_proposals DROP CONSTRAINT IF EXISTS leva_clinical_proposals_terapeuta_id_fkey;
ALTER TABLE leva_clinical_proposals DROP CONSTRAINT IF EXISTS leva_clinical_proposals_paciente_id_fkey;
ALTER TABLE leva_clinical_proposals ALTER COLUMN cita_id TYPE VARCHAR(100);
ALTER TABLE leva_clinical_proposals ALTER COLUMN terapeuta_id TYPE VARCHAR(100);
ALTER TABLE leva_clinical_proposals ALTER COLUMN paciente_id TYPE VARCHAR(100);

-- 4. Relajar claves foráneas en transcription_tasks para máxima compatibilidad con sesiones en tiempo real
ALTER TABLE transcription_tasks DROP CONSTRAINT IF EXISTS transcription_tasks_session_id_fkey;
ALTER TABLE transcription_tasks DROP CONSTRAINT IF EXISTS transcription_tasks_terapeuta_id_fkey;
ALTER TABLE transcription_tasks DROP CONSTRAINT IF EXISTS transcription_tasks_paciente_id_fkey;
ALTER TABLE transcription_tasks ALTER COLUMN session_id TYPE VARCHAR(100);
ALTER TABLE transcription_tasks ALTER COLUMN terapeuta_id TYPE VARCHAR(100);
ALTER TABLE transcription_tasks ALTER COLUMN paciente_id TYPE VARCHAR(100);

