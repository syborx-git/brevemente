-- =============================================================================
-- Migración V28: Estado de ciclo de vida de usuarios (Módulo 2)
-- - usuarios.estado: activo | suspendido | inactivo (fuente de verdad del ciclo).
-- - activo (boolean) se mantiene sincronizado y lo garantiza un CHECK.
-- Sucede a V1..V27. Idempotente.
-- =============================================================================

-- 1. Estado de ciclo de vida ---------------------------------------------------
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'activo';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_usuarios_estado' AND t.relname = 'usuarios') THEN
        ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_estado
            CHECK (estado IN ('activo','suspendido','inactivo'));
    END IF;
END $$;

-- 2. Backfill re-run-safe ANTES de la restricción de sincronía -----------------
UPDATE usuarios SET estado = 'inactivo' WHERE activo = FALSE AND estado = 'activo';

-- 3. Restricción de sincronía activo ⇔ estado (se añade DESPUÉS del backfill) ---
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_usuarios_estado_activo' AND t.relname = 'usuarios') THEN
        ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_estado_activo
            CHECK ((estado = 'activo') = activo);
    END IF;
END $$;
