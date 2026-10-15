-- =============================================================================
-- Migración V16: Supervisor de solo lectura en Mi Consulta
-- Sucede a V15. Idempotente.
-- -----------------------------------------------------------------------------
-- El supervisor conserva MI_CONSULTA_LEER (vigilancia), pero pierde
-- MI_CONSULTA_EDITAR: la configuración del terapeuta solo la edita el propio
-- terapeuta o un administrador.
-- =============================================================================

DELETE FROM rol_permisos
WHERE rol_id = 'rol-005' AND permiso_id = 'perm-023';
