package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Conteo de casos agrupados por protocolo clínico")
public record CasoProtocoloDTO(
        @Schema(description = "Nombre canónico del protocolo", example = "Ataque de Pánico")
        String protocolo,

        @Schema(description = "Número de casos del protocolo", example = "1")
        long casos
) {}
