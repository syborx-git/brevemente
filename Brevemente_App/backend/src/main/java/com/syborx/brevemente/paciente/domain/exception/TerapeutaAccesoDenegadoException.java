package com.syborx.brevemente.paciente.domain.exception;

/**
 * Se lanza cuando el usuario no tiene acceso (lectura o escritura)
 * al terapeuta solicitado. Se traduce a HTTP 403 Forbidden.
 */
public class TerapeutaAccesoDenegadoException extends RuntimeException {

    public TerapeutaAccesoDenegadoException(String message) {
        super(message);
    }
}
