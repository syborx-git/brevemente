-- =============================================================================
-- Migración V5: Permisos granulares (PBAC), usuario Administrador y seguridad (SDD-005)
-- - Catálogo `permisos` + M2M `rol_permisos` (los permisos se agregan por rol).
-- - `usuarios.token_version`: revocación inmediata de access tokens (logout,
--   desactivación, cambio de permisos, robo de refresh token).
-- - `refresh_tokens`: refresh tokens opacos, almacenados como hash SHA-256,
--   con rotación y detección de reutilización.
-- - `auditoria_accesos.usuario_id` pasa a NULLABLE para auditar intentos
--   fallidos con correos inexistentes (la FK a usuarios se conserva).
-- - Usuario de pruebas Administrador con rol admin_platform y todos los permisos.
-- Sucede a V1..V4. Idempotente.
-- =============================================================================

-- 1. Catálogo de permisos ------------------------------------------------------
CREATE TABLE IF NOT EXISTS permisos (
    id          VARCHAR(36)  PRIMARY KEY,
    codigo      VARCHAR(50)  NOT NULL,
    modulo      VARCHAR(50)  NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ux_permisos_codigo UNIQUE (codigo)
);

-- 2. Relación M2M rol <-> permiso ----------------------------------------------
CREATE TABLE IF NOT EXISTS rol_permisos (
    rol_id     VARCHAR(36) NOT NULL REFERENCES roles(id)    ON DELETE CASCADE,
    permiso_id VARCHAR(36) NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
);
CREATE INDEX IF NOT EXISTS idx_rol_permisos_permiso ON rol_permisos (permiso_id);

-- 3. Versión de token para revocación ------------------------------------------
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 1;

-- 4. Refresh tokens (solo se guarda el hash, nunca el valor en claro) ----------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          VARCHAR(36)  PRIMARY KEY,
    usuario_id  VARCHAR(36)  NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64)  NOT NULL,              -- SHA-256 en hex
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at  TIMESTAMP WITH TIME ZONE,
    replaced_by VARCHAR(36),
    created_ip  VARCHAR(64),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ux_refresh_tokens_hash UNIQUE (token_hash)
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario ON refresh_tokens (usuario_id);

-- 5. Auditoría: permitir intentos fallidos sin identidad resuelta --------------
ALTER TABLE auditoria_accesos ALTER COLUMN usuario_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_auditoria_accion_fecha ON auditoria_accesos (accion, created_at);

-- 6. Semilla de permisos granulares (PBAC escalable) ---------------------------
INSERT INTO permisos (id, codigo, modulo, descripcion) VALUES
    ('perm-001', 'PACIENTES_LEER',        'PACIENTES',   'Ver directorio y ficha de pacientes'),
    ('perm-002', 'PACIENTES_CREAR',       'PACIENTES',   'Registrar nuevos pacientes'),
    ('perm-003', 'PACIENTES_EDITAR',      'PACIENTES',   'Modificar datos demográficos, estatus y consentimiento'),
    ('perm-004', 'PACIENTES_ELIMINAR',    'PACIENTES',   'Archivar o deshabilitar pacientes'),
    ('perm-005', 'EXPEDIENTE_LEER',       'EXPEDIENTE',  'Consultar historial, notas de evolución y sesiones'),
    ('perm-006', 'EXPEDIENTE_ESCRIBIR',   'EXPEDIENTE',  'Crear notas de evolución y actualizar el plan'),
    ('perm-007', 'EXPEDIENTE_FIRMAR',     'EXPEDIENTE',  'Firmar notas y cierres clínicos'),
    ('perm-008', 'AGENDA_GESTIONAR',      'AGENDA',      'Agendar, reprogramar o cancelar citas'),
    ('perm-009', 'SUPERVISION_LEER',      'SUPERVISION', 'Consultar casos y métricas de terapeutas supervisados'),
    ('perm-010', 'SUPERVISION_EVALUAR',   'SUPERVISION', 'Aprobar notas y emitir recomendaciones'),
    ('perm-011', 'ADMIN_USUARIOS',        'SISTEMA',     'Gestión de identidades, roles y accesos'),
    ('perm-012', 'DASHBOARD_LEER',        'DASHBOARD',   'Acceso al panel principal y métricas clínicas'),
    ('perm-013', 'MI_CONSULTA_LEER',      'CONSULTA',    'Acceso al módulo de mi consulta y expedientes personales'),
    ('perm-014', 'LEVA_USAR',             'IA',          'Uso del asistente clínico LEVA'),
    ('perm-015', 'REPORTES_VER',          'REPORTES',    'Generación y visualización de reportes analíticos'),
    ('perm-016', 'CONFIGURACION_SISTEMA', 'SISTEMA',     'Configuración global y parámetros de la plataforma')
ON CONFLICT (codigo) DO NOTHING;

-- 7. Matriz rol -> permisos ----------------------------------------------------
-- therapist (rol-003)
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-003', id FROM permisos WHERE codigo IN (
    'PACIENTES_LEER', 'PACIENTES_CREAR', 'PACIENTES_EDITAR',
    'EXPEDIENTE_LEER', 'EXPEDIENTE_ESCRIBIR', 'EXPEDIENTE_FIRMAR',
    'AGENDA_GESTIONAR', 'DASHBOARD_LEER', 'MI_CONSULTA_LEER', 'LEVA_USAR')
ON CONFLICT DO NOTHING;

-- supervisor (rol-005)
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-005', id FROM permisos WHERE codigo IN (
    'PACIENTES_LEER', 'EXPEDIENTE_LEER', 'SUPERVISION_LEER', 'SUPERVISION_EVALUAR',
    'DASHBOARD_LEER', 'MI_CONSULTA_LEER', 'LEVA_USAR', 'REPORTES_VER')
ON CONFLICT DO NOTHING;

-- assistant (rol-004): operación administrativa, sin acceso a contenido clínico ni notas
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-004', id FROM permisos WHERE codigo IN (
    'PACIENTES_LEER', 'PACIENTES_CREAR', 'AGENDA_GESTIONAR', 'DASHBOARD_LEER')
ON CONFLICT DO NOTHING;

-- admin_clinical (rol-002): gestión clínica y operativa
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-002', id FROM permisos WHERE codigo IN (
    'PACIENTES_LEER', 'PACIENTES_CREAR', 'PACIENTES_EDITAR',
    'AGENDA_GESTIONAR', 'SUPERVISION_LEER', 'DASHBOARD_LEER',
    'MI_CONSULTA_LEER', 'LEVA_USAR', 'REPORTES_VER')
ON CONFLICT DO NOTHING;

-- admin_platform (rol-001): TODOS los permisos actuales y futuros
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-001', id FROM permisos
ON CONFLICT DO NOTHING;

-- 8. Semilla de Usuario Administrador para Pruebas -----------------------------
-- Clave: demo123 (hash BCrypt con costo 10)
INSERT INTO usuarios (id, email, password_hash, nombre, apellidos, activo, token_version) VALUES
    ('usr-admin', 'admin@brevemente.org', '$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2', 'Administrador', 'Plataforma BreveMente', TRUE, 1)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    activo = TRUE;

-- Asignación de rol admin_platform (rol-001) al usuario administrador
INSERT INTO usuario_roles (usuario_id, rol_id) VALUES
    ('usr-admin', 'rol-001')
ON CONFLICT (usuario_id, rol_id) DO NOTHING;
