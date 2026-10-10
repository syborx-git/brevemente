package com.syborx.brevemente.supervision.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Bitácora de supervisión clínica, simétrica con SupervisionLog del frontend")
public record SupervisionLogResponseDTO(
        String id,
        String date,
        String supervisorName,
        String supervisorLicense,
        String patientId,
        String patientName,
        String therapistId,
        String therapistName,
        Integer sessionNumber,
        String problemDefinition,
        String currentSituation,
        String spr,
        String ts,
        String therapistProblem,
        String rst,
        String px,
        String eff,
        String doubt,
        String blocking,
        String observations,
        String recommendations
) {}
