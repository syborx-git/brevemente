package com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Criterio clínico de una sesión (categoría + valor)")
public record CriterioClinicoRequest(
        @Schema(example = "conductual") String categoria,
        @Schema(example = "delegar") String valor
) {}
