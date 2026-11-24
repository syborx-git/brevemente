package com.syborx.brevemente.cita.domain.exception;

public class CitaBloqueadaPorNormativaException extends RuntimeException {
    public CitaBloqueadaPorNormativaException() {
        super("La cita está bloqueada por normativa (consentimiento pendiente).");
    }
}
