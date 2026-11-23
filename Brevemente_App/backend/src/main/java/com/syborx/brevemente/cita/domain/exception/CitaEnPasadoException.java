package com.syborx.brevemente.cita.domain.exception;

public class CitaEnPasadoException extends RuntimeException {
    public CitaEnPasadoException() {
        super("No se puede agendar una cita en una fecha u hora pasadas.");
    }
}
