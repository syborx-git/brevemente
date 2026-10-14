package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Paciente con admisión clínica pendiente, priorizado por su próxima cita")
public record PendientePrioritarioDTO(
        @Schema(description = "Identificador del paciente", example = "pac-003")
        String pacienteId,

        @Schema(description = "Nombre completo del paciente", example = "Emiliano Díaz Corona")
        String nombre,

        @Schema(description = "Hora de la próxima cita (HH:mm)", example = "11:00")
        String horaCita,

        @Schema(description = "Motivo del pendiente clínico")
        String motivo
) {}
