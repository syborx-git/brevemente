package com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Solicitud de reprogramación de una cita")
public record CitaReprogramarRequest(
        @Schema(description = "Nueva fecha (YYYY-MM-DD)", example = "2026-10-09")
        String fecha,

        @Schema(description = "Nueva hora (HH:mm)", example = "11:00")
        String hora,

        @Schema(description = "Nueva duración en minutos", example = "45", allowableValues = {"30", "45", "60"})
        Integer duracionMinutos,

        @Schema(description = "Terapeuta explícito (multi-terapeuta o superadmin)", example = "ter-002")
        String terapeutaId
) {}
