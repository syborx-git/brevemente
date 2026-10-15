package com.syborx.brevemente.auditoria.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

@Schema(description = "Traza de auditoría de configuración del terapeuta")
public record AuditoriaConfiguracionResponseDTO(
        @Schema(example = "cfg-0001") String id,
        @Schema(example = "ter-001") String terapeutaId,
        @Schema(example = "telefono") String campo,
        String valorAnterior,
        String valorNuevo,
        @Schema(example = "usr-001") String usuarioId,
        String usuarioNombre,
        OffsetDateTime timestamp
) {}
