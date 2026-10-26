-- =============================================================================
-- Migración V19: Edición de Sesión y Criterios Clínicos (SDD-EXP-F4, Kanban #102-#108)
-- Sucede a V1..V18. Idempotente.
-- =============================================================================

-- 1. Columnas de sesión (GAP-K02 significado / GAP-K03 spr) -------------------
ALTER TABLE sesiones
    ADD COLUMN IF NOT EXISTS significado TEXT,
    ADD COLUMN IF NOT EXISTS spr         TEXT;

-- 2. Integridad de número (complementa ux_sesiones_expediente_numero) ----------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_sesiones_numero' AND t.relname = 'sesiones') THEN
        ALTER TABLE sesiones ADD CONSTRAINT ck_sesiones_numero CHECK (numero >= 1);
    END IF;
END $$;

-- 3. Soporte a listado de borradores (query: status='borrador' AND creado_por_id IN (...))
CREATE INDEX IF NOT EXISTS idx_sesiones_creado_status
    ON sesiones (creado_por_id, status);

-- 4. Criterios Clínicos por sesión (GAP-K05/K06/K07) — modelo normalizado ------
CREATE TABLE IF NOT EXISTS sesion_criterios_clinicos (
    id         VARCHAR(36) PRIMARY KEY,
    sesion_id  VARCHAR(36) NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
    categoria  VARCHAR(50) NOT NULL,
    valor      TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_sesion_criterios_clinicos_categoria CHECK (categoria IN
        ('conductual','racionalizaciones_intelectualizaciones',
         'comparaciones','imagenes_intrusivas','otro')),
    CONSTRAINT ux_sesion_criterio UNIQUE (sesion_id, categoria)
);
CREATE INDEX IF NOT EXISTS idx_sesion_criterios_sesion
    ON sesion_criterios_clinicos (sesion_id);

-- 5. Catálogo conductual cerrado (GAP-K06 / #107) ------------------------------
CREATE TABLE IF NOT EXISTS catalogo_opciones_conductuales (
    id       VARCHAR(36) PRIMARY KEY,
    codigo   VARCHAR(50) NOT NULL UNIQUE,
    etiqueta VARCHAR(100) NOT NULL,
    orden    INT NOT NULL DEFAULT 0
);

INSERT INTO catalogo_opciones_conductuales (id, codigo, etiqueta, orden) VALUES
    ('cond-001','pedir_suavemente','Pedir suavemente',1),
    ('cond-002','insinuar','Insinuar',2),
    ('cond-003','delegar','Delegar',3),
    ('cond-004','todas','Todas',4),
    ('cond-005','otro','Otro',5)
ON CONFLICT (codigo) DO NOTHING;
