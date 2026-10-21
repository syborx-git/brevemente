package com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto;

import com.syborx.brevemente.expediente.domain.model.VcEntry;
import com.syborx.brevemente.expediente.domain.model.VgEntry;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Contrato de respuesta de sesión clínica TBE, simétrico con Session del frontend Angular")
public record SesionResponseDTO(
        @Schema(example = "ses-001") String id,
        @Schema(example = "pac-001") String patientId,
        @Schema(example = "1") Integer number,
        @Schema(example = "2026-08-10") String date,
        @Schema(example = "Definición del problema") String phase,
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
        @Schema(example = "borrador") String status,
        @Schema(description = "Valoración del Cambio de la sesión") VcEntry valoracionCambio,
        @Schema(description = "Valoración Global de la sesión") VgEntry valoracionGlobal
) {}
