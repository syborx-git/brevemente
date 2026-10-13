package com.syborx.brevemente.leva.domain.exception;

public class LevaException extends RuntimeException {
    public LevaException(String message) {
        super(message);
    }

    public LevaException(String message, Throwable cause) {
        super(message, cause);
    }
}
