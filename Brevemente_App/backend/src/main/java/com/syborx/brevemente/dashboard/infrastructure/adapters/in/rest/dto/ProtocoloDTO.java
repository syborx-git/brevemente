package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Entrada del catálogo de protocolos clínicos")
public record ProtocoloDTO(
        @Schema(description = "Identificador del protocolo", example = "prot-panico")
        String id,

        @Schema(description = "Nombre canónico del protocolo", example = "Ataque de Pánico")
        String nombre
) {}
