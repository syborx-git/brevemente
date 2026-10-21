package com.syborx.brevemente.pago.domain.exception;

public class PagoNotFoundException extends RuntimeException {
    public PagoNotFoundException(String id) {
        super("Pago no encontrado: " + id);
    }
}
