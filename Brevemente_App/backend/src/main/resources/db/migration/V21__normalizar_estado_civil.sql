-- =============================================================================
-- Migración V21: Normalización de estado_civil (valores legibles)
-- Sucede a V20. Idempotente. NO modifica V20 (checksum estable).
-- =============================================================================

UPDATE pacientes SET estado_civil = 'Soltero'     WHERE id = 'pac-001' AND estado_civil = 'soltero';
UPDATE pacientes SET estado_civil = 'Unión libre' WHERE id = 'pac-002' AND estado_civil = 'union_libre';
