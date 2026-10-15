package com.syborx.brevemente.paciente.domain.exception;

/**
 * Se lanza cuando no existe un terapeuta con la configuración solicitada.
 */
public class TerapeutaConfigNotFoundException extends RuntimeException {

    public TerapeutaConfigNotFoundException(String message) {
        super(message);
    }
}
