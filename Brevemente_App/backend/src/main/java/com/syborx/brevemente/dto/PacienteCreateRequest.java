package com.syborx.brevemente.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PacienteCreateRequest(
    @NotBlank(message = "El nombre es obligatorio")
    String name,

    String phone,
    String email,

    String birthDate,

    @Size(max = 18, message = "El CURP no puede exceder 18 caracteres")
    String curp,

    String status,
    String riskLevel,
    String registryMode,
    String motif,
    String therapistId,
    String therapistName,
    String fechaNacimiento,
    Integer edadCalculada,
    CapacidadConsentimientoDTO capacidadConsentimiento,
    String quienCompletaRegistro,
    RepresentanteLegalDTO representante,
    String telefonoPaciente,
    Boolean consentimientoRepresentanteFirmado,
    String sessionFrequency
) {}
