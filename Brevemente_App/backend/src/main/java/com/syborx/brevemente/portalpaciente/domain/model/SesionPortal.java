package com.syborx.brevemente.portalpaciente.domain.model;

/**
 * Sesión con prescripciones, ligada a una cita del paciente.
 * {@code px} se expone como JSON string (JSONB en BD); el frontend lo parsea.
 */
public record SesionPortal(
        String id,
        String citaId,
        Integer numero,
        String fecha,
        String px,
        String notas
) {}
