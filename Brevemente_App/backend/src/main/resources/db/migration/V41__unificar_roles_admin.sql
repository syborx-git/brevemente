-- =============================================================================
-- V41: Unificación de roles admin + onboarding de identidad clínica (SDOP)
-- Sucede a V40. Idempotente.
-- =============================================================================

-- 0. Crear permisos de sedes y visión global (no existían) ---------------------
INSERT INTO permisos (id, codigo, modulo, descripcion) VALUES
    ('perm-027', 'SEDES_LEER',        'SISTEMA', 'Ver sedes de atención'),
    ('perm-028', 'SEDES_GESTIONAR',   'SISTEMA', 'Gestionar sedes de atención'),
    ('perm-031', 'VISION_GLOBAL_LEER','SISTEMA', 'Ver la información global de la plataforma (auditoría)')
ON CONFLICT (codigo) DO NOTHING;

-- 1. Reasignar usuarios admin_clinical → admin_platform y eliminar rol-002 ------
INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT ur.usuario_id, 'rol-001' FROM usuario_roles ur WHERE ur.rol_id = 'rol-002'
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

DELETE FROM usuario_roles WHERE rol_id = 'rol-002';
DELETE FROM rol_permisos  WHERE rol_id = 'rol-002';
DELETE FROM roles         WHERE id = 'rol-002';

-- 1b. Eliminar el rol student (D-11) -------------------------------------------
DELETE FROM usuario_roles WHERE rol_id = 'rol-007';
DELETE FROM rol_permisos  WHERE rol_id = 'rol-007';
DELETE FROM roles         WHERE id = 'rol-007';

-- 2. Redefinir permisos del rol admin_platform: solo plataforma ----------------
DELETE FROM rol_permisos WHERE rol_id = 'rol-001';
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-001', id FROM permisos WHERE codigo IN (
    'ADMIN_USUARIOS', 'ADMIN_DASHBOARD_LEER', 'CONFIGURACION_SISTEMA',
    'REPORTES_VER', 'SEDES_LEER', 'SEDES_GESTIONAR', 'DASHBOARD_LEER', 'LEVA_USAR',
    'PAGOS_LEER', 'PAGOS_GESTIONAR', 'CONSTANCIAS_EMITIR', 'ALERTAS_GESTIONAR',
    'VISION_GLOBAL_LEER')
ON CONFLICT DO NOTHING;

-- 3. Forzar re-login de los administradores (roles cambiaron) ------------------
UPDATE usuarios SET token_version = token_version + 1
 WHERE id IN (SELECT DISTINCT usuario_id FROM usuario_roles WHERE rol_id = 'rol-001');
