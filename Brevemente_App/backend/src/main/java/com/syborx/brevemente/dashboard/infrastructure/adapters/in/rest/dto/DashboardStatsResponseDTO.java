package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Métricas agregadas del centro de control clínico")
public record DashboardStatsResponseDTO(
        @Schema(description = "Número de pacientes con estatus 'activo'", example = "12")
        long pacientesActivos,

        @Schema(description = "Citas de hoy en estado confirmada, pendiente o solicita_reagendar", example = "3")
        long citasHoyCount,

        @Schema(description = "Alertas por consentimiento informado pendiente de firma", example = "2")
        long alertasConsentimiento,

        @Schema(description = "Alertas por nivel de riesgo clínico medio o alto", example = "4")
        long alertasRiesgo,

        @Schema(description = "Pacientes con estatus clínico 'pendiente'", example = "1")
        long pendientesClinicos
) {}
