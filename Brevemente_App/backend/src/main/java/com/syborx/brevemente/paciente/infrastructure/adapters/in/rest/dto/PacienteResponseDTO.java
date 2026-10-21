package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Contrato de respuesta clínica simétrico con la interfaz Patient del Frontend Angular")
public record PacienteResponseDTO(
        @Schema(description = "Identificador único del paciente (UUID o slug)", example = "pac-001")
        String id,

        @Schema(description = "Nombre completo del paciente", example = "Mateo Herrera Santos")
        String name,

        @Schema(description = "Teléfono de contacto", example = "+52 55 1234 5678")
        String phone,

        @Schema(description = "Correo electrónico", example = "contacto.mateo@familia.mx")
        String email,

        @Schema(description = "Fecha de nacimiento en formato ISO YYYY-MM-DD", example = "2008-11-05")
        String birthDate,

        @Schema(description = "Clave Única de Registro de Población (18 caracteres)", example = "HESM081105HDFRNT01")
        String curp,

        @Schema(description = "Fecha de registro en la plataforma (YYYY-MM-DD)", example = "2026-09-24")
        String registrationDate,

        @Schema(description = "Estado actual del tratamiento clínico", example = "activo", allowableValues = {"activo", "completado", "archivado", "pendiente"})
        String status,

        @Schema(description = "Nivel de riesgo clínico detectado según modelo TBE", example = "medio", allowableValues = {"bajo", "medio", "alto"})
        String riskLevel,

        @Schema(description = "Modalidad de registro", example = "manual", allowableValues = {"ia", "manual"})
        String registryMode,

        @Schema(description = "Motivo principal de consulta psicoterapéutica", example = "Bloqueo fóbico en situaciones de examen y alta autoexigencia académica.")
        String motif,

        @Schema(description = "Identificador del terapeuta titular asignado", example = "ter-001")
        String therapistId,

        @Schema(description = "Nombre completo del terapeuta titular", example = "Dra. Sofía Ramírez Lozano")
        String therapistName,

        @Schema(description = "Alias de fecha de nacimiento", example = "2008-11-05")
        String fechaNacimiento,

        @Schema(description = "Edad calculada en años al momento de la consulta", example = "17")
        Integer edadCalculada,

        @Schema(description = "Determinación jurídica del consentimiento")
        CapacidadConsentimientoDTO capacidadConsentimiento,

        @Schema(description = "Indica quién efectuó el registro del expediente", example = "FAMILIAR_O_APOYO", allowableValues = {"PACIENTE", "FAMILIAR_O_APOYO"})
        String quienCompletaRegistro,

        @Schema(description = "Representante legal o persona de apoyo (si aplica)")
        RepresentanteLegalDTO representante,

        @Schema(description = "Teléfono personal del paciente", example = "+52 55 1234 5678")
        String telefonoPaciente,

        @Schema(description = "Indicador de si el consentimiento normativo ya fue firmado", example = "true")
        Boolean consentimientoRepresentanteFirmado,

        @Schema(description = "Frecuencia de sesiones recomendada en TBE", example = "semanal", allowableValues = {"semanal", "quincenal", "mensual"})
        String sessionFrequency
) {}
