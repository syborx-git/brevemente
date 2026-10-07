-- =============================================================================
-- Migración V6: Esquema Agenda/Citas (SDOP) — SDD-002 v2.0.0
-- Sucede a V1..V5. Idempotente.
-- =============================================================================

-- 1. Extender citas ------------------------------------------------------------
ALTER TABLE citas
    ADD COLUMN IF NOT EXISTS tipo_cita        VARCHAR(20) NOT NULL DEFAULT 'primera',
    ADD COLUMN IF NOT EXISTS duracion_minutos INT         NOT NULL DEFAULT 30,
    ADD COLUMN IF NOT EXISTS payment_status   VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    ADD COLUMN IF NOT EXISTS consultorio      VARCHAR(10),
    ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE citas ALTER COLUMN estado_cita SET DEFAULT 'pendiente';
UPDATE citas SET estado_cita = 'pendiente' WHERE estado_cita = 'PROGRAMADA';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_citas_tipo_cita' AND t.relname = 'citas') THEN
        ALTER TABLE citas ADD CONSTRAINT ck_citas_tipo_cita
            CHECK (tipo_cita IN ('primera','seguimiento','cierre'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_citas_duracion' AND t.relname = 'citas') THEN
        ALTER TABLE citas ADD CONSTRAINT ck_citas_duracion
            CHECK (duracion_minutos IN (30,45,60));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_citas_payment' AND t.relname = 'citas') THEN
        ALTER TABLE citas ADD CONSTRAINT ck_citas_payment
            CHECK (payment_status IN ('pagada','pendiente','exenta'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_citas_consultorio' AND t.relname = 'citas') THEN
        ALTER TABLE citas ADD CONSTRAINT ck_citas_consultorio
            CHECK (consultorio IN ('A','B'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_citas_modalidad' AND t.relname = 'citas') THEN
        ALTER TABLE citas ADD CONSTRAINT ck_citas_modalidad
            CHECK (modalidad IN ('PRESENCIAL','ONLINE'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_citas_estado' AND t.relname = 'citas') THEN
        ALTER TABLE citas ADD CONSTRAINT ck_citas_estado
            CHECK (estado_cita IN ('confirmada','pendiente','completada','cancelada',
                                   'ausente','no_presentado','solicita_reagendar'));
    END IF;
END $$;

-- Índices de soporte a la detección de solapamiento (terapeuta y paciente)
CREATE INDEX IF NOT EXISTS idx_citas_terapeuta_fecha ON citas (terapeuta_id, fecha_hora_inicio);
CREATE INDEX IF NOT EXISTS idx_citas_paciente_fecha  ON citas (paciente_id,  fecha_hora_inicio);

-- 2. Nueva tabla dias_no_laborables --------------------------------------------
CREATE TABLE IF NOT EXISTS dias_no_laborables (
    id           VARCHAR(36) PRIMARY KEY,
    fecha        DATE NOT NULL,
    nombre       VARCHAR(100),
    tipo         VARCHAR(20) NOT NULL DEFAULT 'personal',
    terapeuta_id VARCHAR(36) REFERENCES terapeutas(id) ON DELETE CASCADE,  -- NULL ⇒ festivo oficial/global; días personales mueren con el terapeuta
    created_by   VARCHAR(36) REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_dias_no_laborables_tipo CHECK (tipo IN ('oficial','personal'))
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_dias_no_laborables_coherencia' AND t.relname = 'dias_no_laborables') THEN
        ALTER TABLE dias_no_laborables ADD CONSTRAINT ck_dias_no_laborables_coherencia
            CHECK ((tipo = 'personal' AND terapeuta_id IS NOT NULL)
                OR (tipo = 'oficial'  AND terapeuta_id IS NULL));
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_dias_no_laborables_oficial
    ON dias_no_laborables (fecha) WHERE tipo = 'oficial';
CREATE UNIQUE INDEX IF NOT EXISTS ux_dias_no_laborables_personal
    ON dias_no_laborables (terapeuta_id, fecha) WHERE tipo = 'personal';

-- Festivos oficiales 2026 (solo lectura)
INSERT INTO dias_no_laborables (id, fecha, nombre, tipo) VALUES
    ('hol-1', '2026-01-01', 'Año Nuevo',                    'oficial'),
    ('hol-2', '2026-02-02', 'Día de la Constitución',       'oficial'),
    ('hol-3', '2026-03-16', 'Natalicio de Benito Juárez',   'oficial'),
    ('hol-4', '2026-05-01', 'Día del Trabajo',              'oficial'),
    ('hol-5', '2026-09-16', 'Día de la Independencia',      'oficial'),
    ('hol-6', '2026-11-16', 'Día de la Revolución',         'oficial'),
    ('hol-7', '2026-12-25', 'Navidad',                      'oficial')
ON CONFLICT DO NOTHING;

-- 3. Semilla de citas (ids deterministas) --------------------------------------
-- Coherencia con la regla "Bloqueada por Normativa": pac-001 (menor) queda sin
-- consentimiento firmado para poder demostrar el bloqueo normativo en la agenda.
-- cit-001 es histórica (confirmada antes de la revocación); cit-002 y cit-005
-- demuestran el bloqueo normativo (pendiente + bloqueada_por_normativa = TRUE).
UPDATE pacientes SET consentimiento_representante_firmado = FALSE WHERE id = 'pac-001';

INSERT INTO citas (id, paciente_id, terapeuta_id, expediente_id,
                   fecha_hora_inicio, fecha_hora_fin, tipo_cita, modalidad,
                   estado_cita, duracion_minutos, consultorio, payment_status,
                   bloqueada_por_normativa)
VALUES
    ('cit-001','pac-001','ter-001','exp-001',
     '2026-10-07T09:00:00-06:00','2026-10-07T09:30:00-06:00','primera','PRESENCIAL',
     'confirmada',30,'A','pendiente',FALSE),
    ('cit-002','pac-001','ter-001','exp-001',
     '2026-10-07T10:00:00-06:00','2026-10-07T10:45:00-06:00','seguimiento','ONLINE',
     'pendiente',45,NULL,'pendiente',TRUE),
    ('cit-003','pac-003','ter-002',NULL,
     '2026-10-07T11:00:00-06:00','2026-10-07T11:30:00-06:00','primera','PRESENCIAL',
     'confirmada',30,'B','pendiente',FALSE),
    ('cit-004','pac-004','ter-002',NULL,
     '2026-10-07T12:00:00-06:00','2026-10-07T13:00:00-06:00','seguimiento','PRESENCIAL',
     'completada',60,'B','pagada',FALSE),
    ('cit-005','pac-001','ter-001','exp-001',
     '2026-10-08T09:00:00-06:00','2026-10-08T09:45:00-06:00','seguimiento','PRESENCIAL',
     'pendiente',45,'A','pendiente',TRUE),
    ('cit-006','pac-003','ter-002',NULL,
     '2026-10-08T10:00:00-06:00','2026-10-08T10:30:00-06:00','primera','ONLINE',
     'cancelada',30,NULL,'pendiente',FALSE)
ON CONFLICT (id) DO NOTHING;

-- 4. Identidad, asignaciones y permisos ----------------------------------------
-- 4.1 Vínculo paciente ↔ usuario
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(36);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'fk_pacientes_usuario' AND t.relname = 'pacientes') THEN
        ALTER TABLE pacientes
            ADD CONSTRAINT fk_pacientes_usuario
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_pacientes_usuario_id
    ON pacientes (usuario_id) WHERE usuario_id IS NOT NULL;

-- 4.2 Usuarios patient (demo123) + rol-006 + vínculo
INSERT INTO usuarios (id, email, password_hash, nombre, apellidos, activo, token_version) VALUES
    ('usr-pac-001','contacto.mateo@familia.mx',    '$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2','Mateo','Herrera Santos',TRUE,1),
    ('usr-pac-002','valeria.gomez@empresa.mx',     '$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2','Valeria','Gómez Fuentes',TRUE,1),
    ('usr-pac-003','emiliano.diaz@universidad.mx', '$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2','Emiliano','Díaz Corona',TRUE,1),
    ('usr-pac-004','roberto.valdes@email.com',     '$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2','Roberto','Valdés Garza',TRUE,1)
ON CONFLICT DO NOTHING;

INSERT INTO usuario_roles (usuario_id, rol_id) VALUES
    ('usr-pac-001','rol-006'),
    ('usr-pac-002','rol-006'),
    ('usr-pac-003','rol-006'),
    ('usr-pac-004','rol-006')
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

-- Verificación: los 4 usuarios patient deben existir (si un email colisionara,
-- el INSERT anterior se omitiría y el UPDATE violaría la FK).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM (VALUES ('usr-pac-001'),('usr-pac-002'),('usr-pac-003'),('usr-pac-004')) AS v(id)
        WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.id = v.id)
    ) THEN
        RAISE EXCEPTION 'V6: seed de usuarios patient incompleto (posible colisión de email)';
    END IF;
END $$;

UPDATE pacientes SET usuario_id = 'usr-pac-001' WHERE id = 'pac-001' AND usuario_id IS NULL;
UPDATE pacientes SET usuario_id = 'usr-pac-002' WHERE id = 'pac-002' AND usuario_id IS NULL;
UPDATE pacientes SET usuario_id = 'usr-pac-003' WHERE id = 'pac-003' AND usuario_id IS NULL;
UPDATE pacientes SET usuario_id = 'usr-pac-004' WHERE id = 'pac-004' AND usuario_id IS NULL;

-- 4.3 Asignaciones asistente ↔ terapeuta (N:M)
CREATE TABLE IF NOT EXISTS asignaciones_terapeuta (
    usuario_id   VARCHAR(36) NOT NULL REFERENCES usuarios(id)   ON DELETE CASCADE,
    terapeuta_id VARCHAR(36) NOT NULL REFERENCES terapeutas(id) ON DELETE CASCADE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, terapeuta_id)
);
CREATE INDEX IF NOT EXISTS idx_asignaciones_terapeuta_terapeuta
    ON asignaciones_terapeuta (terapeuta_id);

INSERT INTO usuarios (id, email, password_hash, nombre, apellidos, activo, token_version) VALUES
    ('usr-asist-001','asistente.agenda@brevemente.org','$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2','Asistente','Agenda',TRUE,1)
ON CONFLICT DO NOTHING;

INSERT INTO usuario_roles (usuario_id, rol_id) VALUES
    ('usr-asist-001','rol-004')
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

-- Verificación: el asistente debe existir antes de asignarlo.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = 'usr-asist-001') THEN
        RAISE EXCEPTION 'V6: seed de usuario asistente incompleto (posible colisión de email)';
    END IF;
END $$;

INSERT INTO asignaciones_terapeuta (usuario_id, terapeuta_id) VALUES
    ('usr-asist-001','ter-001'),
    ('usr-asist-001','ter-002')
ON CONFLICT (usuario_id, terapeuta_id) DO NOTHING;

-- 4.4 Permisos de agenda (PBAC)
INSERT INTO permisos (id, codigo, modulo, descripcion) VALUES
    ('perm-017','MIS_CITAS_LEER','AGENDA','Consultar las citas propias del paciente autenticado'),
    ('perm-018','AGENDA_LEER',   'AGENDA','Ver la agenda completa con filtros')
ON CONFLICT (codigo) DO NOTHING;

-- patient (rol-006): solo lee sus citas
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-006', id FROM permisos WHERE codigo = 'MIS_CITAS_LEER'
ON CONFLICT DO NOTHING;

-- Roles clínicos + superadmin: lectura de agenda (AGENDA_LEER)
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.rol_id, p.id
FROM (VALUES ('rol-002'),('rol-003'),('rol-004'),('rol-005'),('rol-001')) AS r(rol_id)
CROSS JOIN (SELECT id FROM permisos WHERE codigo = 'AGENDA_LEER') AS p
ON CONFLICT DO NOTHING;

-- Regla de negocio: solo terapeutas, asistentes y superadmin agendan.
-- admin_clinical (rol-002) pierde AGENDA_GESTIONAR.
DELETE FROM rol_permisos
WHERE rol_id = 'rol-002'
  AND permiso_id = (SELECT id FROM permisos WHERE codigo = 'AGENDA_GESTIONAR');
