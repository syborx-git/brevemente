package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Solicitud de actualización parcial de atributos clínicos de un paciente")
public record PacientePatchRequest(
        @Schema(description = "Nombre completo del paciente", example = "Santiago Morales")
        String name,

        @Schema(description = "Teléfono de contacto", example = "+52 55 9876 5432")
        String phone,

        @Schema(description = "Correo electrónico", example = "santiago.morales@email.com")
        String email,

        @Schema(description = "Estado clínico", example = "completado")
        String status,

        @Schema(description = "Nivel de riesgo clínico", example = "bajo")
        String riskLevel,

        @Schema(description = "Motivo de consulta", example = "Seguimiento y cierre exitoso")
        String motif,

        @Schema(description = "Frecuencia de sesiones", example = "mensual")
        String sessionFrequency,

        @Schema(description = "Actualización de capacidad de consentimiento")
        CapacidadConsentimientoDTO capacidadConsentimiento,

        @Schema(description = "Actualización de representante")
        RepresentanteLegalDTO representante,

        @Schema(description = "Estatus de firma de consentimiento", example = "true")
        Boolean consentimientoRepresentanteFirmado
) {}
