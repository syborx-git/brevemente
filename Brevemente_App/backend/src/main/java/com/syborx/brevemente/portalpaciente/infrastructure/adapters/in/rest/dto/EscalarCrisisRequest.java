package com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Solicitud de escalamiento de crisis desde el portal")
public record EscalarCrisisRequest(
        @Schema(description = "Mensaje opcional del paciente", example = "Necesito ayuda urgente")
        @NotBlank(message = "El mensaje de crisis es obligatorio")
        String mensaje
) {}
