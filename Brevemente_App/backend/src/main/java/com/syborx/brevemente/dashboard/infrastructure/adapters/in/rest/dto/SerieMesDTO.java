package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Punto de la serie mensual de citas del Centro de Control")
public record SerieMesDTO(
        @Schema(description = "Etiqueta corta del mes en español (Jul, Ago, Sep...)", example = "Ago")
        String month,

        @Schema(description = "Total de citas del mes (todas las citas, sin filtrar por estado)", example = "6")
        long citas
) {}
