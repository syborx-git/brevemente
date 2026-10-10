package com.syborx.brevemente.pago.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Contrato de respuesta de un pago, simétrico con Payment del frontend Angular")
public record PagoResponseDTO(
        @Schema(example = "pay-001") String id,
        @Schema(example = "pac-001") String patientId,
        String patientName,
        String appointmentId,
        @Schema(example = "Sesión 1 · Seguimiento") String concept,
        @Schema(example = "800.00") BigDecimal amount,
        @Schema(example = "2026-08-10") String date,
        @Schema(example = "transferencia") String method,
        @Schema(example = "pagado") String status,
        String notes,
        String registeredBy,
        String createdAt
) {}
