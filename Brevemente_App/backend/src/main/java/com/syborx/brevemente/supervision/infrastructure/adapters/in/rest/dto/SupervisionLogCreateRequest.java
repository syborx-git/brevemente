package com.syborx.brevemente.supervision.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Solicitud de registro de una bitácora de supervisión")
public record SupervisionLogCreateRequest(
        String patientId,
        String therapistId,
        String date,
        Integer sessionNumber,
        String supervisorName,
        String supervisorLicense,
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
