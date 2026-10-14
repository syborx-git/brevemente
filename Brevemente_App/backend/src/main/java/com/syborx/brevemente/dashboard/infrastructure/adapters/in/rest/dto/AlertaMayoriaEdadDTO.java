package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Alerta de mayoría de edad cumplida (requiere reconsentimiento autónomo)")
public record AlertaMayoriaEdadDTO(
        @Schema(description = "Identificador del paciente", example = "pac-001")
        String pacienteId,

        @Schema(description = "Nombre completo del paciente", example = "Mateo Herrera Santos")
        String nombre,

        @Schema(description = "Fecha de nacimiento (YYYY-MM-DD)", example = "2008-11-05")
        String fechaNacimiento,

        @Schema(description = "Representante legal previo", example = "Claudia Santos (Madre)")
        String representante
) {}
