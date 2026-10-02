package com.syborx.brevemente.auth.domain.exception;

/**
 * Excepción de negocio lanzada cuando las credenciales no son válidas
 * (usuario inexistente, inactivo o contraseña incorrecta).
 */
public class CredencialesInvalidasException extends RuntimeException {

    public CredencialesInvalidasException() {
        super("Credenciales inválidas");
    }
}
