package com.syborx.brevemente.cita.domain.exception;

public class SinTerapeutaVinculadoException extends RuntimeException {
    public SinTerapeutaVinculadoException() {
        super("El usuario autenticado no tiene un terapeuta vinculado para agendar citas.");
    }
}
