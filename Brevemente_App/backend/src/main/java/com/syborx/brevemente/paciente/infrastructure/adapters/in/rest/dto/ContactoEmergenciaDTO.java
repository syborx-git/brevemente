package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Contacto de emergencia del paciente")
public record ContactoEmergenciaDTO(
        @Schema(example = "Claudia Santos") String nombre,
        @Schema(example = "MADRE") String parentesco,
        @Schema(example = "5522334455") String telefono
) {}
