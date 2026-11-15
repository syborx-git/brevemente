package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Contraseña temporal generada para el acceso del paciente al portal")
public record PasswordTemporalPacienteResponse(
        String passwordTemporal
) {
}
