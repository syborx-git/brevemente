-- =============================================================================
-- Migración V22: Historia Clínica estructurada
-- Antecedentes fijos + especificaciones de riesgo + examen mental con fecha.
-- Reemplaza el modelo genérico `antecedentes_expediente` (V20).
-- =============================================================================

-- 1. Antecedentes estructurados (reemplaza la tabla genérica) ------------------
ALTER TABLE expedientes_clinicos
    ADD COLUMN IF NOT EXISTS antecedentes JSONB NOT NULL DEFAULT '{}';

-- 2. Especificación de riesgo --------------------------------------------------
ALTER TABLE expedientes_clinicos
    ADD COLUMN IF NOT EXISTS riesgo_suicida_especificar TEXT,
    ADD COLUMN IF NOT EXISTS riesgo_heteroagresivo_especificar TEXT;

-- 3. Fecha del examen mental (para la card latente) ----------------------------
ALTER TABLE expedientes_clinicos
    ADD COLUMN IF NOT EXISTS fecha_examen_mental DATE;

-- 4. Migrar el seed genérico → JSONB estructurado (exp-001) --------------------
UPDATE expedientes_clinicos
SET antecedentes = jsonb_build_object(
    'personalesPatológicos', jsonb_build_object(
        'alérgicos', 'Alergia a la penicilina'
    ),
    'personalesNoPatológicos', jsonb_build_object(
        'tabaquismo', jsonb_build_object('presente', false, 'cantidad', '', 'tiempo', '')
    ),
    'heredoFamiliares', jsonb_build_object(
        'enfermedadesMentales', 'Madre con trastorno de ansiedad'
    )
)
WHERE id = 'exp-001'
  AND (antecedentes IS NULL OR antecedentes = '{}'::jsonb);
-- Verificado en la BD demo: solo exp-001 tiene filas en antecedentes_expediente (3 filas).
-- Si otro entorno tuviera datos de runtime en exp-002/003/004, migrarlos genéricamente ANTES del DROP.

-- 5. Retirar la tabla genérica -------------------------------------------------
DROP TABLE IF EXISTS antecedentes_expediente;
