-- =============================================================================
-- Migración V7: Extensión de Expedientes + tabla sesiones (SDOP) — SDD-EXP v1.0.0
-- Sucede a V1..V6. Idempotente.
-- =============================================================================

-- 1. Extender expedientes_clinicos (12 columnas nuevas) ----------------------
ALTER TABLE expedientes_clinicos
    ADD COLUMN IF NOT EXISTS folio                      VARCHAR(30),
    ADD COLUMN IF NOT EXISTS fecha_inicio               DATE,
    ADD COLUMN IF NOT EXISTS modalidad                  VARCHAR(10),
    ADD COLUMN IF NOT EXISTS descripcion                TEXT,
    ADD COLUMN IF NOT EXISTS trastorno_estrategico      TEXT,
    ADD COLUMN IF NOT EXISTS primera_aparicion          TEXT,
    ADD COLUMN IF NOT EXISTS factores_precipitantes     TEXT,
    ADD COLUMN IF NOT EXISTS tipo_evolucion             VARCHAR(20),
    ADD COLUMN IF NOT EXISTS spr_inicial                TEXT,
    ADD COLUMN IF NOT EXISTS valoracion_cambio_inicial  TEXT,
    ADD COLUMN IF NOT EXISTS valoracion_global_inicial  TEXT,
    ADD COLUMN IF NOT EXISTS objetivo_paciente          TEXT;

-- 2. CHECKs de expedientes_clinicos -------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_modalidad' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos
            ADD CONSTRAINT ck_expedientes_modalidad CHECK (modalidad IN ('presencial','online'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_tipo_evolucion' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos
            ADD CONSTRAINT ck_expedientes_tipo_evolucion CHECK (tipo_evolucion IN ('progresivo','agudo','crónico','episódico'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_estatus' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos
            ADD CONSTRAINT ck_expedientes_estatus CHECK (estatus_expediente IN ('ACTIVO','EN_TRATAMIENTO','EN_DIAGNOSTICO','CERRADO','ARCHIVADO'));
    END IF;
END $$;

-- Unicidad 1:1 paciente↔expediente y folio único (parcial)
CREATE UNIQUE INDEX IF NOT EXISTS ux_expedientes_paciente ON expedientes_clinicos (paciente_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_expedientes_folio    ON expedientes_clinicos (folio) WHERE folio IS NOT NULL;
DROP INDEX IF EXISTS idx_expedientes_paciente; -- V1 creaba un índice no único redundante (lo cubre ux_expedientes_paciente)

-- 3. Nueva tabla sesiones ------------------------------------------------------
CREATE TABLE IF NOT EXISTS sesiones (
    id                           VARCHAR(36) PRIMARY KEY,
    expediente_id                VARCHAR(36) NOT NULL REFERENCES expedientes_clinicos(id) ON DELETE CASCADE,
    numero                       INT NOT NULL,
    fecha                        DATE,
    fase                         VARCHAR(100),
    protocolo                    VARCHAR(100),
    dx_operativo                 TEXT,
    trastorno                    TEXT,
    px                           JSONB NOT NULL DEFAULT '[]',
    f1                           TEXT,
    f2                           TEXT,
    oss                          TEXT,
    adherencia                   TEXT,
    cumplimiento                 TEXT,
    rss                          TEXT,
    eff                          TEXT,
    notas                        TEXT,
    observaciones_proxima_sesion TEXT,
    situacion                    TEXT,
    duracion_audio               VARCHAR(20),
    status                       VARCHAR(10) NOT NULL DEFAULT 'borrador',
    creado_por_id                VARCHAR(36) REFERENCES terapeutas(id),
    created_at                   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at                   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_sesiones_status' AND t.relname = 'sesiones') THEN
        ALTER TABLE sesiones ADD CONSTRAINT ck_sesiones_status CHECK (status IN ('borrador','validado'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ux_sesiones_expediente_numero' AND t.relname = 'sesiones') THEN
        ALTER TABLE sesiones ADD CONSTRAINT ux_sesiones_expediente_numero UNIQUE (expediente_id, numero);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sesiones_expediente ON sesiones (expediente_id);

-- 4. Índices de soporte a FKs (PostgreSQL no los crea automáticamente) ---------
CREATE INDEX IF NOT EXISTS idx_notas_evolucion_expediente ON notas_evolucion (expediente_id);
CREATE INDEX IF NOT EXISTS idx_consentimientos_paciente  ON consentimientos_informados (paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_expediente           ON citas (expediente_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_creado_por       ON sesiones (creado_por_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_terapeuta     ON expedientes_clinicos (terapeuta_asignado_id);

-- 5. CHECK risk_level en pacientes (V3 no lo tenía) ----------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_pacientes_risk_level' AND t.relname = 'pacientes') THEN
        ALTER TABLE pacientes ADD CONSTRAINT ck_pacientes_risk_level CHECK (risk_level IN ('bajo','medio','alto'));
    END IF;
END $$;

-- 6. Semilla: extender expedientes existentes ----------------------------------
UPDATE expedientes_clinicos SET
    folio = 'EXP-0001', fecha_inicio = '2026-08-10', modalidad = 'presencial',
    descripcion = 'Bloqueo fóbico en situaciones de examen y alta autoexigencia académica.',
    trastorno_estrategico = 'Fobia de rendimiento / Ansiedad de ejecución',
    primera_aparicion = 'Hace 6 meses tras periodo de alta exigencia académica.',
    factores_precipitantes = 'Evaluaciones finales y crítica del entorno escolar.',
    tipo_evolucion = 'progresivo', spr_inicial = 'Percepción de peligro inminente ante la evaluación.',
    valoracion_cambio_inicial = 'Marcador de inicio', valoracion_global_inicial = 'Marcador de inicio',
    objetivo_paciente = 'Rendir exámenes sin bloqueo.'
WHERE id = 'exp-001';

UPDATE expedientes_clinicos SET
    folio = 'EXP-0002', fecha_inicio = '2026-08-12', modalidad = 'online',
    descripcion = 'Crisis de pánico con agorafobia incipiente en transporte público.',
    trastorno_estrategico = 'Trastorno de Pánico con Agorafobia',
    primera_aparicion = 'Hace 3 meses tras periodo de alto estrés laboral.',
    factores_precipitantes = 'Discusión con superior y desvelo prolongado.',
    tipo_evolucion = 'episódico', spr_inicial = 'Marcador de inicio',
    valoracion_cambio_inicial = 'Marcador de inicio', valoracion_global_inicial = 'Marcador de inicio',
    objetivo_paciente = 'Usar transporte público sin compañía.'
WHERE id = 'exp-002';

-- 7. Semilla: expedientes nuevos (pac-003, pac-004) ----------------------------
INSERT INTO expedientes_clinicos (id, paciente_id, terapeuta_asignado_id, motivo_consulta, intentos_solucion,
    objetivo_terapeutico, diagnostico_operativo, estatus_expediente, folio, fecha_inicio, modalidad,
    descripcion, trastorno_estrategico, tipo_evolucion, spr_inicial, valoracion_cambio_inicial,
    valoracion_global_inicial, objetivo_paciente)
VALUES
    ('exp-003', 'pac-003', 'ter-002', 'Ansiedad ante evaluaciones universitarias.',
     'Evitación y solicitud de cambio de fechas.', 'Extinguir la evitación fóbica.', 'SPR Fóbico',
     'ACTIVO', 'EXP-0003', '2026-08-20', 'presencial', 'Bloqueo en exposiciones orales.',
     'Fobia de rendimiento', 'progresivo', 'Marcador de inicio', 'Marcador de inicio', 'Marcador de inicio',
     'Exponer sin bloqueo.'),
    ('exp-004', 'pac-004', 'ter-002', 'Problemas de pareja y comunicación destructiva.',
     'Discusiones recurrentes y evitación del diálogo.', 'Interrumpir el patrón de escalada.', 'Conflicto de pareja',
     'EN_TRATAMIENTO', 'EXP-0004', '2026-08-15', 'presencial', 'Patrón de escalada simétrica.',
     'Conflicto de pareja', 'crónico', 'Marcador de inicio', 'Marcador de inicio', 'Marcador de inicio',
     'Comunicación asertiva.')
ON CONFLICT (id) DO NOTHING;

-- 8. Semilla: sesiones (pac-001 y pac-002) -------------------------------------
INSERT INTO sesiones (id, expediente_id, numero, fecha, fase, protocolo, dx_operativo, px, f1, f2, oss,
    adherencia, rss, eff, notas, observaciones_proxima_sesion, situacion, status, creado_por_id)
VALUES
    ('ses-001', 'exp-001', 1, '2026-08-10', 'Definición del problema', 'Fobia de rendimiento', 'SPR Fóbico',
     '["Cómo empeorar","Bitácora de la peor fantasía"]', 'Redefinición del control', 'Evitación que confirma el peligro',
     'Alta receptividad.', '100%', 'Mejoría leve', 'Impacto positivo', 'Registro redujo la crisis de 20 a 5 min.',
     'Profundizar en la maniobra del cómo empeorar.', 'Estable', 'validado', 'ter-001'),
    ('ses-002', 'exp-001', 2, '2026-08-17', 'Intervención Estratégica', 'Fobia de rendimiento', 'SPR Fóbico',
     '["Prescripción de la peor fantasía"]', 'Extinción del control', 'Reestructuración analógica',
     'Aplicó la prescripción.', '90%', 'Disminución de la angustia', 'Desarticulación gradual',
     'Paciente refiere menor anticipación.', 'Revisar bitácora.', 'En proceso', 'validado', 'ter-001'),
    ('ses-003', 'exp-002', 1, '2026-08-12', 'Definición del problema', 'Ataque de Pánico', 'SPR Fóbico',
     '["Diario de abordo"]', 'Quien busca el control lo pierde', 'Evitación que confirma el peligro',
     'Se identificó la solución intentada.', '100%', 'Mejoría leve', 'Externalización efectiva',
     'Reducción de duración de crisis.', 'Maniobra del cómo empeorar.', 'Estable', 'validado', 'ter-001'),
    ('ses-004', 'exp-002', 2, '2026-08-19', 'Intervención Estratégica', 'Ataque de Pánico', 'SPR Fóbico',
     '["Cómo empeorar"]', 'Paradoja del control', 'Desactivación del intento de control',
     'Buena adherencia.', '90%', 'Mejoría significativa', 'Desaparición gradual de la evitación',
     'Solicita compañía con menor frecuencia.', 'Confrontación en transporte.', 'En proceso', 'borrador', 'ter-001')
ON CONFLICT (id) DO NOTHING;

-- 9. Semilla: consentimiento histórico (pac-001, para demostrar auditoría) -----
INSERT INTO consentimientos_informados (id, paciente_id, tipo_consentimiento, firmado_por, calidad_firmante,
    fecha_firma, revocado)
VALUES
    ('con-001', 'pac-001', 'TRATAMIENTO_MENOR', 'Claudia Santos', 'PERSONA_DE_APOYO', CURRENT_TIMESTAMP, FALSE)
ON CONFLICT (id) DO NOTHING;
