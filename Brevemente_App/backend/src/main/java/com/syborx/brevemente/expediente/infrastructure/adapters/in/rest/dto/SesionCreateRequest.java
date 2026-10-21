package com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto;

import com.syborx.brevemente.expediente.domain.model.VcEntry;
import com.syborx.brevemente.expediente.domain.model.VgEntry;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Solicitud de registro de una nueva sesión clínica TBE")
public record SesionCreateRequest(
        @Schema(example = "2") Integer number,
        @Schema(example = "2026-08-17") String date,
        @Schema(example = "Intervención Estratégica") String phase,
        @Schema(example = "Fobia de rendimiento") String protocol,
        @Schema(example = "SPR Fóbico") String dxOp,
        String trastorno,
        List<String> px,
        String f1,
        String f2,
        String oss,
        String add,
        String cumplimiento,
        String rss,
        String eff,
        String notes,
        String observationsNextSession,
        String situation,
        String audioDuration,
        VcEntry valoracionCambio,
        VgEntry valoracionGlobal
) {}
