package com.syborx.brevemente.constancia.infrastructure.adapters.in.rest.advice;

import com.syborx.brevemente.constancia.domain.exception.ConstanciaNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.Map;

@RestControllerAdvice(basePackages = "com.syborx.brevemente.constancia")
public class ConstanciaExceptionHandler {

    @ExceptionHandler(ConstanciaNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ConstanciaNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "timestamp", OffsetDateTime.now(),
                "status", HttpStatus.NOT_FOUND.value(),
                "error", HttpStatus.NOT_FOUND.getReasonPhrase(),
                "message", ex.getMessage()
        ));
    }
}
