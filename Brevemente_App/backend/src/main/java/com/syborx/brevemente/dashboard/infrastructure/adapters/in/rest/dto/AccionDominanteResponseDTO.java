package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Acción operativa dominante del día: primera cita confirmada o pendiente de hoy")
public record AccionDominanteResponseDTO(
        @Schema(description = "Identificador de la cita", example = "cit-001")
        String citaId,

        @Schema(description = "Identificador del paciente", example = "pac-001")
        String pacienteId,

        @Schema(description = "Nombre completo del paciente", example = "Mateo Herrera Santos")
        String pacienteNombre,

        @Schema(description = "Nombre de visualización del terapeuta responsable", example = "Dra. Sofía Ramírez Lozano")
        String terapeutaNombre,

        @Schema(description = "Fecha de la cita (YYYY-MM-DD)", example = "2026-10-12")
        String fecha,

        @Schema(description = "Hora de inicio de la cita (HH:mm)", example = "09:00")
        String hora,

        @Schema(description = "Etapa clínica de la cita", example = "primera")
        String tipoCita,

        @Schema(description = "Modalidad de la sesión", example = "PRESENCIAL")
        String modalidad,

        @Schema(description = "Duración en minutos", example = "30")
        Integer duracionMinutos,

        @Schema(description = "Consultorio asignado", example = "A")
        String consultorio,

        @Schema(description = "Protocolo clínico (sin datos en esta fase)", nullable = true)
        String protocolo,

        @Schema(description = "Indica si el intake está listo (sin datos en esta fase)", example = "false")
        Boolean intakeListo,

        @Schema(description = "Indica si el consentimiento informado está firmado", example = "false")
        Boolean consentimientoFirmado,

        @Schema(description = "Indica si la grabación LEVA está disponible (sin datos en esta fase)", example = "false")
        Boolean grabacionLeva
) {}
