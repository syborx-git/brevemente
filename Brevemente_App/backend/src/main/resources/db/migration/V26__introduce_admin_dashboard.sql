-- =============================================================================
-- Migración V26: Vista Admin — Dashboard de Plataforma (permiso + índices)
-- - Crea el permiso ADMIN_DASHBOARD_LEER (perm-026) y lo otorga a rol-001.
-- - Índices de actividad para el dashboard (accesos y usuarios recientes).
-- Sucede a V1..V25. Idempotente.
-- =============================================================================

-- 1. Permiso del dashboard de plataforma --------------------------------------
INSERT INTO permisos (id, codigo, modulo, descripcion) VALUES
    ('perm-026', 'ADMIN_DASHBOARD_LEER', 'ADMIN',
     'Acceso al dashboard de plataforma (métricas y actividad global)')
ON CONFLICT (codigo) DO NOTHING;

-- 2. Otorgar a admin_platform (rol-001) ---------------------------------------
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-001', id FROM permisos WHERE codigo = 'ADMIN_DASHBOARD_LEER'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

-- 3. Índices de actividad del dashboard ---------------------------------------
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria_accesos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usuarios_created_at    ON usuarios (created_at DESC);
