package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Entrada del catálogo de sedes")
public record SedeDTO(
        @Schema(description = "Identificador de la sede", example = "sede-centro")
        String id,

        @Schema(description = "Nombre de la sede", example = "Sede Centro BreveMente")
        String nombre
) {}
