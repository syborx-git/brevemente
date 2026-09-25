package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.advice;

import com.syborx.brevemente.paciente.domain.exception.PacienteConflictException;
import com.syborx.brevemente.paciente.domain.exception.PacienteNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.Map;

@RestControllerAdvice
public class PacienteExceptionHandler {

    @ExceptionHandler(PacienteNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(PacienteNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "timestamp", OffsetDateTime.now(),
                "status", HttpStatus.NOT_FOUND.value(),
                "error", "Not Found",
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(PacienteConflictException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(PacienteConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "timestamp", OffsetDateTime.now(),
                "status", HttpStatus.CONFLICT.value(),
                "error", "Conflict",
                "message", ex.getMessage()
        ));
    }
}
