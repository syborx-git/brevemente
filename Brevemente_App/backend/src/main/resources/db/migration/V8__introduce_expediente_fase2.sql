-- =============================================================================
-- Migración V8: Expedientes Fase 2 (SDOP) — SDD-EXP-F2 v1.0.0
-- Sucede a V1..V7. Idempotente.
-- =============================================================================

-- 1. Psiquiatría en expedientes_clinicos --------------------------------------
ALTER TABLE expedientes_clinicos
    ADD COLUMN IF NOT EXISTS dx_nosologico           TEXT,
    ADD COLUMN IF NOT EXISTS dsm5                    TEXT,
    ADD COLUMN IF NOT EXISTS cie11                   TEXT,
    ADD COLUMN IF NOT EXISTS comorbilidad            TEXT,
    ADD COLUMN IF NOT EXISTS diagnostico_diferencial TEXT,
    ADD COLUMN IF NOT EXISTS plan_tratamiento        TEXT,
    ADD COLUMN IF NOT EXISTS pronostico              VARCHAR(20),
    ADD COLUMN IF NOT EXISTS factores_favorables     TEXT,
    ADD COLUMN IF NOT EXISTS factores_desfavorables  TEXT,
    ADD COLUMN IF NOT EXISTS uso_farmacos            VARCHAR(15),
    ADD COLUMN IF NOT EXISTS esquema_farmacologico   JSONB NOT NULL DEFAULT '[]';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_pronostico' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos ADD CONSTRAINT ck_expedientes_pronostico
            CHECK (pronostico IS NULL OR pronostico IN ('excelente','bueno','reservado','malo'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_uso_farmacos' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos ADD CONSTRAINT ck_expedientes_uso_farmacos
            CHECK (uso_farmacos IS NULL OR uso_farmacos IN ('SI','NO','ESPECIFICAR'));
    END IF;
END $$;

-- 2. VC/VG por sesión (JSONB) --------------------------------------------------
ALTER TABLE sesiones
    ADD COLUMN IF NOT EXISTS valoracion_cambio  JSONB,
    ADD COLUMN IF NOT EXISTS valoracion_global  JSONB;

-- 3. Pagos ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos (
    id                VARCHAR(36) PRIMARY KEY,
    paciente_id       VARCHAR(36) NOT NULL REFERENCES pacientes(id),
    cita_id           VARCHAR(36) REFERENCES citas(id),
    concepto          TEXT NOT NULL,
    monto             NUMERIC(10,2) NOT NULL,
    fecha             DATE NOT NULL,
    metodo            VARCHAR(20) NOT NULL,
    estado            VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    notas             TEXT,
    registrado_por_id VARCHAR(36) REFERENCES usuarios(id),
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_pagos_metodo CHECK (metodo IN ('efectivo','transferencia','tarjeta','otro')),
    CONSTRAINT ck_pagos_estado CHECK (estado IN ('pagado','pendiente','parcial','reembolsado')),
    CONSTRAINT ck_pagos_monto  CHECK (monto >= 0)
);
CREATE INDEX IF NOT EXISTS idx_pagos_paciente     ON pagos (paciente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cita         ON pagos (cita_id);
CREATE INDEX IF NOT EXISTS idx_pagos_registrado   ON pagos (registrado_por_id);

-- 4. Auditoría clínica del expediente (append-only) ---------------------------
CREATE TABLE IF NOT EXISTS auditoria_expediente (
    id          VARCHAR(36) PRIMARY KEY,
    paciente_id VARCHAR(36) NOT NULL REFERENCES pacientes(id),
    usuario_id  VARCHAR(36) REFERENCES usuarios(id),
    accion      VARCHAR(100) NOT NULL,
    detalle     TEXT,
    categoria   VARCHAR(20) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_auditoria_exp_categoria CHECK (categoria IN
        ('expediente','sesion','ia','reporte','seguridad','riesgo','pagos'))
);
CREATE INDEX IF NOT EXISTS idx_auditoria_exp_paciente ON auditoria_expediente (paciente_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_exp_usuario  ON auditoria_expediente (usuario_id);

-- 5. Supervisión: bitácoras ----------------------------------------------------
CREATE TABLE IF NOT EXISTS supervision_bitacoras (
    id                   VARCHAR(36) PRIMARY KEY,
    paciente_id          VARCHAR(36) NOT NULL REFERENCES pacientes(id),
    terapeuta_id         VARCHAR(36) REFERENCES terapeutas(id),
    fecha                DATE,
    numero_sesion        INT,
    supervisor_nombre    VARCHAR(200),
    supervisor_cedula    VARCHAR(50),
    definicion_problema  TEXT,
    situacion_actual     TEXT,
    spr                  TEXT,
    ts                   TEXT,
    problema_terapeuta   TEXT,
    rst                  TEXT,
    px                   TEXT,
    eff                  TEXT,
    duda                 TEXT,
    bloqueo              TEXT,
    observaciones        TEXT,
    recomendaciones      TEXT,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_supervision_paciente  ON supervision_bitacoras (paciente_id);
CREATE INDEX IF NOT EXISTS idx_supervision_terapeuta ON supervision_bitacoras (terapeuta_id);

-- 6. Supervisión: solicitudes --------------------------------------------------
CREATE TABLE IF NOT EXISTS supervision_solicitudes (
    id                VARCHAR(36) PRIMARY KEY,
    paciente_id       VARCHAR(36) NOT NULL REFERENCES pacientes(id),
    solicitante_id    VARCHAR(36) NOT NULL REFERENCES usuarios(id),
    terapeuta_id      VARCHAR(36) REFERENCES terapeutas(id),
    motivo            TEXT,
    estado            VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atendido_por_id   VARCHAR(36) REFERENCES usuarios(id),
    atendido_at       TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_supervision_solicitud_estado CHECK (estado IN ('pendiente','atendida'))
);
CREATE INDEX IF NOT EXISTS idx_supervision_solicitudes_paciente    ON supervision_solicitudes (paciente_id);
CREATE INDEX IF NOT EXISTS idx_supervision_solicitudes_solicitante ON supervision_solicitudes (solicitante_id);
CREATE INDEX IF NOT EXISTS idx_supervision_solicitudes_terapeuta   ON supervision_solicitudes (terapeuta_id);
CREATE INDEX IF NOT EXISTS idx_supervision_solicitudes_atendido    ON supervision_solicitudes (atendido_por_id);

-- 7. Constancias físicas --------------------------------------------------------
CREATE TABLE IF NOT EXISTS constancias_fisicas (
    id                     VARCHAR(36) PRIMARY KEY,
    paciente_id            VARCHAR(36) NOT NULL REFERENCES pacientes(id),
    folio_fisico           VARCHAR(50),
    fecha_expedicion       DATE,
    tipo                   VARCHAR(20) NOT NULL,
    emisor_nombre          VARCHAR(200),
    emisor_cedula          VARCHAR(50),
    destinatario           TEXT,
    motivo                 TEXT,
    periodo_cubierto       TEXT,
    num_sesiones           INT,
    resumen_clinico        TEXT,
    url_escaneo            TEXT,
    nombre_archivo_escaneo VARCHAR(255),
    entregado_a            TEXT,
    estado                 VARCHAR(20) NOT NULL DEFAULT 'entregada_en_fisico',
    registrado_por_id      VARCHAR(36) REFERENCES usuarios(id),
    registrado_at          TIMESTAMP WITH TIME ZONE,
    created_at             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_constancias_tipo   CHECK (tipo IN
        ('psicoterapeutica','psiquiatrica','asistencia','informe_pericial','justificante')),
    CONSTRAINT ck_constancias_estado CHECK (estado IN ('entregada_en_fisico','anulada'))
);
CREATE INDEX IF NOT EXISTS idx_constancias_paciente    ON constancias_fisicas (paciente_id);
CREATE INDEX IF NOT EXISTS idx_constancias_registrado  ON constancias_fisicas (registrado_por_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_constancias_folio ON constancias_fisicas (folio_fisico)
    WHERE folio_fisico IS NOT NULL;

-- 8. Permisos nuevos -----------------------------------------------------------
INSERT INTO permisos (id, codigo, modulo, descripcion) VALUES
    ('perm-019','PAGOS_LEER',            'PAGOS',       'Consultar el historial de pagos de los pacientes'),
    ('perm-020','PAGOS_GESTIONAR',       'PAGOS',       'Registrar, modificar y eliminar pagos'),
    ('perm-021','CONSTANCIAS_EMITIR',    'CONSTANCIAS', 'Registrar y anular constancias físicas'),
    ('perm-022','SUPERVISION_REGISTRAR', 'SUPERVISION', 'Registrar y eliminar sus propias bitácoras de supervisión')
ON CONFLICT (codigo) DO NOTHING;

-- Asignación (ids de rol verificados en V5/V6: rol-001 admin_platform,
-- rol-002 admin_clinical, rol-003 therapist, rol-004 assistant, rol-005 supervisor)
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permisos p
WHERE (r.id = 'rol-003' AND p.codigo IN ('PAGOS_LEER','PAGOS_GESTIONAR','CONSTANCIAS_EMITIR','SUPERVISION_REGISTRAR'))
   OR (r.id = 'rol-001' AND p.codigo IN ('PAGOS_LEER','PAGOS_GESTIONAR','CONSTANCIAS_EMITIR'))
   OR (r.id = 'rol-002' AND p.codigo IN ('PAGOS_LEER','PAGOS_GESTIONAR','CONSTANCIAS_EMITIR'))
   OR (r.id = 'rol-004' AND p.codigo IN ('PAGOS_LEER','PAGOS_GESTIONAR'))
   OR (r.id = 'rol-005' AND p.codigo = 'PAGOS_LEER')
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

-- El terapeuta (rol-003) necesita ver sus propias bitácoras (SUPERVISION_LEER)
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-003', id FROM permisos WHERE codigo = 'SUPERVISION_LEER'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

-- 9. Semilla: psiquiatría sobre exp-002 (pac-002, adulta, Trastorno de Pánico) -
UPDATE expedientes_clinicos SET
    dx_nosologico          = 'Trastorno de Pánico [F41.0]',
    dsm5                   = '300.01 Trastorno de Pánico',
    cie11                  = '6B01 Trastorno de Pánico',
    pronostico             = 'bueno',
    plan_tratamiento       = 'Monitoreo de fármacos y co-tratamiento psicoterapéutico.',
    uso_farmacos           = 'SI',
    esquema_farmacologico  = '[{"id":"drug-1","name":"Sertralina 50mg","doseMorning":"1 tableta","doseAfternoon":"0","doseNight":"0","eff":"Bueno","notes":"Ligera cefalea los primeros días."},{"id":"drug-2","name":"Alprazolam 0.25mg","doseMorning":"0","doseAfternoon":"0","doseNight":"1 tableta","eff":"Excelente inductor de sueño","notes":"Uso condicionado a crisis agudas."}]'::jsonb
WHERE id = 'exp-002';

-- 10. Semilla: VC/VG por sesión (ses-001, ses-002) ------------------------------
UPDATE sesiones SET
    valoracion_cambio = '{"sessionNum":1,"percepcion":"Marcador de inicio","pensamientos":"Marcador de inicio","sensaciones":"Marcador de inicio","reacciones":"Marcador de inicio","sintomas":"Marcador de inicio","crisis":"Marcador de inicio"}'::jsonb,
    valoracion_global = '{"sessionNum":1,"yo":true,"demas":false,"mundo":false}'::jsonb
WHERE id = 'ses-001';

UPDATE sesiones SET
    valoracion_cambio = '{"sessionNum":2,"percepcion":"Mejoría leve","pensamientos":"Sin cambios","sensaciones":"Mejoría leve","reacciones":"Mejoría leve","sintomas":"Mejoría leve","crisis":"Mejoría leve"}'::jsonb,
    valoracion_global = '{"sessionNum":2,"yo":true,"demas":true,"mundo":false}'::jsonb
WHERE id = 'ses-002';

-- 11. Semilla: pago, bitácora de supervisión y constancia (pac-001) -------------
-- Guarda de identidad del registrante (usr-001 = sofia.ramirez@brevemente.org, V4)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = 'usr-001') THEN
        RAISE EXCEPTION 'V8: usuario registrante usr-001 no encontrado';
    END IF;
END $$;

INSERT INTO pagos (id, paciente_id, concepto, monto, fecha, metodo, estado, registrado_por_id)
VALUES ('pay-001', 'pac-001', 'Sesión 1 · Seguimiento', 800.00, '2026-08-10', 'transferencia', 'pagado',
        'usr-001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO supervision_bitacoras (id, paciente_id, terapeuta_id, fecha, numero_sesion,
    supervisor_nombre, supervisor_cedula, definicion_problema, situacion_actual, spr, ts,
    problema_terapeuta, rst, px, eff, duda, bloqueo, observaciones, recomendaciones)
VALUES ('sup-001', 'pac-001', 'ter-001', '2026-08-18', 2,
    'Dra. Isabel Cárdenas', 'CED-9988221-MX',
    'Fobia de rendimiento con evitación de evaluaciones. Solución intentada: evitación y búsqueda de reaseguramiento.',
    'Favorable. Disminución de la angustia anticipatoria tras la prescripción de la peor fantasía.',
    'SPR Fóbico', 'Fobia de rendimiento',
    'Resistencia sutil a exponerse solo ante exámenes.',
    'Fantasía del peor escenario y prescripción paradójica del síntoma.',
    'Bitácora de la peor fantasía + cómo empeorar.',
    'Disminución del miedo anticipatorio.',
    '¿Cómo modular la evitación ante evaluaciones orales?',
    'Evitación persistente de presentaciones.',
    'Aplicar redefinición paradójica sin confrontar directamente el miedo.',
    'Simulacros voluntarios de exposición + revisión en Sesión 3.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO constancias_fisicas (id, paciente_id, folio_fisico, fecha_expedicion, tipo,
    emisor_nombre, emisor_cedula, destinatario, motivo, periodo_cubierto, num_sesiones,
    resumen_clinico, url_escaneo, nombre_archivo_escaneo, entregado_a, estado, registrado_por_id, registrado_at)
VALUES ('con-fis-001', 'pac-001', 'CONST-2026-084-FIS', '2026-08-20', 'psicoterapeutica',
    'Dr. Alejandro Silva', 'CED-8849302-MX', 'Dirección Escolar', 'Acreditación de asistencia a tratamiento',
    '10 de Agosto de 2026 al 17 de Agosto de 2026', 2,
    'Se hace constar en físico que el paciente acude de manera regular a intervención en Terapia Breve Estratégica con evolución clínica favorable.',
    'escaneo_constancia_mateo_herrera.pdf', 'escaneo_constancia_mateo_herrera.pdf',
    'Mateo Herrera Santos (en mano, consultorio)', 'entregada_en_fisico',
    'usr-001', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
