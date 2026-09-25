package com.syborx.brevemente.paciente.domain.exception;

public class PacienteNotFoundException extends RuntimeException {
    public PacienteNotFoundException(String id) {
        super("Paciente no encontrado con el identificador: " + id);
    }
}
