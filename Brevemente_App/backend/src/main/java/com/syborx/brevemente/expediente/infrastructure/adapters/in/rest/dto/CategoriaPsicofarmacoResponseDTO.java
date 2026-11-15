package com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Categoría del catálogo de psicofármacos")
public record CategoriaPsicofarmacoResponseDTO(
        @Schema(example = "isrs") String codigo,
        @Schema(example = "Antidepresivos ISRS") String etiqueta,
        @Schema(example = "2") Integer orden
) {}
