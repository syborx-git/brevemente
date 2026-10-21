package com.syborx.brevemente.expediente.domain.exception;

public class ConsentimientoYaFirmadoException extends RuntimeException {
    public ConsentimientoYaFirmadoException(String pacienteId) {
        super("El consentimiento del paciente " + pacienteId + " ya fue firmado.");
    }
}
