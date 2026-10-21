package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Alerta operativa del centro de control clínico")
public record AlertaDashboardResponseDTO(
        @Schema(description = "Identificador único de la alerta", example = "consentimiento-pac-001")
        String id,

        @Schema(description = "Tipo de alerta",
                allowableValues = {"CONSENTIMIENTO", "RIESGO", "PENDIENTE_CLINICO"},
                example = "CONSENTIMIENTO")
        String tipo,

        @Schema(description = "Título breve de la alerta", example = "Consentimiento informado pendiente")
        String titulo,

        @Schema(description = "Descripción detallada de la alerta")
        String descripcion,

        @Schema(description = "Identificador del paciente asociado", example = "pac-001")
        String pacienteId,

        @Schema(description = "Nombre completo del paciente asociado", example = "Mateo Herrera Santos")
        String pacienteNombre
) {}
