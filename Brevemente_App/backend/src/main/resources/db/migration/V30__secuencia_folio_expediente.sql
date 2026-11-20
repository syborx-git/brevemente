-- =============================================================================
-- Migración V30: Secuencia de folio para expedientes clínicos
-- Sucede a V1..V29. Idempotente.
-- Reemplaza la estrategia MAX(folio)+1: generación concurrente segura.
-- =============================================================================

-- 1. Secuencia numérica de folio ---------------------------------------------
CREATE SEQUENCE IF NOT EXISTS seq_expediente_folio;

-- 2. Backfill: el primer nextval() será MAX(número de folio) + 1 --------------
--    Semilla actual: EXP-0001..EXP-0004  ⇒  primer folio nuevo = EXP-0005.
--    is_called = true  ⇒  siguiente nextval() devuelve (valor+1).
SELECT setval(
    'seq_expediente_folio',
    COALESCE(
        (SELECT MAX((substring(folio FROM 5))::bigint)
           FROM expedientes_clinicos
          WHERE folio ~ '^EXP-[0-9]+$'),
        0
    ),
    true
);
