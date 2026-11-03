-- =============================================================================
-- Migración V23: Fármacos y Drogas del esquema vigente (Expediente Médico Psiquiátrico)
-- Sucede a V22. Idempotente. Decisiones D-1..D-4 del gap-report.
-- =============================================================================

-- 1. Fármacos vigentes (0-3) y Drogas vigentes (0-4) ---------------------------
ALTER TABLE expedientes_clinicos
    ADD COLUMN IF NOT EXISTS farmacos_esquema JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS drogas_esquema  JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS uso_drogas       VARCHAR(15);

-- 2. CHECK espejo de ck_expedientes_uso_farmacos (V8) ---------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_uso_drogas' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos ADD CONSTRAINT ck_expedientes_uso_drogas
            CHECK (uso_drogas IS NULL OR uso_drogas IN ('SI','NO','ESPECIFICAR'));
    END IF;
END $$;

-- 3. Backfill de categoría en el seed de esquema_farmacologico (V8 no la traía) -
UPDATE expedientes_clinicos
SET esquema_farmacologico = (
    SELECT COALESCE(
        jsonb_agg(
            elem || CASE
                WHEN elem->>'categoria' IS NOT NULL THEN '{}'::jsonb
                WHEN elem->>'id' = 'drug-1' THEN '{"categoria":"isrs"}'::jsonb
                WHEN elem->>'id' = 'drug-2' THEN '{"categoria":"bzd"}'::jsonb
                ELSE '{}'::jsonb
            END
        ),
        '[]'::jsonb
    )
    FROM jsonb_array_elements(esquema_farmacologico) AS elem
)
WHERE id = 'exp-002'
  AND esquema_farmacologico IS NOT NULL
  AND jsonb_typeof(esquema_farmacologico) = 'array';
