package com.syborx.brevemente.supervision.domain.exception;

public class SolicitudNotFoundException extends RuntimeException {
    public SolicitudNotFoundException(String id) {
        super("Solicitud de supervisión no encontrada: " + id);
    }
}
