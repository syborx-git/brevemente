package com.syborx.brevemente.constancia.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Contrato de respuesta de una constancia física, simétrico con PhysicalCertificateLog del frontend")
public record ConstanciaFisicaResponseDTO(
        @Schema(example = "con-fis-001") String id,
        String patientId,
        String patientName,
        @Schema(example = "CONST-2026-084-FIS") String physicalFolio,
        @Schema(example = "2026-08-20") String issueDate,
        @Schema(example = "psicoterapeutica") String type,
        String issuerName,
        String issuerLicense,
        String recipient,
        String purpose,
        String periodCovered,
        Integer sessionsCount,
        String clinicalSummary,
        String digitalScanUrl,
        String scanFileName,
        String deliveredTo,
        @Schema(example = "entregada_en_fisico") String status,
        String registeredBy,
        String registeredAt
) {}
