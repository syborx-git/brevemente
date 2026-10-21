package com.syborx.brevemente.auditoria.infrastructure.adapters.in.rest.advice;

import com.syborx.brevemente.auditoria.domain.exception.PacienteNoEncontradoException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.Map;

@RestControllerAdvice(basePackages = "com.syborx.brevemente.auditoria")
public class AuditoriaExceptionHandler {

    @ExceptionHandler(PacienteNoEncontradoException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(PacienteNoEncontradoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "timestamp", OffsetDateTime.now(),
                "status", HttpStatus.NOT_FOUND.value(),
                "error", HttpStatus.NOT_FOUND.getReasonPhrase(),
                "message", ex.getMessage()
        ));
    }
}
