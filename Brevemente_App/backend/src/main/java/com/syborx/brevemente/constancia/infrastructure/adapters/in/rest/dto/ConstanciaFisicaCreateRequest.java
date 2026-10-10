package com.syborx.brevemente.constancia.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Solicitud de registro de una constancia física")
public record ConstanciaFisicaCreateRequest(
        @Schema(example = "pac-001") String patientId,
        String physicalFolio,
        String issueDate,
        String type,
        String issuerName,
        String issuerLicense,
        String recipient,
        String purpose,
        String periodCovered,
        Integer sessionsCount,
        String clinicalSummary,
        String digitalScanUrl,
        String scanFileName,
        String deliveredTo
) {}
