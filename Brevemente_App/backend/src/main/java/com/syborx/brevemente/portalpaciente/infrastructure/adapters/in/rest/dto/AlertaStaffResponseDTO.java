package com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Alerta de crisis/seguridad clínica visible para el staff")
public record AlertaStaffResponseDTO(
        @Schema(description = "Identificador único de la alerta", example = "alerta-pac-002") String id,
        @Schema(description = "Identificador del paciente", example = "pac-002") String pacienteId,
        @Schema(description = "Nombre completo del paciente", example = "Valeria Gómez Fuentes") String pacienteNombre,
        @Schema(description = "Tipo de alerta", example = "crisis",
                allowableValues = {"crisis", "seguridad_clinica", "crisis_atendida"}) String tipo,
        @Schema(description = "Estado de la alerta", example = "activa",
                allowableValues = {"activa", "resuelta"}) String estado,
        @Schema(description = "Mensaje de la alerta", example = "ALERTA ROJA: ...") String mensaje,
        @Schema(description = "Fecha de creación (ISO-8601)", example = "2026-10-21T08:00:00-06:00") String createdAt,
        @Schema(description = "Quién resolvió la alerta") String resueltaPor,
        @Schema(description = "Cuándo se resolvió la alerta (ISO-8601)") String resueltaEn
) {}
