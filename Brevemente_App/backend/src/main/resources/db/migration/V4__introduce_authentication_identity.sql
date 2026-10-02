-- =============================================================================
-- Migración V4: Identidad y Autenticación Multi-rol (SDD-004 — Fase 3)
-- Separa IDENTIDAD (usuarios) del PERFIL PROFESIONAL (terapeutas).
-- Roles modelados como catálogo + relación M2M (usuario_roles) para multi-rol.
-- Sucede a V1, V2, V3. Idempotente. NO rompe FKs existentes.
-- =============================================================================

-- 1. Catálogo de roles ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id          VARCHAR(36)  PRIMARY KEY,
    codigo      VARCHAR(30)  NOT NULL,
    nombre      VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ux_roles_codigo UNIQUE (codigo)
);

INSERT INTO roles (id, codigo, nombre, descripcion) VALUES
    ('rol-001', 'admin_platform', 'Administrador Plataforma', 'Gestión global de la plataforma'),
    ('rol-002', 'admin_clinical',  'Administrador Clínico',   'Gestión operativa clínica'),
    ('rol-003', 'therapist',       'Terapeuta',               'Profesional clínico tratante'),
    ('rol-004', 'assistant',       'Asistente',               'Apoyo administrativo / secretarial'),
    ('rol-005', 'supervisor',      'Supervisor Clínico',      'Supervisión clínica de casos'),
    ('rol-006', 'patient',         'Paciente',                'Portal del paciente'),
    ('rol-007', 'student',         'Alumno',                  'Formación académica')
ON CONFLICT (codigo) DO NOTHING;

-- 2. Identidad / autenticación -------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id            VARCHAR(36)  PRIMARY KEY,
    email         VARCHAR(150) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,           -- BCrypt
    nombre        VARCHAR(100) NOT NULL,
    apellidos     VARCHAR(100) NOT NULL,
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unicidad case-insensitive del email (índice funcional único, sirve para login)
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_email_lower ON usuarios (LOWER(email));

-- 3. Relación M2M usuario <-> rol (multi-rol) ---------------------------------
CREATE TABLE IF NOT EXISTS usuario_roles (
    usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    rol_id     VARCHAR(36) NOT NULL REFERENCES roles(id)    ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, rol_id)
);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_rol ON usuario_roles (rol_id);

-- 4. Semilla de identidad (coherente con V2; se preservan honoríficos 'Dra.'/'Mtro.') --
--    password_hash = hash BCrypt de 'demo123' (generado en Fase 3).
INSERT INTO usuarios (id, email, password_hash, nombre, apellidos, activo) VALUES
    ('usr-001', 'sofia.ramirez@brevemente.org',    '$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2', 'Dra. Sofía',      'Ramírez Lozano', TRUE),
    ('usr-002', 'patricia.ortiz@brevemente.org',   '$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2', 'Patricia',        'Ortiz',          TRUE),
    ('usr-003', 'isabel.cardenas@brevemente.org',  '$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2', 'Isabel',          'Cárdenas',       TRUE),
    ('usr-004', 'alejandro.mendoza@brevemente.org','$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2', 'Mtro. Alejandro', 'Mendoza Garza',  TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. Asignación de roles (M2M) -------------------------------------------------
INSERT INTO usuario_roles (usuario_id, rol_id) VALUES
    ('usr-001', 'rol-003'),  -- therapist
    ('usr-002', 'rol-002'),  -- admin_clinical
    ('usr-003', 'rol-005'),  -- supervisor
    ('usr-004', 'rol-003'),  -- therapist (perfil tratante)
    ('usr-004', 'rol-005')   -- supervisor clínico (especialidad "Supervisión Clínica y TBE")
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

-- 6. Vincular perfil profesional -> identidad ---------------------------------
ALTER TABLE terapeutas ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(36);

-- 6a. Relink explícito de la semilla V2 (identidades coherentes con V2)
UPDATE terapeutas SET usuario_id = 'usr-001' WHERE id = 'ter-001' AND usuario_id IS NULL;
UPDATE terapeutas SET usuario_id = 'usr-004' WHERE id = 'ter-002' AND usuario_id IS NULL;

-- 6b. Backfill genérico: cualquier terapeuta sin identidad previa crea su usuario
--     (clave demo123; en onboarding se forzará el cambio de contraseña).
INSERT INTO usuarios (id, email, password_hash, nombre, apellidos, activo)
SELECT
    'usr-' || substr(md5(t.id), 1, 32),   -- 4 + 32 = 36 chars (id VARCHAR(36))
    t.email,
    '$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2',
    t.nombre,
    t.apellidos,
    COALESCE(t.activo, TRUE)
FROM terapeutas t
WHERE t.usuario_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM usuarios u WHERE LOWER(u.email) = LOWER(t.email))
ON CONFLICT DO NOTHING;   -- sin target: absorbe tanto colisión de PK (id) como de ux_usuarios_email_lower

UPDATE terapeutas t
SET usuario_id = (SELECT u.id FROM usuarios u WHERE LOWER(u.email) = LOWER(t.email))
WHERE t.usuario_id IS NULL;

-- 6b-bis. Backfill de roles: todo usuario nacido de un terapeuta recibe rol-003
--         (evita que los backfilleados queden sin authorities en el JWT).
INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT u.id, 'rol-003'
FROM usuarios u
JOIN terapeutas t ON t.usuario_id = u.id
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

-- 6c. Assert: no deben quedar terapeutas huérfanos antes de endurecer NOT NULL
DO $$
DECLARE
    hue BIGINT;
BEGIN
    SELECT COUNT(*) INTO hue FROM terapeutas WHERE usuario_id IS NULL;
    IF hue > 0 THEN
        RAISE EXCEPTION 'V4: existen % terapeutas sin usuario_id', hue;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'terapeutas' AND column_name = 'usuario_id' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE terapeutas ALTER COLUMN usuario_id SET NOT NULL;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_terapeutas_usuario_id ON terapeutas (usuario_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_terapeutas_usuario') THEN
        ALTER TABLE terapeutas
            ADD CONSTRAINT fk_terapeutas_usuario
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- 7. El perfil deja de almacenar identidad ------------------------------------
ALTER TABLE terapeutas
    DROP COLUMN IF EXISTS email,
    DROP COLUMN IF EXISTS nombre,
    DROP COLUMN IF EXISTS apellidos;

CREATE UNIQUE INDEX IF NOT EXISTS ux_terapeutas_cedula
    ON terapeutas (cedula_profesional) WHERE cedula_profesional IS NOT NULL;

-- 8. Auditoría apunta a la identidad (con índice de soporte) -------------------
--    Precondición: en la cadena fresca V1→V2→V3→V4, auditoria_accesos está vacía
--    (V1 no tiene escritor en el backend actual). Se valida defensivamente:
DO $$
DECLARE
    hue BIGINT;
BEGIN
    SELECT COUNT(*) INTO hue
    FROM auditoria_accesos a
    WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.id = a.usuario_id);
    IF hue > 0 THEN
        RAISE EXCEPTION 'V4: existen % filas de auditoria_accesos con usuario_id huérfano', hue;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_auditoria_usuario') THEN
        ALTER TABLE auditoria_accesos
            ADD CONSTRAINT fk_auditoria_usuario
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_accesos (usuario_id);
