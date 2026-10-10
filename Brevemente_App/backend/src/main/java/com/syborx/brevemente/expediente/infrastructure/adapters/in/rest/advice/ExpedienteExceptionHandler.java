package com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.advice;

import com.syborx.brevemente.expediente.domain.exception.ConsentimientoYaFirmadoException;
import com.syborx.brevemente.expediente.domain.exception.ExpedienteNotFoundException;
import com.syborx.brevemente.expediente.domain.exception.SesionInvalidaException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.Map;

@RestControllerAdvice(basePackages = "com.syborx.brevemente.expediente")
public class ExpedienteExceptionHandler {

    @ExceptionHandler(ExpedienteNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ExpedienteNotFoundException ex) {
        return body(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ConsentimientoYaFirmadoException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(ConsentimientoYaFirmadoException ex) {
        return body(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(SesionInvalidaException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(SesionInvalidaException ex) {
        return body(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> body(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", OffsetDateTime.now(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message
        ));
    }
}
