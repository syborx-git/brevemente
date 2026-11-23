package com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.advice;

import com.syborx.brevemente.cita.domain.exception.CitaNotFoundException;
import com.syborx.brevemente.cita.domain.exception.MotivoCancelacionObligatorioException;
import com.syborx.brevemente.cita.domain.exception.TransicionEstadoCitaInvalidaException;
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

    @ExceptionHandler(CitaNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleCitaNoEncontrada(CitaNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "timestamp", OffsetDateTime.now(),
                "status", HttpStatus.NOT_FOUND.value(),
                "error", "Not Found",
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(TransicionEstadoCitaInvalidaException.class)
    public ResponseEntity<Map<String, Object>> handleTransicion(TransicionEstadoCitaInvalidaException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "timestamp", OffsetDateTime.now(),
                "status", HttpStatus.CONFLICT.value(),
                "error", "Conflict",
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(MotivoCancelacionObligatorioException.class)
    public ResponseEntity<Map<String, Object>> handleMotivoObligatorio(MotivoCancelacionObligatorioException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "timestamp", OffsetDateTime.now(),
                "status", HttpStatus.BAD_REQUEST.value(),
                "error", "Bad Request",
                "message", ex.getMessage()
        ));
    }
}
