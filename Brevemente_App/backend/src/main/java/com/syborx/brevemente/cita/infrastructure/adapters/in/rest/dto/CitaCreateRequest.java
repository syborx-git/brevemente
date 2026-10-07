package com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Solicitud de alta de una cita en la agenda")
public record CitaCreateRequest(
        @NotBlank(message = "El paciente es obligatorio")
        @Schema(description = "Identificador del paciente", example = "pac-001")
        String pacienteId,

        @Schema(description = "Terapeuta explícito (solo obligatorio si el usuario opera varios terapeutas o es superadmin)", example = "ter-001")
        String terapeutaId,

        @NotBlank(message = "La fecha es obligatoria")
        @Schema(description = "Fecha de la cita (YYYY-MM-DD)", example = "2026-10-08")
        String fecha,

        @NotBlank(message = "La hora es obligatoria")
        @Schema(description = "Hora de inicio (HH:mm)", example = "10:00")
        String hora,

        @NotBlank(message = "El tipo es obligatorio")
        @Schema(description = "Etapa clínica de la cita", example = "seguimiento", allowableValues = {"primera", "seguimiento", "cierre"})
        String tipo,

        @Schema(description = "Duración en minutos (default 30)", example = "30", allowableValues = {"30", "45", "60"})
        Integer duracionMinutos,

        @Schema(description = "Modalidad de la sesión", example = "PRESENCIAL", allowableValues = {"PRESENCIAL", "ONLINE"})
        String modalidad,

        @Schema(description = "Consultorio (solo PRESENCIAL)", example = "A", allowableValues = {"A", "B"})
        String consultorio
) {}
