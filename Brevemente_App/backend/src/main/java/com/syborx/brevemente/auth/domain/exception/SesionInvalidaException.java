package com.syborx.brevemente.auth.domain.exception;

/**
 * Sesión no renovable: refresh token ausente, desconocido, expirado, revocado
 * o perteneciente a una cuenta inactiva. Se traduce a HTTP 401.
 */
public class SesionInvalidaException extends RuntimeException {

    public SesionInvalidaException() {
        super("Sesión inválida o expirada");
    }
}
