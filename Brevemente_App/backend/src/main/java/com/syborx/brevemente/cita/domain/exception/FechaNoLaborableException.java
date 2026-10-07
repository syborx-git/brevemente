package com.syborx.brevemente.cita.domain.exception;

public class FechaNoLaborableException extends RuntimeException {
    public FechaNoLaborableException(String fecha) {
        super("La fecha " + fecha + " es un día no laborable (festivo o día personal).");
    }
}
