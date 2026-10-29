package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.advice;

import com.syborx.brevemente.paciente.domain.exception.PacienteConflictException;
import com.syborx.brevemente.paciente.domain.exception.PacienteNotFoundException;
import com.syborx.brevemente.paciente.domain.exception.TerapeutaAccesoDenegadoException;
import com.syborx.brevemente.paciente.domain.exception.TerapeutaConfigNotFoundException;
import com.syborx.brevemente.paciente.domain.exception.TerapeutaSedeInvalidaException;
import com.syborx.brevemente.paciente.domain.exception.TerapeutaVinculoException;
import org.springframework.dao.DataIntegrityViolationException;
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

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "timestamp", OffsetDateTime.now(),
                "status", HttpStatus.BAD_REQUEST.value(),
                "error", "Bad Request",
                "message", "Datos inválidos o en conflicto con las restricciones del sistema"
        ));
    }

    @ExceptionHandler(TerapeutaConfigNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleTerapeutaConfigNotFound(TerapeutaConfigNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "timestamp", OffsetDateTime.now(),
                "status", HttpStatus.NOT_FOUND.value(),
                "error", "Not Found",
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(TerapeutaVinculoException.class)
    public ResponseEntity<Map<String, Object>> handleTerapeutaVinculo(TerapeutaVinculoException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "timestamp", OffsetDateTime.now(),
                "status", HttpStatus.BAD_REQUEST.value(),
                "error", "Bad Request",
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(TerapeutaSedeInvalidaException.class)
    public ResponseEntity<Map<String, Object>> handleTerapeutaSedeInvalida(TerapeutaSedeInvalidaException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "timestamp", OffsetDateTime.now(),
                "status", HttpStatus.BAD_REQUEST.value(),
                "error", "Bad Request",
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(TerapeutaAccesoDenegadoException.class)
    public ResponseEntity<Map<String, Object>> handleTerapeutaAccesoDenegado(TerapeutaAccesoDenegadoException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "timestamp", OffsetDateTime.now(),
                "status", HttpStatus.FORBIDDEN.value(),
                "error", "Forbidden",
                "message", ex.getMessage()
        ));
    }
}
