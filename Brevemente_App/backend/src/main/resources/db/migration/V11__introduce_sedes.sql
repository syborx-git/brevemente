-- =============================================================================
-- Migración V11: Catálogo de Sedes para Dashboard (SDOP) — SDD-005 §2.1
-- Sucede a V1..V10. Idempotente.
-- -----------------------------------------------------------------------------
-- Introduce el catálogo simple `sedes` y la columna de relación `pacientes.sede_id`
-- para el filtro "Sede" del Centro de Control (paridad con la demo React).
-- Añade también el CHECK canónico de estados de paciente (`ck_pacientes_status`).
-- =============================================================================

-- 1. Catálogo de sedes ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS sedes (
    id        VARCHAR(36)  PRIMARY KEY,
    nombre    VARCHAR(100) NOT NULL,
    direccion VARCHAR(200),
    activo    BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT ux_sedes_nombre UNIQUE (nombre)
);

-- 2. Relación pacientes -> sede ------------------------------------------------
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS sede_id VARCHAR(36);

CREATE INDEX IF NOT EXISTS idx_pacientes_sede
    ON pacientes (sede_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'fk_pacientes_sede' AND t.relname = 'pacientes') THEN
        ALTER TABLE pacientes ADD CONSTRAINT fk_pacientes_sede
            FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. CHECK canónico de estados de paciente -------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_pacientes_status' AND t.relname = 'pacientes') THEN
        ALTER TABLE pacientes ADD CONSTRAINT ck_pacientes_status
            CHECK (status IN ('activo','pendiente','completado','archivado'));
    END IF;
END $$;

-- 4. Semilla de sedes (ids deterministas) --------------------------------------
INSERT INTO sedes (id, nombre, direccion) VALUES
    ('sede-centro', 'Sede Centro BreveMente', 'Ciudad de México'),
    ('sede-norte',  'Sede Norte BreveMente',  NULL),
    ('sede-sur',    'Sede Sur BreveMente',    NULL)
ON CONFLICT (id) DO NOTHING;

-- 5. Asignación de sede (coherente con la demo) --------------------------------
UPDATE pacientes SET sede_id = 'sede-centro' WHERE id IN ('pac-001','pac-002');
UPDATE pacientes SET sede_id = 'sede-norte'  WHERE id = 'pac-003';
UPDATE pacientes SET sede_id = 'sede-sur'    WHERE id = 'pac-004';
-- =============================================================================
