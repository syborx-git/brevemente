package com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.advice;

import com.syborx.brevemente.portalpaciente.domain.exception.AlertaStaffNotFoundException;
import com.syborx.brevemente.portalpaciente.domain.exception.PacienteSinVinculoException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.Map;

@RestControllerAdvice
public class PortalPacienteExceptionHandler {

    @ExceptionHandler(PacienteSinVinculoException.class)
    public ResponseEntity<Map<String, Object>> handleSinVinculo(PacienteSinVinculoException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "timestamp", OffsetDateTime.now(),
                "status", HttpStatus.FORBIDDEN.value(),
                "error", "Forbidden",
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(AlertaStaffNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleAlertaNoEncontrada(AlertaStaffNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "timestamp", OffsetDateTime.now(),
                "status", HttpStatus.NOT_FOUND.value(),
                "error", "Not Found",
                "message", ex.getMessage()
        ));
    }
}
