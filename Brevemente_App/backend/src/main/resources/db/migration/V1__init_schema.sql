-- =============================================================================
-- Migración V1: Esquema Base BreveMente (Plataforma Clínica TBE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS terapeutas (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    cedula_profesional VARCHAR(50),
    especialidad VARCHAR(100) DEFAULT 'Terapia Breve Estratégica',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pacientes (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    curp VARCHAR(18) UNIQUE,
    fecha_nacimiento DATE NOT NULL,
    edad_calculada INT NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(150),
    estado_consentimiento VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_FIRMA',
    persona_de_apoyo_nombre VARCHAR(200),
    persona_de_apoyo_contacto VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expedientes_clinicos (
    id VARCHAR(36) PRIMARY KEY,
    paciente_id VARCHAR(36) NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    terapeuta_asignado_id VARCHAR(36) REFERENCES terapeutas(id),
    motivo_consulta TEXT NOT NULL,
    intentos_solucion TEXT,
    objetivo_terapeutico TEXT,
    diagnostico_operativo TEXT,
    estatus_expediente VARCHAR(30) DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS citas (
    id VARCHAR(36) PRIMARY KEY,
    paciente_id VARCHAR(36) NOT NULL REFERENCES pacientes(id),
    terapeuta_id VARCHAR(36) NOT NULL REFERENCES terapeutas(id),
    expediente_id VARCHAR(36) REFERENCES expedientes_clinicos(id),
    fecha_hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_hora_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo_sesion VARCHAR(30) DEFAULT 'INDIVIDUAL',
    modalidad VARCHAR(20) DEFAULT 'PRESENCIAL',
    estado_cita VARCHAR(30) DEFAULT 'PROGRAMADA',
    bloqueada_por_normativa BOOLEAN DEFAULT FALSE,
    notas_preparacion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notas_evolucion (
    id VARCHAR(36) PRIMARY KEY,
    expediente_id VARCHAR(36) NOT NULL REFERENCES expedientes_clinicos(id) ON DELETE CASCADE,
    cita_id VARCHAR(36) REFERENCES citas(id),
    numero_sesion INT NOT NULL,
    estratagema_aplicada TEXT,
    prescripcion_tarea TEXT,
    observaciones_clinicas TEXT,
    reaccion_paciente TEXT,
    creado_por_id VARCHAR(36) NOT NULL REFERENCES terapeutas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consentimientos_informados (
    id VARCHAR(36) PRIMARY KEY,
    paciente_id VARCHAR(36) NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    tipo_consentimiento VARCHAR(50) NOT NULL,
    firmado_por VARCHAR(200) NOT NULL,
    calidad_firmante VARCHAR(50) NOT NULL, -- 'TITULAR', 'PERSONA_DE_APOYO'
    fecha_firma TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_origen VARCHAR(45),
    documento_hash VARCHAR(64),
    revocado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auditoria_accesos (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    recurso_accedido VARCHAR(100) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    detalles JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pacientes_curp ON pacientes(curp);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha_hora_inicio);
CREATE INDEX IF NOT EXISTS idx_expedientes_paciente ON expedientes_clinicos(paciente_id);
