package com.syborx.brevemente.auth.domain.exception;

/** La contraseña actual (o de confirmación en step-up) no coincide. */
public class PasswordActualIncorrectaException extends RuntimeException {

    public PasswordActualIncorrectaException() {
        super("La contraseña actual no coincide");
    }
}
