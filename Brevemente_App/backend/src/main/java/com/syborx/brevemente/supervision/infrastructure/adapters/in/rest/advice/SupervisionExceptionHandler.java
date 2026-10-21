package com.syborx.brevemente.supervision.infrastructure.adapters.in.rest.advice;

import com.syborx.brevemente.supervision.domain.exception.BitacoraNotFoundException;
import com.syborx.brevemente.supervision.domain.exception.SolicitudNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.Map;

@RestControllerAdvice(basePackages = "com.syborx.brevemente.supervision")
public class SupervisionExceptionHandler {

    @ExceptionHandler({BitacoraNotFoundException.class, SolicitudNotFoundException.class})
    public ResponseEntity<Map<String, Object>> handleNotFound(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "timestamp", OffsetDateTime.now(),
                "status", HttpStatus.NOT_FOUND.value(),
                "error", HttpStatus.NOT_FOUND.getReasonPhrase(),
                "message", ex.getMessage()
        ));
    }
}
