package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Catálogos de apoyo del Centro de Control")
public record CatalogosDashboardDTO(
        @Schema(description = "Sedes disponibles (V11)")
        List<SedeDTO> sedes,

        @Schema(description = "Protocolos clínicos disponibles (V12)")
        List<ProtocoloDTO> protocolos,

        @Schema(description = "Terapeutas con nombre de visualización")
        List<TerapeutaDTO> terapeutas,

        @Schema(description = "Modalidades canónicas en mayúsculas", example = "[\"PRESENCIAL\",\"ONLINE\"]")
        List<String> modalidades
) {}
