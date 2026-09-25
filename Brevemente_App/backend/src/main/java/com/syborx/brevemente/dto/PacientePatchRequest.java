package com.syborx.brevemente.dto;

public record PacientePatchRequest(
    String name,
    String phone,
    String email,
    String status,
    String riskLevel,
    String motif,
    String sessionFrequency,
    CapacidadConsentimientoDTO capacidadConsentimiento,
    RepresentanteLegalDTO representante,
    Boolean consentimientoRepresentanteFirmado
) {}
