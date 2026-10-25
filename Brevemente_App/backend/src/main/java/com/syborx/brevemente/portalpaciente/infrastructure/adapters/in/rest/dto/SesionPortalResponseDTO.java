package com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Sesión con prescripciones del paciente (px como JSON string)")
public record SesionPortalResponseDTO(
        @Schema(description = "Identificador de la sesión", example = "ses-001")
        String id,

        @Schema(description = "Identificador de la cita vinculada", example = "cit-001")
        String citaId,

        @Schema(description = "Número de sesión", example = "1")
        Integer numero,

        @Schema(description = "Fecha de la sesión (YYYY-MM-DD)", example = "2026-08-10")
        String fecha,

        @Schema(description = "Prescripciones asignadas (JSON array serializado)", example = "[\"Cómo empeorar\"]")
        String px,

        @Schema(description = "Nota de seguimiento de la sesión")
        String notas
) {}
