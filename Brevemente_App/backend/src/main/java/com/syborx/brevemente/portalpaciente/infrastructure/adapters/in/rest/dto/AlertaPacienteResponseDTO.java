package com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Alerta dirigida al paciente (crisis, seguridad clínica, crisis atendida)")
public record AlertaPacienteResponseDTO(
        @Schema(description = "Identificador de la alerta", example = "alerta-pac-001")
        String id,

        @Schema(description = "Tipo de alerta", example = "seguridad_clinica",
                allowableValues = {"crisis", "seguridad_clinica", "crisis_atendida"})
        String tipo,

        @Schema(description = "Mensaje de la alerta")
        String mensaje,

        @Schema(description = "Estado de la alerta", example = "activa",
                allowableValues = {"activa", "resuelta"})
        String estado,

        @Schema(description = "Quién resolvió la alerta", nullable = true)
        String resueltaPor,

        @Schema(description = "Fecha de resolución (ISO-8601)", nullable = true)
        String resueltaEn,

        @Schema(description = "Fecha de creación (ISO-8601)", example = "2026-10-19T10:00:00-06:00")
        String createdAt
) {}
