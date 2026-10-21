package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Sede de atención del terapeuta")
public record TerapeutaSedeDTO(
        @Schema(description = "Identificador de la sede", example = "sede-centro")
        String id,

        @Schema(description = "Nombre de la sede", example = "Sede Centro BreveMente")
        String nombre,

        @Schema(description = "Indica si es la sede principal del terapeuta")
        boolean esPrincipal
) {}
