package com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Solicitud de cancelación de una cita propia del paciente")
public record CancelarCitaPortalRequest(
        @NotBlank(message = "El motivo es obligatorio")
        @Schema(description = "Motivo de cancelación (lista cerrada)", example = "CAMBIO_DE_PLANES")
        String motivo,

        @Schema(description = "Detalle del motivo (obligatorio si motivo=OTRO)", example = "Cambio de domicilio")
        String motivoDetalle
) {}
