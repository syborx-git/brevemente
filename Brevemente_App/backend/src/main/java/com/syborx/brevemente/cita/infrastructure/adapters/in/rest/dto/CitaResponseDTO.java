package com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Contrato de respuesta simétrico con la interfaz Appointment del frontend")
public record CitaResponseDTO(
        @Schema(description = "Identificador de la cita", example = "cit-001")
        String id,

        @Schema(description = "Identificador del paciente", example = "pac-001")
        String patientId,

        @Schema(description = "Nombre del paciente (denormalizado)", example = "Mateo Herrera Santos")
        String patientName,

        @Schema(description = "Fecha de la cita (YYYY-MM-DD)", example = "2026-10-07")
        String date,

        @Schema(description = "Hora de inicio (HH:mm)", example = "09:00")
        String time,

        @Schema(description = "Etapa clínica", example = "primera")
        String type,

        @Schema(description = "Estado de la cita", example = "confirmada")
        String status,

        @Schema(description = "Estado de pago", example = "pendiente")
        String paymentStatus,

        @Schema(description = "Terapeuta responsable", example = "ter-001")
        String terapeutaId,

        @Schema(description = "Duración en minutos", example = "30")
        Integer duration,

        @Schema(description = "Modalidad de la sesión", example = "PRESENCIAL")
        String modality,

        @Schema(description = "Consultorio", example = "A")
        String office,

        @Schema(description = "Indica si la cita está bloqueada por normativa", example = "false")
        Boolean bloqueadaPorNormativa
) {}
