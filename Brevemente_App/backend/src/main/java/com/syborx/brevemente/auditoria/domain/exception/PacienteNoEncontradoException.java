package com.syborx.brevemente.auditoria.domain.exception;

public class PacienteNoEncontradoException extends RuntimeException {
    public PacienteNoEncontradoException(String pacienteId) {
        super("Paciente no encontrado: " + pacienteId);
    }
}
