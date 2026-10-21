package com.syborx.brevemente.pago.infrastructure.adapters.in.rest.advice;

import com.syborx.brevemente.pago.domain.exception.PagoInvalidoException;
import com.syborx.brevemente.pago.domain.exception.PagoNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.Map;

@RestControllerAdvice(basePackages = "com.syborx.brevemente.pago")
public class PagoExceptionHandler {

    @ExceptionHandler(PagoNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(PagoNotFoundException ex) {
        return body(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(PagoInvalidoException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(PagoInvalidoException ex) {
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
