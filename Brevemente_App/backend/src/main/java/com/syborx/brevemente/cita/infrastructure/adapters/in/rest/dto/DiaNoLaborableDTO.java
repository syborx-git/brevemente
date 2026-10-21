package com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Día no laborable (festivo oficial o día personal)")
public record DiaNoLaborableDTO(
        @Schema(description = "Identificador", example = "hol-1")
        String id,

        @Schema(description = "Fecha (YYYY-MM-DD)", example = "2026-01-01")
        String fecha,

        @Schema(description = "Nombre descriptivo", example = "Año Nuevo")
        String nombre,

        @Schema(description = "Tipo de día no laborable", example = "oficial", allowableValues = {"oficial", "personal"})
        String tipo,

        @Schema(description = "Terapeuta propietario (null para festivos oficiales)", example = "ter-001")
        String terapeutaId
) {}
