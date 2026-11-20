-- =============================================================================
-- Migración V31: Backfill de expedientes clínicos para pacientes existentes
-- Sucede a V30. Idempotente.
-- Crea un expediente mínimo (mismos defaults de SDD-EXP-ALTA-1) para todo
-- paciente que aún no tenga expediente (p. ej. pacientes dados de alta antes
-- de la creación automática en el alta).
-- =============================================================================

INSERT INTO expedientes_clinicos (
    id,
    paciente_id,
    terapeuta_asignado_id,
    motivo_consulta,
    estatus_expediente,
    modalidad,
    tipo_expediente,
    folio,
    fecha_inicio,
    fecha_apertura
)
SELECT
    'exp-' || substr(md5(p.id), 1, 8),
    p.id,
    p.terapeuta_id,
    'Pendiente de captura en primera consulta',
    'ACTIVO',
    'presencial',
    'electronico',
    'EXP-' || lpad(nextval('seq_expediente_folio')::text, 4, '0'),
    CURRENT_DATE,
    CURRENT_DATE
FROM pacientes p
LEFT JOIN expedientes_clinicos e ON e.paciente_id = p.id
WHERE e.id IS NULL;
