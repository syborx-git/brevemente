package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Sede del terapeuta a crear o actualizar")
public record TerapeutaSedeRequestDTO(
        @NotBlank
        @Schema(description = "Identificador de la sede", example = "sede-centro")
        String sedeId,

        @Schema(description = "Indica si es la sede principal del terapeuta")
        boolean esPrincipal
) {}
