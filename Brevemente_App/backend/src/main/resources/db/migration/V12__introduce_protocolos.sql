-- =============================================================================
-- Migración V12: Catálogo de Protocolos para Dashboard (SDOP) — SDD-005 §2.2
-- Sucede a V1..V11. Idempotente.
-- -----------------------------------------------------------------------------
-- Introduce el catálogo simple `protocolos` y la columna de relación
-- `pacientes.protocolo_id` para el filtro "Protocolo" y la gráfica
-- "Casos Activos por Protocolo" del Centro de Control (paridad con la demo React).
-- =============================================================================

-- 1. Catálogo de protocolos ----------------------------------------------------
CREATE TABLE IF NOT EXISTS protocolos (
    id     VARCHAR(36)  PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT ux_protocolos_nombre UNIQUE (nombre)
);

-- 2. Relación pacientes -> protocolo -------------------------------------------
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS protocolo_id VARCHAR(36);

CREATE INDEX IF NOT EXISTS idx_pacientes_protocolo
    ON pacientes (protocolo_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'fk_pacientes_protocolo' AND t.relname = 'pacientes') THEN
        ALTER TABLE pacientes ADD CONSTRAINT fk_pacientes_protocolo
            FOREIGN KEY (protocolo_id) REFERENCES protocolos(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Semilla de protocolos (ids deterministas) ---------------------------------
INSERT INTO protocolos (id, nombre) VALUES
    ('prot-panico',        'Ataque de Pánico'),
    ('prot-toc',           'TOC Control'),
    ('prot-fobia-escolar', 'Fobia Escolar'),
    ('prot-fobia-social',  'Fobia Social')
ON CONFLICT (id) DO NOTHING;

-- 4. Asignación de protocolo (coherente con la demo) ----------------------------
UPDATE pacientes SET protocolo_id = 'prot-panico'        WHERE id = 'pac-001';
UPDATE pacientes SET protocolo_id = 'prot-fobia-social'  WHERE id = 'pac-002';
UPDATE pacientes SET protocolo_id = 'prot-toc'           WHERE id = 'pac-003';
UPDATE pacientes SET protocolo_id = 'prot-fobia-escolar' WHERE id = 'pac-004';
-- =============================================================================
