-- =============================================================================
-- Migración V29: Consistencia cita → terapeuta dueño del paciente
-- -----------------------------------------------------------------------------
-- Reasigna las citas cuyo terapeuta_id no coincide con el terapeuta asignado al
-- paciente (pacientes.terapeuta_id). Corrige citas de pac-003 (Emiliano) creadas
-- en runtime bajo ter-001, alineándolas con ter-002 (su terapeuta en V2/V6).
-- Idempotente: solo actualiza filas cuyo terapeuta difiere del dueño del paciente.
-- =============================================================================
UPDATE citas c
SET terapeuta_id = p.terapeuta_id,
    updated_at   = CURRENT_TIMESTAMP
FROM pacientes p
WHERE c.paciente_id = p.id
  AND p.terapeuta_id IS NOT NULL
  AND c.terapeuta_id IS DISTINCT FROM p.terapeuta_id;
