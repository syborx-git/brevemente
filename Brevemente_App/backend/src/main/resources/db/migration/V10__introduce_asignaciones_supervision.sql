-- =============================================================================
-- Migración V10: Asignación supervisor -> terapeuta (Scoping por rol del dashboard) — SDD-004
-- Sucede a V1..V9. Idempotente.
-- =============================================================================

CREATE TABLE IF NOT EXISTS asignaciones_supervision (
    id                      VARCHAR(36) PRIMARY KEY,
    supervisor_usuario_id   VARCHAR(36) NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
    terapeuta_id            VARCHAR(36) NOT NULL REFERENCES terapeutas(id) ON DELETE CASCADE,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ux_asignaciones_supervision_supervisor_terapeuta UNIQUE (supervisor_usuario_id, terapeuta_id)
);

-- El UNIQUE compuesto ya sirve el lookup por supervisor (columna líder); se añade el inverso.
CREATE INDEX IF NOT EXISTS idx_asignaciones_supervision_terapeuta
    ON asignaciones_supervision (terapeuta_id);

-- Semilla (IDs verificados en V4; confirmada por el equipo)
INSERT INTO asignaciones_supervision (id, supervisor_usuario_id, terapeuta_id) VALUES
    ('as-sup-001', 'usr-003', 'ter-001'),  -- Isabel Cárdenas (supervisor) → Dra. Sofía
    ('as-sup-002', 'usr-003', 'ter-002'),  -- Isabel Cárdenas (supervisor) → Mtro. Alejandro
    ('as-sup-003', 'usr-004', 'ter-001')   -- Mtro. Alejandro (terapeuta+supervisor) → Dra. Sofía
ON CONFLICT (supervisor_usuario_id, terapeuta_id) DO NOTHING;
