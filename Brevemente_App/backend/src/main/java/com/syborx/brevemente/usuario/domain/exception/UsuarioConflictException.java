package com.syborx.brevemente.usuario.domain.exception;

/** Conflicto de regla de negocio (email/cédula duplicada, último admin, auto-suspensión). */
public class UsuarioConflictException extends RuntimeException {
    public UsuarioConflictException(String message) {
        super(message);
    }
}
