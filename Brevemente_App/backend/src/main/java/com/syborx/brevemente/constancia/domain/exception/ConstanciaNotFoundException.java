package com.syborx.brevemente.constancia.domain.exception;

public class ConstanciaNotFoundException extends RuntimeException {
    public ConstanciaNotFoundException(String id) {
        super("Constancia no encontrada: " + id);
    }
}
