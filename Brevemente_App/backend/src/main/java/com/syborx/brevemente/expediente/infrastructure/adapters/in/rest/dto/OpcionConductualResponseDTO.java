package com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Opción del catálogo conductual (#107)")
public record OpcionConductualResponseDTO(
        @Schema(example = "pedir_suavemente") String codigo,
        @Schema(example = "Pedir suavemente") String etiqueta,
        @Schema(example = "1") Integer orden
) {}
