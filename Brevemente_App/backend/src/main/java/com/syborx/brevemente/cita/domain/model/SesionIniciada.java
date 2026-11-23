package com.syborx.brevemente.cita.domain.model;

import java.time.LocalDate;

/**
 * Resultado del inicio de una sesión clínica desde una cita (contrato entre
 * los contextos {@code cita} y {@code expediente}), sin exponer el dominio completo.
 */
public record SesionIniciada(
        String id,
        String pacienteId,
        Integer numero,
        LocalDate fecha,
        String status,
        String citaId
) {}
