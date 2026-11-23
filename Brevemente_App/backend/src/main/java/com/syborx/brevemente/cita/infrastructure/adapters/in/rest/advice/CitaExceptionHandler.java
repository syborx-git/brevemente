package com.syborx.brevemente.cita.infrastructure.adapters.in.rest.advice;

import com.syborx.brevemente.cita.domain.exception.CitaBloqueadaPorNormativaException;
import com.syborx.brevemente.cita.domain.exception.CitaEnPasadoException;
import com.syborx.brevemente.cita.domain.exception.CitaNotFoundException;
import com.syborx.brevemente.cita.domain.exception.MotivoCancelacionObligatorioException;
import com.syborx.brevemente.cita.domain.exception.FechaNoLaborableException;
import com.syborx.brevemente.cita.domain.exception.PacienteAjenoAlTerapeutaException;
import com.syborx.brevemente.cita.domain.exception.SinTerapeutaVinculadoException;
import com.syborx.brevemente.cita.domain.exception.SolapamientoCitaException;
import com.syborx.brevemente.cita.domain.exception.TransicionEstadoCitaInvalidaException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.Map;

@RestControllerAdvice(basePackages = "com.syborx.brevemente.cita")
public class CitaExceptionHandler {

    @ExceptionHandler(CitaNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(CitaNotFoundException ex) {
        return body(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler({SolapamientoCitaException.class, FechaNoLaborableException.class, TransicionEstadoCitaInvalidaException.class})
    public ResponseEntity<Map<String, Object>> handleConflict(RuntimeException ex) {
        return body(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(CitaEnPasadoException.class)
    public ResponseEntity<Map<String, Object>> handlePasado(CitaEnPasadoException ex) {
        return body(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(SinTerapeutaVinculadoException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(SinTerapeutaVinculadoException ex) {
        return body(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(PacienteAjenoAlTerapeutaException.class)
    public ResponseEntity<Map<String, Object>> handlePacienteAjeno(PacienteAjenoAlTerapeutaException ex) {
        return body(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(MotivoCancelacionObligatorioException.class)
    public ResponseEntity<Map<String, Object>> handleMotivoObligatorio(MotivoCancelacionObligatorioException ex) {
        return body(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(CitaBloqueadaPorNormativaException.class)
    public ResponseEntity<Map<String, Object>> handleBloqueadaNormativa(CitaBloqueadaPorNormativaException ex) {
        return body(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleIntegridad(DataIntegrityViolationException ex) {
        return body(HttpStatus.CONFLICT, "Operación en conflicto (posible doble pago).");
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
