package com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Actualización parcial (PATCH) de una sesión clínica TBE; solo los campos presentes se fusionan")
public record SesionUpdateRequest(
        @Schema(example = "Intervención Estratégica") String phase,
        @Schema(example = "Miedo al conflicto") String significado,
        @Schema(example = "SPR Fóbico") String dxOp,
        @Schema(example = "SPR Obsesivo-Compulsivo") String spr,
        String trastorno,
        List<String> px,
        String oss,
        String add,
        String rss,
        @Schema(example = "validado") String status
) {}
