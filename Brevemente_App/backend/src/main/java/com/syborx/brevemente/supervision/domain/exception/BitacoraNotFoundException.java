package com.syborx.brevemente.supervision.domain.exception;

public class BitacoraNotFoundException extends RuntimeException {
    public BitacoraNotFoundException(String id) {
        super("Bitácora de supervisión no encontrada: " + id);
    }
}
