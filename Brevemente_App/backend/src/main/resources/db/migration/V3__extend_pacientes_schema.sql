-- =============================================================================
-- Migración V3: Extensión de Esquema para Directorio de Pacientes (SDOP)
-- Alineado con SDD-003 y gap-report-pacientes.md
-- =============================================================================

-- 1. Agregar columnas requeridas por el frontend clínico de pacientes
ALTER TABLE pacientes
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'activo',
    ADD COLUMN IF NOT EXISTS risk_level VARCHAR(10) DEFAULT 'bajo',
    ADD COLUMN IF NOT EXISTS registry_mode VARCHAR(10) DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS session_frequency VARCHAR(20) DEFAULT 'semanal',
    ADD COLUMN IF NOT EXISTS quien_completa_registro VARCHAR(30) DEFAULT 'PACIENTE',
    ADD COLUMN IF NOT EXISTS motivo_consulta TEXT,
    ADD COLUMN IF NOT EXISTS terapeuta_id VARCHAR(36),
    ADD COLUMN IF NOT EXISTS fecha_determinacion_consentimiento DATE,
    ADD COLUMN IF NOT EXISTS motivo_determinacion_consentimiento TEXT,
    ADD COLUMN IF NOT EXISTS representante_parentesco VARCHAR(30),
    ADD COLUMN IF NOT EXISTS representante_correo VARCHAR(150),
    ADD COLUMN IF NOT EXISTS consentimiento_representante_firmado BOOLEAN DEFAULT FALSE;

-- 2. Restricción de Clave Foránea hacia terapeutas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_pacientes_terapeuta'
    ) THEN
        ALTER TABLE pacientes
            ADD CONSTRAINT fk_pacientes_terapeuta
            FOREIGN KEY (terapeuta_id) REFERENCES terapeutas(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Índices de Búsqueda y Filtrado
CREATE INDEX IF NOT EXISTS idx_pacientes_status ON pacientes(status);
CREATE INDEX IF NOT EXISTS idx_pacientes_risk_level ON pacientes(risk_level);
CREATE INDEX IF NOT EXISTS idx_pacientes_terapeuta ON pacientes(terapeuta_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_estado_consentimiento ON pacientes(estado_consentimiento);

-- 4. Actualización de Semilla Existente (V2) con los nuevos campos clínicos
UPDATE pacientes
SET status = 'activo',
    risk_level = 'medio',
    registry_mode = 'ia',
    session_frequency = 'semanal',
    quien_completa_registro = 'FAMILIAR_O_APOYO',
    motivo_consulta = 'Bloqueo fóbico en situaciones de examen y alta autoexigencia académica.',
    terapeuta_id = 'ter-001',
    fecha_determinacion_consentimiento = '2026-08-10',
    motivo_determinacion_consentimiento = 'Menor de 18 años calculado automáticamente',
    representante_parentesco = 'MADRE',
    representante_correo = 'claudia.santos@familia.mx',
    consentimiento_representante_firmado = TRUE
WHERE id = 'pac-001';

UPDATE pacientes
SET status = 'activo',
    risk_level = 'alto',
    registry_mode = 'manual',
    session_frequency = 'quincenal',
    quien_completa_registro = 'PACIENTE',
    motivo_consulta = 'Crisis de pánico con agorafobia incipiente en transporte público.',
    terapeuta_id = 'ter-001',
    fecha_determinacion_consentimiento = '2026-08-15',
    consentimiento_representante_firmado = FALSE
WHERE id = 'pac-002';

UPDATE pacientes
SET status = 'pendiente',
    risk_level = 'bajo',
    registry_mode = 'manual',
    session_frequency = 'mensual',
    quien_completa_registro = 'PACIENTE',
    motivo_consulta = 'Evaluación diagnóstica inicial TBE y valoración de cambio.',
    terapeuta_id = 'ter-002',
    fecha_determinacion_consentimiento = '2026-08-20',
    consentimiento_representante_firmado = FALSE
WHERE id = 'pac-003';

-- 5. Semilla adicional para cubrir todos los filtros de la demo interactiva (Completado y Archivados)
INSERT INTO pacientes (
    id, nombre, apellidos, curp, fecha_nacimiento, edad_calculada,
    telefono, email, estado_consentimiento, status, risk_level,
    registry_mode, session_frequency, quien_completa_registro, motivo_consulta,
    terapeuta_id, fecha_determinacion_consentimiento, consentimiento_representante_firmado
) VALUES (
    'pac-004', 'Roberto', 'Valdés Garza', 'VARR791201HDFZZ01', '1979-12-01', 46,
    '+52 55 8765 4321', 'roberto.valdes@email.com', 'AUTONOMO', 'completado', 'bajo',
    'manual', 'mensual', 'PACIENTE', 'Problemas de pareja y comunicación destructiva resueltos en 8 sesiones.',
    'ter-002', '2026-07-01', TRUE
) ON CONFLICT (id) DO NOTHING;
