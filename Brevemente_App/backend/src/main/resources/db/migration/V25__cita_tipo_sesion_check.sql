-- =============================================================================
-- Migración V25: Tipo de terapia en citas (PAR-17 — reutiliza columna huérfana)
-- La columna `tipo_sesion` existe desde V1 (VARCHAR(30) DEFAULT 'INDIVIDUAL'),
-- sin NOT NULL, sin CHECK y sin mapeo JPA. Aquí se normaliza y se acota.
-- =============================================================================

-- 1. Normalizar el default histórico (mayúsculas) al vocabulario nuevo ---------
UPDATE citas
SET tipo_sesion = 'individual'
WHERE tipo_sesion = 'INDIVIDUAL';

-- 2. Alinear el default para futuros INSERT ------------------------------------
ALTER TABLE citas
    ALTER COLUMN tipo_sesion SET DEFAULT 'individual';

-- 3. CHECK idempotente (espejo del patrón de V6) --------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_citas_tipo_sesion' AND t.relname = 'citas') THEN
        ALTER TABLE citas ADD CONSTRAINT ck_citas_tipo_sesion
            CHECK (tipo_sesion IS NULL OR tipo_sesion IN ('individual','pareja','familiar','grupal'));
    END IF;
END $$;
