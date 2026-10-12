package com.syborx.brevemente.leva.domain.exception;

public class TranscriptionTaskNotFoundException extends LevaException {
    public TranscriptionTaskNotFoundException(String taskId) {
        super("No se encontró la tarea de transcripción con ID: " + taskId);
    }
}
