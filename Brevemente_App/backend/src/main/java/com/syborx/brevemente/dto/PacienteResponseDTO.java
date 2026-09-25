package com.syborx.brevemente.dto;

public record PacienteResponseDTO(
    String id,
    String name,
    String phone,
    String email,
    String birthDate,
    String curp,
    String registrationDate,
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
