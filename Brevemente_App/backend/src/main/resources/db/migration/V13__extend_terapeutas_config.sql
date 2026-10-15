-- =============================================================================
-- Migración V13: Configuración del terapeuta (Mi Consulta)
-- - Extiende `terapeutas` con teléfono, duración, honorarios y edad mínima.
-- - Añade el permiso MI_CONSULTA_EDITAR y lo asigna a los roles pertinentes.
-- Sucede a V12. Idempotente.
-- =============================================================================

-- 1. Columnas de configuración -------------------------------------------------
ALTER TABLE terapeutas ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);
ALTER TABLE terapeutas ADD COLUMN IF NOT EXISTS duracion_sesion_default_min SMALLINT NOT NULL DEFAULT 50;
ALTER TABLE terapeutas ADD COLUMN IF NOT EXISTS costo_primera_sesion NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE terapeutas ADD COLUMN IF NOT EXISTS costo_seguimiento NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE terapeutas ADD COLUMN IF NOT EXISTS edad_minima_atencion SMALLINT NOT NULL DEFAULT 0;

-- 2. Backfill (seed de demo, coherente con el mock de Angular) -----------------
--    Solo aplica si los honorarios siguen en su valor por defecto (nunca editados).
UPDATE terapeutas
SET costo_primera_sesion = 1200,
    costo_seguimiento    = 1000
WHERE id IN ('ter-001', 'ter-002')
  AND costo_primera_sesion = 0
  AND costo_seguimiento = 0
  AND edad_minima_atencion = 0;

-- 3. Restricciones de integridad (idempotentes) --------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'terapeutas' AND c.conname = 'ck_terapeutas_duracion'
    ) THEN
        ALTER TABLE terapeutas ADD CONSTRAINT ck_terapeutas_duracion
            CHECK (duracion_sesion_default_min BETWEEN 15 AND 240);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'terapeutas' AND c.conname = 'ck_terapeutas_costos'
    ) THEN
        ALTER TABLE terapeutas ADD CONSTRAINT ck_terapeutas_costos
            CHECK (costo_primera_sesion >= 0 AND costo_seguimiento >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'terapeutas' AND c.conname = 'ck_terapeutas_edad_minima'
    ) THEN
        ALTER TABLE terapeutas ADD CONSTRAINT ck_terapeutas_edad_minima
            CHECK (edad_minima_atencion BETWEEN 0 AND 120);
    END IF;
END $$;

-- 4. Permiso de edición de configuración del terapeuta -------------------------
--    Nota: perm-017..perm-022 ya fueron usados por migraciones V6..V12.
INSERT INTO permisos (id, codigo, modulo, descripcion) VALUES
    ('perm-023', 'MI_CONSULTA_EDITAR', 'CONSULTA',
     'Editar configuración del terapeuta (honorarios, duración, admisión, teléfono)')
ON CONFLICT DO NOTHING;

--    Asignación a roles: platform, clinical, therapist, supervisor.
--    Se resuelve el id por código para mantener la idempotencia ante conflictos.
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.rol_id, p.id
FROM (VALUES ('rol-001'), ('rol-002'), ('rol-003'), ('rol-005')) AS r(rol_id)
CROSS JOIN permisos p
WHERE p.codigo = 'MI_CONSULTA_EDITAR'
ON CONFLICT DO NOTHING;
