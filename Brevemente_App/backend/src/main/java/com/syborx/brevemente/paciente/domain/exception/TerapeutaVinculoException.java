package com.syborx.brevemente.paciente.domain.exception;

/**
 * Se lanza cuando no es posible resolver un único terapeuta a partir de la
 * identidad autenticada (varios terapeutas vinculados sin selección explícita,
 * o ninguno vinculado y sin `terapeutaId` explícito).
 */
public class TerapeutaVinculoException extends RuntimeException {

    public TerapeutaVinculoException(String message) {
        super(message);
    }
}
