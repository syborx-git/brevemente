package com.syborx.brevemente.paciente.domain.exception;

public class PacienteConflictException extends RuntimeException {
    public PacienteConflictException(String message) {
        super(message);
    }
}
