-- =============================================================================
-- Migración V20: Historia Clínica — Datos Generales, Historia y Esquema
-- Sucede a V19. Idempotente. Inmutable. Decisiones D-1..D-7 del gap-report.
-- =============================================================================

-- 1. Establecimiento (D-1): extiende el catálogo compartido `sedes` (V11) -----
ALTER TABLE sedes
    ADD COLUMN IF NOT EXISTS clues                VARCHAR(15),
    ADD COLUMN IF NOT EXISTS licencia_sanitaria   VARCHAR(50),
    ADD COLUMN IF NOT EXISTS tipo_establecimiento VARCHAR(10) DEFAULT 'privado';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_sedes_tipo_establecimiento' AND t.relname = 'sedes') THEN
        ALTER TABLE sedes ADD CONSTRAINT ck_sedes_tipo_establecimiento
            CHECK (tipo_establecimiento IN ('publico','privado','social'));
    END IF;
END $$;

-- 2. Datos Generales del paciente (GAP-HC-06/07/08/09) ------------------------
ALTER TABLE pacientes
    ADD COLUMN IF NOT EXISTS rfc              VARCHAR(13),
    ADD COLUMN IF NOT EXISTS sexo             VARCHAR(10),
    ADD COLUMN IF NOT EXISTS lugar_nacimiento VARCHAR(150),
    ADD COLUMN IF NOT EXISTS estado_civil     VARCHAR(20),
    ADD COLUMN IF NOT EXISTS escolaridad      VARCHAR(30),
    ADD COLUMN IF NOT EXISTS ocupacion        VARCHAR(100),
    ADD COLUMN IF NOT EXISTS religion         VARCHAR(50),
    ADD COLUMN IF NOT EXISTS calle_numero     VARCHAR(200),
    ADD COLUMN IF NOT EXISTS colonia          VARCHAR(100),
    ADD COLUMN IF NOT EXISTS codigo_postal    VARCHAR(5),
    ADD COLUMN IF NOT EXISTS municipio        VARCHAR(100),
    ADD COLUMN IF NOT EXISTS estado_domicilio VARCHAR(50),
    ADD COLUMN IF NOT EXISTS telefono_casa    VARCHAR(20),
    ADD COLUMN IF NOT EXISTS telefono_celular VARCHAR(20),
    ADD COLUMN IF NOT EXISTS telefono_trabajo VARCHAR(20),
    ADD COLUMN IF NOT EXISTS contacto_emergencia_nombre     VARCHAR(200),
    ADD COLUMN IF NOT EXISTS contacto_emergencia_parentesco VARCHAR(30),
    ADD COLUMN IF NOT EXISTS contacto_emergencia_telefono   VARCHAR(20),
    ADD COLUMN IF NOT EXISTS representante_telefono VARCHAR(20);

-- Unicidad parcial de RFC (patrón de curp)
CREATE UNIQUE INDEX IF NOT EXISTS ux_pacientes_rfc
    ON pacientes (rfc) WHERE rfc IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_pacientes_sexo' AND t.relname = 'pacientes') THEN
        ALTER TABLE pacientes ADD CONSTRAINT ck_pacientes_sexo
            CHECK (sexo IN ('M','F','LGTB+'));
    END IF;
END $$;

-- Backfill del teléfono del representante (hoy conflado en persona_de_apoyo_contacto)
UPDATE pacientes
SET representante_telefono = persona_de_apoyo_contacto
WHERE representante_parentesco IS NOT NULL
  AND representante_telefono IS NULL
  AND persona_de_apoyo_contacto IS NOT NULL;

-- 3. Cabecera del expediente (GAP-HC-05/14/15 + D-3/D-5) ----------------------
ALTER TABLE expedientes_clinicos
    ADD COLUMN IF NOT EXISTS tipo_expediente        VARCHAR(15),
    ADD COLUMN IF NOT EXISTS fecha_apertura         DATE,
    ADD COLUMN IF NOT EXISTS fuente_referencia      VARCHAR(30),
    ADD COLUMN IF NOT EXISTS fuente_referencia_otro VARCHAR(100),
    ADD COLUMN IF NOT EXISTS riesgo_suicida         VARCHAR(10),
    ADD COLUMN IF NOT EXISTS riesgo_heteroagresivo  VARCHAR(10),
    ADD COLUMN IF NOT EXISTS otros_riesgos          TEXT,
    ADD COLUMN IF NOT EXISTS fecha_evaluacion_riesgo DATE;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_tipo_expediente' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos ADD CONSTRAINT ck_expedientes_tipo_expediente
            CHECK (tipo_expediente IN ('fisico','electronico','mixto'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_fuente_referencia' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos ADD CONSTRAINT ck_expedientes_fuente_referencia
            CHECK (fuente_referencia IN ('iniciativa_propia','medico','psiquiatra','psicoterapeuta','familiar','amigo','otro'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_riesgo_suicida' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos ADD CONSTRAINT ck_expedientes_riesgo_suicida
            CHECK (riesgo_suicida IN ('ausente','bajo','moderado','alto','inminente'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_riesgo_heteroagresivo' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos ADD CONSTRAINT ck_expedientes_riesgo_heteroagresivo
            CHECK (riesgo_heteroagresivo IN ('ausente','bajo','moderado','alto'));
    END IF;
END $$;

-- 4. Historia clínica (JSONB) (D-4/D-6/D-7) -----------------------------------
ALTER TABLE expedientes_clinicos
    ADD COLUMN IF NOT EXISTS examen_mental           JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS historial_farmacos      JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS historial_psicofarmacos JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS historial_drogas        JSONB NOT NULL DEFAULT '[]';

-- 5. Tablas normalizadas (D-2) ------------------------------------------------
CREATE TABLE IF NOT EXISTS antecedentes_expediente (
    id            VARCHAR(36) PRIMARY KEY,
    expediente_id VARCHAR(36) NOT NULL REFERENCES expedientes_clinicos(id) ON DELETE CASCADE,
    grupo         VARCHAR(20) NOT NULL,
    categoria     VARCHAR(40) NOT NULL,
    descripcion   TEXT NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_antecedentes_grupo CHECK (grupo IN ('patologico','no_patologico','heredo_familiar'))
);
-- idx_antecedentes_grupo (expediente_id, grupo) cubre también las búsquedas por expediente_id
CREATE INDEX IF NOT EXISTS idx_antecedentes_grupo ON antecedentes_expediente (expediente_id, grupo);

CREATE TABLE IF NOT EXISTS tratamientos_previos (
    id            VARCHAR(36) PRIMARY KEY,
    expediente_id VARCHAR(36) NOT NULL REFERENCES expedientes_clinicos(id) ON DELETE CASCADE,
    enfoque       VARCHAR(100),
    duracion      VARCHAR(50),
    resultado     VARCHAR(20),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_tratamientos_previos_resultado CHECK (resultado IN ('resuelto','mejorado','invariable','drop_out','otro'))
);
CREATE INDEX IF NOT EXISTS idx_tratamientos_previos_expediente ON tratamientos_previos (expediente_id);

-- 6. Catálogo de categorías de psicofármacos (D-6) ----------------------------
CREATE TABLE IF NOT EXISTS catalogo_categorias_psicofarmacos (
    id       VARCHAR(36) PRIMARY KEY,
    codigo   VARCHAR(50) NOT NULL UNIQUE,
    etiqueta VARCHAR(100) NOT NULL,
    orden    INT NOT NULL DEFAULT 0
);
INSERT INTO catalogo_categorias_psicofarmacos (id, codigo, etiqueta, orden) VALUES
    ('psf-001','bzd','Benzodiacepinas (BZD)',1),
    ('psf-002','isrs','Antidepresivos ISRS',2),
    ('psf-003','duales','Antidepresivos Duales',3),
    ('psf-004','triciclicos_tetraciclicos','Antidepresivos Tricíclicos/Tetracíclicos',4),
    ('psf-005','neurolepticos_tipicos','Neurolépticos Típicos',5),
    ('psf-006','neurolepticos_atipicos','Neurolépticos Atípicos',6),
    ('psf-007','psicoestabilizadores','Psicoestabilizadores',7),
    ('psf-008','inductores_sueno','Inductores del Sueño',8),
    ('psf-009','otros','Otros',9)
ON CONFLICT (codigo) DO NOTHING;

-- 7. Semilla de ejemplo (GAP-HC-22) -------------------------------------------
UPDATE sedes SET clues='CLSM-000001', licencia_sanitaria='LS-BM-2026-01', tipo_establecimiento='privado' WHERE id='sede-centro';
UPDATE sedes SET clues='CLSM-000002', licencia_sanitaria='LS-BM-2026-02', tipo_establecimiento='privado' WHERE id='sede-norte';
UPDATE sedes SET clues='CLSM-000003', licencia_sanitaria='LS-BM-2026-03', tipo_establecimiento='social'  WHERE id='sede-sur';

UPDATE pacientes SET rfc='SARM020815XXX', sexo='F', lugar_nacimiento='Ciudad de México',
    estado_civil='soltero', escolaridad='preparatoria', ocupacion='Estudiante', religion='—',
    calle_numero='Av. Insurgentes 123', colonia='Roma Norte', codigo_postal='06700',
    municipio='Cuauhtémoc', estado_domicilio='CDMX',
    telefono_celular='5512345678', representante_telefono='5522334455'
WHERE id='pac-001';

UPDATE pacientes SET rfc='GOFV901101XXX', sexo='F', lugar_nacimiento='Guadalajara',
    estado_civil='union_libre', escolaridad='licenciatura', ocupacion='Diseñadora', religion='—',
    calle_numero='Av. Chapultepec 45', colonia='Americana', codigo_postal='44160',
    municipio='Guadalajara', estado_domicilio='Jalisco', telefono_celular='3311223344'
WHERE id='pac-002';

UPDATE expedientes_clinicos SET tipo_expediente='electronico', fecha_apertura='2026-08-10',
    fuente_referencia='psicoterapeuta', riesgo_suicida='bajo', riesgo_heteroagresivo='ausente',
    examen_mental='{}', historial_farmacos='[]', historial_psicofarmacos='[]', historial_drogas='[]'
WHERE id='exp-001';

INSERT INTO antecedentes_expediente (id, expediente_id, grupo, categoria, descripcion) VALUES
    ('ant-001','exp-001','patologico','alergicos','Alergia a la penicilina'),
    ('ant-002','exp-001','no_patologico','tabaquismo','No fuma'),
    ('ant-003','exp-001','heredo_familiar','enfermedades_mentales','Madre con trastorno de ansiedad')
ON CONFLICT (id) DO NOTHING;
