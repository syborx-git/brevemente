-- =============================================================================
-- Migración V17: Portal del Paciente (/mi-historial) — SDD dashboard-pacientes
-- Sucede a V1..V16. Idempotente. Sin alterar el vocabulario de citas existente.
-- =============================================================================

-- 1. CHECK canónico de estado_consentimiento (GAP-DP-14) ----------------------
-- Vocabulario unificado: valores persistidos (V1/V2/V3) + valores documentados
-- en CapacidadConsentimientoDTO. Se amplía el CHECK, NO se reescriben datos.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_pacientes_estado_consentimiento' AND t.relname = 'pacientes') THEN
        ALTER TABLE pacientes ADD CONSTRAINT ck_pacientes_estado_consentimiento
            CHECK (estado_consentimiento IN (
                'PENDIENTE_FIRMA','REPRESENTADO_POR_EDAD','FIRMADO_TITULAR',
                'PENDIENTE_RECONSENTIMIENTO','AUTONOMO',
                'REPRESENTADO_POR_CONDICION','PENDIENTE_DETERMINACION'
            ));
    END IF;
END $$;

-- 2. Ligar sesiones (prescripciones) ↔ citas (GAP-DP-07) -----------------------
ALTER TABLE sesiones ADD COLUMN IF NOT EXISTS cita_id VARCHAR(36);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'fk_sesiones_cita' AND t.relname = 'sesiones') THEN
        ALTER TABLE sesiones
            ADD CONSTRAINT fk_sesiones_cita
            FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sesiones_cita ON sesiones (cita_id);

-- 3. Tabla contra_referencias (GAP-DP-05/12) -----------------------------------
CREATE TABLE IF NOT EXISTS contra_referencias (
    id                   VARCHAR(36) PRIMARY KEY,
    paciente_id          VARCHAR(36) NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    terapeuta_origen_id  VARCHAR(36) NOT NULL REFERENCES terapeutas(id),
    terapeuta_destino_id VARCHAR(36) NOT NULL REFERENCES terapeutas(id),
    motivo               TEXT,
    resumen              TEXT,
    estado               VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at          TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_contra_referencias_estado
        CHECK (estado IN ('pendiente','aprobada','rechazada')),
    CONSTRAINT ck_contra_referencias_terapeutas
        CHECK (terapeuta_origen_id <> terapeuta_destino_id)
);

CREATE INDEX IF NOT EXISTS idx_contra_referencias_paciente ON contra_referencias (paciente_id);
CREATE INDEX IF NOT EXISTS idx_contra_referencias_estado   ON contra_referencias (estado);
CREATE INDEX IF NOT EXISTS idx_contra_referencias_origen   ON contra_referencias (terapeuta_origen_id);
CREATE INDEX IF NOT EXISTS idx_contra_referencias_destino  ON contra_referencias (terapeuta_destino_id);

-- 4. Tabla alerta_paciente (GAP-DP-03/05) --------------------------------------
CREATE TABLE IF NOT EXISTS alerta_paciente (
    id            VARCHAR(36) PRIMARY KEY,
    paciente_id   VARCHAR(36) NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    tipo          VARCHAR(30) NOT NULL,
    mensaje       TEXT NOT NULL,
    estado        VARCHAR(20) NOT NULL DEFAULT 'activa',
    resuelta_por  VARCHAR(200),
    resuelta_en   TIMESTAMP WITH TIME ZONE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_alerta_paciente_tipo
        CHECK (tipo IN ('crisis','seguridad_clinica','crisis_atendida')),
    CONSTRAINT ck_alerta_paciente_estado
        CHECK (estado IN ('activa','resuelta'))
);

CREATE INDEX IF NOT EXISTS idx_alerta_paciente_paciente ON alerta_paciente (paciente_id);
CREATE INDEX IF NOT EXISTS idx_alerta_paciente_estado   ON alerta_paciente (estado);

-- 5. Permiso MIS_SESIONES_LEER (GAP-DP-07) -------------------------------------
-- Siguiente consecutivo libre: perm-024. Catálogo completo:
--   perm-017 MIS_CITAS_LEER, perm-018 AGENDA_LEER (V6);
--   perm-019 PAGOS_LEER, perm-020 PAGOS_GESTIONAR, perm-021 CONSTANCIAS_EMITIR,
--   perm-022 SUPERVISION_REGISTRAR (V8); perm-023 MI_CONSULTA_EDITAR (V13).
INSERT INTO permisos (id, codigo, modulo, descripcion) VALUES
    ('perm-024','MIS_SESIONES_LEER','EXPEDIENTE','Consultar las prescripciones de las sesiones propias del paciente autenticado')
ON CONFLICT (codigo) DO NOTHING;

-- patient (rol-006): lee sus prescripciones por sesión
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-006', id FROM permisos WHERE codigo = 'MIS_SESIONES_LEER'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

-- 6. Vincular sesiones existentes a sus citas (demo: prescripciones por cita) --
-- ses-001 → primera cita de exp-001; ses-002 → segunda cita de exp-001.
UPDATE sesiones SET cita_id = 'cit-001' WHERE id = 'ses-001' AND cita_id IS NULL;
UPDATE sesiones SET cita_id = 'cit-002' WHERE id = 'ses-002' AND cita_id IS NULL;

-- 7. Seed determinista para E2E (opcional, evita dependencias de UI) -----------
INSERT INTO alerta_paciente (id, paciente_id, tipo, mensaje, estado, created_at) VALUES
    ('alerta-pac-001','pac-001','seguridad_clinica',
     'Tu equipo clínico fue notificado de una situación que requiere atención.',
     'activa','2026-10-19T10:00:00-06:00')
ON CONFLICT (id) DO NOTHING;
