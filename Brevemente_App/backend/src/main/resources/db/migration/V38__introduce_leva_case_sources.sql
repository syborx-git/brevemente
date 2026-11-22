-- =============================================================================
-- Migración V38: Casos Clínicos Fuente de Aprendizaje de LEVA (Memoria de Casos)
-- Solo el rol autorizado (admin_clinical / admin_platform) puede promover un
-- expediente a "caso fuente". Se almacena una ficha ANONIMIZADA (sin datos
-- personales) con un token docente (REF-CASO-AAAA-NNN) y su vector semántico.
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS leva_case_token_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS leva_case_sources (
    id                    VARCHAR(36)  PRIMARY KEY,
    case_token            VARCHAR(30)  NOT NULL UNIQUE,
    expediente_id         VARCHAR(36)  NOT NULL REFERENCES expedientes_clinicos(id) ON DELETE CASCADE,
    expediente_folio      VARCHAR(30),
    status                VARCHAR(10)  NOT NULL DEFAULT 'ACTIVE',
    spr                   TEXT,
    diagnostico_operativo TEXT,
    trastorno_estrategico TEXT,
    tentativas            JSONB        NOT NULL DEFAULT '[]'::jsonb,
    prescripciones        JSONB        NOT NULL DEFAULT '[]'::jsonb,
    reestructuraciones    JSONB        NOT NULL DEFAULT '[]'::jsonb,
    resultado             TEXT,
    num_sesiones          INT          NOT NULL DEFAULT 0,
    perfil_etario         VARCHAR(60),
    notas_curaduria       TEXT,
    search_text           TEXT         NOT NULL,
    embedding             JSONB,
    approved_by           VARCHAR(255) NOT NULL,
    approved_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_by            VARCHAR(255),
    revoked_at            TIMESTAMP WITH TIME ZONE,
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_leva_case_sources_status CHECK (status IN ('ACTIVE', 'REVOKED'))
);

-- Un expediente solo puede estar activo una vez como fuente de aprendizaje
CREATE UNIQUE INDEX IF NOT EXISTS ux_leva_case_sources_active_exp
    ON leva_case_sources (expediente_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_leva_case_sources_status ON leva_case_sources (status);
CREATE INDEX IF NOT EXISTS idx_leva_case_sources_created ON leva_case_sources (created_at DESC);
