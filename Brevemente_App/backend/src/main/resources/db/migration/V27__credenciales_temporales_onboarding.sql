-- =============================================================================
-- Migración V27: Credenciales temporales y onboarding (ADR-005 / SDD credenciales)
-- - usuarios.debe_cambiar_password + password_temporal_vence_en (TTL).
-- - auditoria_gestion (append-only) para gestión de usuarios y credenciales.
-- Sucede a V1..V26. Idempotente.
-- =============================================================================

-- 1. Flag de cambio obligatorio + TTL de la contraseña temporal ---------------
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS password_temporal_vence_en TIMESTAMP WITH TIME ZONE;

-- Coherencia: solo puede haber TTL si hay contraseña temporal (flag activo)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_usuarios_temporal_coherente' AND t.relname = 'usuarios') THEN
        ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_temporal_coherente
            CHECK (password_temporal_vence_en IS NULL OR debe_cambiar_password = TRUE);
    END IF;
END $$;

-- 2. Auditoría de gestión (append-only) ---------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_gestion (
    id         VARCHAR(36) PRIMARY KEY,
    actor_id   VARCHAR(36),
    accion     VARCHAR(50) NOT NULL,          -- ALTA_USUARIO | EDICION_USUARIO | CAMBIO_ESTADO_USUARIO | ASIGNACION_TERAPEUTA
                                              -- RESET_PASSWORD | ALTA_PACIENTE | REVOCACION_ADMIN
                                              -- LOGIN_TEMPORAL | CAMBIO_PASSWORD | ONBOARDING_COMPLETADO
    entidad    VARCHAR(50) NOT NULL,          -- USUARIO | PACIENTE
    entidad_id VARCHAR(36),
    detalle    JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auditoria_gestion_actor FOREIGN KEY (actor_id)
        REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT ck_auditoria_gestion_accion CHECK (accion IN (
        'ALTA_USUARIO','EDICION_USUARIO','CAMBIO_ESTADO_USUARIO','ASIGNACION_TERAPEUTA',
        'RESET_PASSWORD','ALTA_PACIENTE','REVOCACION_ADMIN',
        'LOGIN_TEMPORAL','CAMBIO_PASSWORD','ONBOARDING_COMPLETADO')),
    CONSTRAINT ck_auditoria_gestion_entidad CHECK (entidad IN ('USUARIO','PACIENTE'))
);

CREATE INDEX IF NOT EXISTS idx_auditoria_gestion_actor ON auditoria_gestion (actor_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_gestion_accion_fecha ON auditoria_gestion (accion, created_at);
CREATE INDEX IF NOT EXISTS idx_auditoria_gestion_entidad_id ON auditoria_gestion (entidad, entidad_id);
