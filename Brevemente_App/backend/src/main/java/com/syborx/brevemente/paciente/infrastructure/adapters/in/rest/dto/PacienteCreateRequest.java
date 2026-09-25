package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Solicitud de alta de un nuevo paciente en el directorio clínico")
public record PacienteCreateRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Schema(description = "Nombre completo del paciente", example = "Santiago Morales Vega")
        String name,

        @Schema(description = "Teléfono de contacto", example = "+52 55 9876 5432")
        String phone,

        @Schema(description = "Correo electrónico", example = "santiago.morales@email.com")
        String email,

        @Schema(description = "Fecha de nacimiento (YYYY-MM-DD)", example = "2002-05-14")
        String birthDate,

        @Size(max = 18, message = "El CURP no puede exceder 18 caracteres")
        @Schema(description = "CURP oficial del paciente", example = "MOVS020514HDFRL01")
        String curp,

        @Schema(description = "Estado inicial del tratamiento", example = "activo")
        String status,

        @Schema(description = "Nivel de riesgo inicial", example = "bajo")
        String riskLevel,

        @Schema(description = "Modo de registro", example = "manual")
        String registryMode,

        @Schema(description = "Motivo inicial de consulta", example = "Ansiedad social y bloqueos en juntas")
        String motif,

        @Schema(description = "Terapeuta responsable asignado", example = "ter-001")
        String therapistId,

        @Schema(description = "Nombre del terapeuta", example = "Dr. Alejandro Silva")
        String therapistName,

        @Schema(description = "Alias de fecha de nacimiento", example = "2002-05-14")
        String fechaNacimiento,

        @Schema(description = "Edad calculada", example = "24")
        Integer edadCalculada,

        @Schema(description = "Determinación jurídica del consentimiento")
        CapacidadConsentimientoDTO capacidadConsentimiento,

        @Schema(description = "Quién realiza el registro", example = "PACIENTE")
        String quienCompletaRegistro,

        @Schema(description = "Datos del representante (si es menor)")
        RepresentanteLegalDTO representante,

        @Schema(description = "Teléfono personal", example = "+52 55 9876 5432")
        String telefonoPaciente,

        @Schema(description = "Consentimiento de representante firmado", example = "false")
        Boolean consentimientoRepresentanteFirmado,

        @Schema(description = "Frecuencia sugerida de sesiones", example = "semanal")
        String sessionFrequency
) {}
