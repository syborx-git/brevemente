-- =============================================================================
-- Migración V9: Índices de soporte para Dashboard (SDOP)
-- Sucede a V1..V8. Idempotente.
-- -----------------------------------------------------------------------------
-- La Fase inmediata del dashboard NO requiere tablas ni columnas nuevas:
-- todo el esquema necesario existe en V1..V8. Esta migración añade únicamente
-- dos índices de lectura para las queries del dashboard.
-- =============================================================================

-- 1. Pacientes recientes ------------------------------------------------------
-- Soporta: SELECT ... FROM pacientes ORDER BY created_at DESC LIMIT N
-- Columna verificada en V1: pacientes.created_at TIMESTAMP WITH TIME ZONE.
CREATE INDEX IF NOT EXISTS idx_pacientes_created_at
    ON pacientes (created_at DESC);

-- 2. Citas de hoy por estado (acción dominante) --------------------------------
-- Soporta: WHERE fecha_hora_inicio >= :hoy AND fecha_hora_inicio < :manana
--          AND estado_cita = :estado
-- Columnas verificadas en V1: citas.fecha_hora_inicio, citas.estado_cita.
CREATE INDEX IF NOT EXISTS idx_citas_fecha_estado
    ON citas (fecha_hora_inicio, estado_cita);

-- -----------------------------------------------------------------------------
-- Nota de redundancia (NO se hace DROP en esta migración):
-- V1 creó idx_citas_fecha ON citas(fecha_hora_inicio). Al añadir
-- idx_citas_fecha_estado (fecha_hora_inicio, estado_cita), el índice simple
-- queda potencialmente redundante para filtros/ordenamientos que usan
-- fecha_hora_inicio como columna líder, ya que el índice compuesto la incluye
-- como primera columna. Se conserva por compatibilidad y porque otras queries
-- pueden seguir apoyándose en él; su eventual eliminación debe evaluarse en una
-- migración posterior con análisis de uso.
-- =============================================================================
