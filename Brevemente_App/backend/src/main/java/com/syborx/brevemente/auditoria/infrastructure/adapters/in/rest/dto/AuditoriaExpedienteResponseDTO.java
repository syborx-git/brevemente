package com.syborx.brevemente.auditoria.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Traza de auditoría clínica del expediente")
public record AuditoriaExpedienteResponseDTO(
        @Schema(example = "aud-0001") String id,
        @Schema(example = "2026-10-08T12:00:00-06:00") String timestamp,
        @Schema(example = "usr-001") String userId,
        String userName,
        String role,
        @Schema(example = "Actualización de expediente") String action,
        String details,
        @Schema(example = "expediente") String category
) {}
