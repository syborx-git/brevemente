package com.syborx.brevemente.paciente.domain.exception;

/**
 * Se lanza cuando la lista de sedes del terapeuta es inválida
 * (más de una principal, duplicados o sede inexistente).
 */
public class TerapeutaSedeInvalidaException extends RuntimeException {

    public TerapeutaSedeInvalidaException(String message) {
        super(message);
    }
}
