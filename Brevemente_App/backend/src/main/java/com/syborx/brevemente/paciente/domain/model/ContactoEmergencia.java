package com.syborx.brevemente.paciente.domain.model;

/**
 * Contacto de emergencia del paciente (Datos Generales, GAP-HC-08).
 */
public record ContactoEmergencia(
        String nombre,
        String parentesco,
        String telefono
) {}
