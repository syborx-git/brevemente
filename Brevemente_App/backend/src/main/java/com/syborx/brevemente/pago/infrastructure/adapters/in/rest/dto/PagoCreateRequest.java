package com.syborx.brevemente.pago.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Solicitud de registro de un pago")
public record PagoCreateRequest(
        @Schema(example = "pac-001") String patientId,
        String appointmentId,
        @Schema(example = "Sesión 3 · Seguimiento") String concept,
        @Schema(example = "800.00") BigDecimal amount,
        @Schema(example = "2026-08-24") String date,
        @Schema(example = "transferencia") String method,
        @Schema(example = "pendiente") String status,
        String notes
) {}
