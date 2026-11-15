package com.syborx.brevemente.auth.domain.exception;

/** La nueva contraseña no cumple la política (longitud/complejidad). */
public class PasswordInvalidaException extends RuntimeException {

    public PasswordInvalidaException(String message) {
        super(message);
    }
}
