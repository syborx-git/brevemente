package com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Tratamiento psicoterapéutico previo")
public record TratamientoPrevioResponseDTO(
        @Schema(example = "trat-001") String id,
        @Schema(example = "Psicoanálisis") String enfoque,
        @Schema(example = "2 años") String duracion,
        @Schema(description = "Resultado", allowableValues = {"resuelto", "mejorado", "invariable", "drop_out", "otro"}) String resultado
) {}
