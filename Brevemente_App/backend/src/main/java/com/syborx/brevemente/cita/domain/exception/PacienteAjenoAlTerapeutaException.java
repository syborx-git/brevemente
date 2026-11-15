package com.syborx.brevemente.cita.domain.exception;

/**
 * Indica que el paciente no está asignado al terapeuta para el que se intenta
 * agendar/reprogramar la cita (regla de pertenencia paciente → terapeuta).
 */
public class PacienteAjenoAlTerapeutaException extends RuntimeException {
    public PacienteAjenoAlTerapeutaException(String message) {
        super(message);
    }
}
