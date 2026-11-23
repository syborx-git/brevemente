package com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto;

import com.syborx.brevemente.cita.domain.model.SesionIniciada;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta del inicio de sesión clínica desde una cita")
public record SesionIniciadaResponseDTO(
        @Schema(example = "ses-abc12345") String id,
        @Schema(example = "pac-001") String patientId,
        @Schema(example = "3") Integer number,
        @Schema(example = "2026-11-23") String date,
        @Schema(example = "borrador") String status,
        @Schema(example = "cit-001") String citaId
) {
    public static SesionIniciadaResponseDTO from(SesionIniciada s) {
        if (s == null) return null;
        return new SesionIniciadaResponseDTO(
                s.id(),
                s.pacienteId(),
                s.numero(),
                s.fecha() != null ? s.fecha().toString() : null,
                s.status(),
                s.citaId()
        );
    }
}
