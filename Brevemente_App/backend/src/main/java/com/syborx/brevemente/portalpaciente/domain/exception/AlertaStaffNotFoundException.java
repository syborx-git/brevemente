package com.syborx.brevemente.portalpaciente.domain.exception;

/**
 * Se lanza cuando no existe una alerta de staff con el identificador indicado.
 */
public class AlertaStaffNotFoundException extends RuntimeException {

    public AlertaStaffNotFoundException(String id) {
        super("No se encontró la alerta de staff con id: " + id);
    }
}
