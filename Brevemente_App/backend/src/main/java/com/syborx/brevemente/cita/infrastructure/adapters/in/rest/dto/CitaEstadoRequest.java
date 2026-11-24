package com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Cambio de estado de una cita")
public record CitaEstadoRequest(
        @NotBlank(message = "El estado es obligatorio")
        @Schema(description = "Nuevo estado de la cita", example = "confirmada",
                allowableValues = {"confirmada", "pendiente", "completada", "cancelada", "ausente", "no_presentado", "solicita_reagendar"})
        String status,

        @Schema(description = "Motivo de cancelación (obligatorio si status=cancelada)", example = "CAMBIO_DE_PLANES")
        String motivo,

        @Schema(description = "Detalle del motivo (obligatorio si motivo=OTRO)", example = "Cambio de domicilio")
        String motivoDetalle
) {}
