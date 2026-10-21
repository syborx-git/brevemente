-- =============================================================================
-- Migración V14: Relación muchos-a-muchos terapeuta <-> sede (Mi Consulta)
-- Sucede a V13. Idempotente.
-- -----------------------------------------------------------------------------
-- Introduce `terapeuta_sedes` para modelar las sedes donde atiende cada
-- terapeuta, garantizando una única sede principal activa por terapeuta.
-- =============================================================================

CREATE TABLE IF NOT EXISTS terapeuta_sedes (
    terapeuta_id VARCHAR(36) NOT NULL,
    sede_id      VARCHAR(36) NOT NULL,
    es_principal BOOLEAN      NOT NULL DEFAULT FALSE,
    activo       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (terapeuta_id, sede_id),
    CONSTRAINT fk_terapeuta_sedes_terapeuta FOREIGN KEY (terapeuta_id)
        REFERENCES terapeutas(id) ON DELETE CASCADE,
    CONSTRAINT fk_terapeuta_sedes_sede FOREIGN KEY (sede_id)
        REFERENCES sedes(id) ON DELETE CASCADE
);

-- Lookup inverso: todas las sedes de un terapeuta se leen por la PK;
-- este índice sirve para listar terapeutas por sede.
CREATE INDEX IF NOT EXISTS idx_terapeuta_sedes_sede
    ON terapeuta_sedes (sede_id);

-- Garantiza una única sede principal activa por terapeuta (índice único parcial).
CREATE UNIQUE INDEX IF NOT EXISTS ux_terapeuta_sedes_principal
    ON terapeuta_sedes (terapeuta_id)
    WHERE es_principal AND activo;

-- Semilla coherente con la demo (sedes de V11).
INSERT INTO terapeuta_sedes (terapeuta_id, sede_id, es_principal) VALUES
    ('ter-001', 'sede-centro', TRUE),
    ('ter-002', 'sede-norte',  TRUE)
ON CONFLICT (terapeuta_id, sede_id) DO NOTHING;
