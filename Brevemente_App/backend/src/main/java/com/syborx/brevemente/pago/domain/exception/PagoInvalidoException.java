package com.syborx.brevemente.pago.domain.exception;

public class PagoInvalidoException extends RuntimeException {
    public PagoInvalidoException(String message) {
        super(message);
    }
}
