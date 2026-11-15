package com.syborx.brevemente.expediente.domain.exception;

public class SesionNotFoundException extends RuntimeException {
    public SesionNotFoundException(String message) {
        super(message);
    }
}
