package com.syborx.brevemente.supervision.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Solicitud de supervisión clínica")
public record SupervisionSolicitudResponseDTO(
        String id,
        String patientId,
        String patientName,
        String therapistId,
        String therapistName,
        String reason,
        @Schema(example = "pendiente") String status,
        String createdAt,
        String attendedBy,
        String attendedAt
) {}
