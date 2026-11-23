package com.syborx.brevemente.expediente.domain.exception;

/**
 * Se lanza al intentar registrar una segunda sesión clínica para la misma cita
 * (integridad "1 sesión por cita").
 */
public class SesionPorCitaExistenteException extends RuntimeException {
    public SesionPorCitaExistenteException(String message) {
        super(message);
    }
}
