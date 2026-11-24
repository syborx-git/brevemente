-- =============================================================================
-- V39: Pagos provisionales y cancelación de citas con motivo (SDOP)
-- Sucede a V38. Idempotente.
-- =============================================================================

-- 1. Columnas de cancelación ---------------------------------------------------
ALTER TABLE citas ADD COLUMN IF NOT EXISTS motivo_cancelacion VARCHAR(30);
ALTER TABLE citas ADD COLUMN IF NOT EXISTS motivo_cancelacion_detalle VARCHAR(255);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_citas_motivo_cancelacion' AND t.relname = 'citas') THEN
        ALTER TABLE citas ADD CONSTRAINT ck_citas_motivo_cancelacion
            CHECK (motivo_cancelacion IS NULL OR motivo_cancelacion IN
                   ('EMERGENCIA','NO_PUEDE_ASISTIR','CAMBIO_DE_PLANES','MOTIVO_CLINICO','OTRO'));
    END IF;
END $$;

-- 2. Backfill histórico (semilla V6) -------------------------------------------
UPDATE citas SET motivo_cancelacion = 'OTRO'
 WHERE id = 'cit-006' AND estado_cita = 'cancelada' AND motivo_cancelacion IS NULL;

UPDATE citas SET payment_status = 'exenta'
 WHERE estado_cita = 'confirmada' AND payment_status = 'pendiente';

-- 3. Auditoría: permitir categoría 'citas' -------------------------------------
ALTER TABLE auditoria_expediente DROP CONSTRAINT IF EXISTS ck_auditoria_exp_categoria;
ALTER TABLE auditoria_expediente ADD CONSTRAINT ck_auditoria_exp_categoria
    CHECK (categoria IN ('expediente','sesion','ia','reporte','seguridad','riesgo','pagos','citas'));

-- 4. Permisos PBAC (solo patient) ---------------------------------------------
INSERT INTO permisos (id, codigo, modulo, descripcion) VALUES
    ('perm-029', 'MIS_CITAS_PAGAR',    'AGENDA', 'Pagar la cita propia del paciente autenticado'),
    ('perm-030', 'MIS_CITAS_CANCELAR', 'AGENDA', 'Cancelar una cita propia del paciente autenticado con motivo')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-006', id FROM permisos WHERE codigo IN ('MIS_CITAS_PAGAR','MIS_CITAS_CANCELAR')
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

-- 5. Anti doble cobro (índice único parcial) ------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS ux_pagos_cita_pagado
    ON pagos (cita_id) WHERE estado = 'pagado' AND cita_id IS NOT NULL;
