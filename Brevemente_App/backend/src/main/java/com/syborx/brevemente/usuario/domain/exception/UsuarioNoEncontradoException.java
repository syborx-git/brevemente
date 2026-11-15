package com.syborx.brevemente.usuario.domain.exception;

/** El usuario solicitado no existe. */
public class UsuarioNoEncontradoException extends RuntimeException {
    public UsuarioNoEncontradoException(String message) {
        super(message);
    }
}
