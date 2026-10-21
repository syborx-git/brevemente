package com.syborx.brevemente.expediente.domain.exception;

public class SesionInvalidaException extends RuntimeException {
    public SesionInvalidaException(String message) {
        super(message);
    }
}
