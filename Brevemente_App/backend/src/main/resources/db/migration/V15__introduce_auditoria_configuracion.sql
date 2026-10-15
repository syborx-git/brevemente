-- =============================================================================
-- Migración V15: Auditoría de configuración del terapeuta (Mi Consulta)
-- Sucede a V14. Idempotente.
-- -----------------------------------------------------------------------------
-- Bitácora inmutable de cambios en la configuración y sedes del terapeuta.
-- =============================================================================

CREATE TABLE IF NOT EXISTS auditoria_configuracion (
    id             VARCHAR(36)  PRIMARY KEY,
    terapeuta_id   VARCHAR(36)  NOT NULL,
    campo          VARCHAR(50)  NOT NULL,
    valor_anterior VARCHAR(255),
    valor_nuevo    VARCHAR(255),
    usuario_id     VARCHAR(36),
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auditoria_configuracion_terapeuta FOREIGN KEY (terapeuta_id)
        REFERENCES terapeutas(id) ON DELETE CASCADE,
    CONSTRAINT fk_auditoria_configuracion_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_auditoria_configuracion_terapeuta
    ON auditoria_configuracion (terapeuta_id, created_at);
