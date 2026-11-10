package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Paciente creado junto con su contraseña temporal de acceso al portal")
public record PacienteCreadoDTO(
        PacienteResponseDTO paciente,
        String passwordTemporal
) {
}
