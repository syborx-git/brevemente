package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Determinación jurídica del consentimiento informado según NOM-004 y TBE")
public record CapacidadConsentimientoDTO(
        @Schema(description = "Estado legal del consentimiento", example = "AUTONOMO", allowableValues = {"AUTONOMO", "REPRESENTADO_POR_EDAD", "REPRESENTADO_POR_CONDICION", "PENDIENTE_DETERMINACION"})
        String estado,

        @Schema(description = "Identificador del terapeuta o evaluador clínico que determinó el estado", example = "ter-001")
        String determinadoPor,

        @Schema(description = "Fecha de determinación clínica (YYYY-MM-DD)", example = "2026-08-10")
        String fechaDeterminacion,

        @Schema(description = "Fecha programada de reevaluación clínica (YYYY-MM-DD)", example = "2026-12-10")
        String fechaRevision,

        @Schema(description = "Justificación o motivo clínico/jurídico de la determinación", example = "Mayor de 18 años con autonomía plena")
        String motivo
) {}
