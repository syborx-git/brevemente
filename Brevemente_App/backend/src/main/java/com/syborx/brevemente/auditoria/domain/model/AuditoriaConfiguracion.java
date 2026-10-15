package com.syborx.brevemente.auditoria.domain.model;

import java.time.OffsetDateTime;

/**
 * Traza inmutable de un cambio en la configuración del terapeuta (Mi Consulta).
 */
public record AuditoriaConfiguracion(
        String id,
        String terapeutaId,
        String campo,
        String valorAnterior,
        String valorNuevo,
        String usuarioId,
        String usuarioNombre,
        OffsetDateTime createdAt
) {}
