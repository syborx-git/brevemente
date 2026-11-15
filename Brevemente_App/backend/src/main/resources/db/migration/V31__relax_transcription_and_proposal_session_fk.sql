-- V31: Permitir que transcription_tasks y leva_clinical_proposals admitan IDs de sesiones clínicas (ses-*) además de citas
ALTER TABLE transcription_tasks DROP CONSTRAINT IF EXISTS transcription_tasks_session_id_fkey;
ALTER TABLE leva_clinical_proposals DROP CONSTRAINT IF EXISTS leva_clinical_proposals_cita_id_fkey;

