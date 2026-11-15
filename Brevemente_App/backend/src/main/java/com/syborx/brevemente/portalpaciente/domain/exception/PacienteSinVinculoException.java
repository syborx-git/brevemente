package com.syborx.brevemente.portalpaciente.domain.exception;

/**
 * Se lanza cuando el principal no tiene un {@code pacienteId} resoluble
 * (p. ej. un paciente sin vínculo {@code pacientes.usuario_id}).
 * Mapeada a 403 Forbidden.
 */
public class PacienteSinVinculoException extends RuntimeException {

    public PacienteSinVinculoException(String message) {
        super(message);
    }
}
