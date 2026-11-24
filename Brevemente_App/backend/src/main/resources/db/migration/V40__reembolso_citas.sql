-- =============================================================================
-- V40: Reembolso al cancelar citas pagadas (SDOP) — SDD-REEM-1 v1.0.0
-- Sucede a V39. Idempotente.
-- =============================================================================

-- Ampliar vocabulario de payment_status de citas con 'reembolsado'.
-- (pagos.estado ya admite 'reembolsado' en ck_pagos_estado desde V8: sin cambio.)
ALTER TABLE citas DROP CONSTRAINT IF EXISTS ck_citas_payment;
ALTER TABLE citas ADD CONSTRAINT ck_citas_payment
    CHECK (payment_status IN ('pagada','pendiente','exenta','reembolsado'));

-- Defensa en profundidad anti doble reembolso (análogo a ux_pagos_cita_pagado de V39).
CREATE UNIQUE INDEX IF NOT EXISTS ux_pagos_cita_reembolsado
    ON pagos (cita_id) WHERE estado = 'reembolsado' AND cita_id IS NOT NULL;
