package com.syborx.brevemente.supervision.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Solicitud de creación de una solicitud de supervisión")
public record SupervisionSolicitudCreateRequest(
        @Schema(example = "pac-001") String pacienteId,
        String reason
) {}
