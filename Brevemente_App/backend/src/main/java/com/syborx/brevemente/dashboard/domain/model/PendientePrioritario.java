package com.syborx.brevemente.dashboard.domain.model;

/**
 * Paciente con admisión clínica pendiente, priorizado por su próxima cita.
 * {@code horaCita} viene formateada {@code HH:mm} (o {@code null} si no hay cita).
 */
public record PendientePrioritario(
        String pacienteId,
        String nombre,
        String horaCita,
        String motivo
) {}
