package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Segmento de la distribución por Fase TBE")
public record DistribucionFaseDTO(
        @Schema(description = "Nombre canónico de la fase TBE", example = "Fase 2: Desbloqueo")
        String fase,

        @Schema(description = "Número de pacientes en la fase", example = "2")
        long valor
) {}
