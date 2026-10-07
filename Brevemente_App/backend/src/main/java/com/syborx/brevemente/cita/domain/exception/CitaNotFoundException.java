package com.syborx.brevemente.cita.domain.exception;

public class CitaNotFoundException extends RuntimeException {
    public CitaNotFoundException(String id) {
        super("No se encontró la cita con id: " + id);
    }
}
