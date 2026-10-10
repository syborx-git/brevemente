package com.syborx.brevemente.expediente.domain.exception;

public class ExpedienteNotFoundException extends RuntimeException {
    public ExpedienteNotFoundException(String detalle) {
        super("No existe expediente para: " + detalle);
    }
}
