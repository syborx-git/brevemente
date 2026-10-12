package com.syborx.brevemente.leva.infrastructure.adapters.in.rest.advice;

import com.syborx.brevemente.leva.domain.exception.LevaException;
import com.syborx.brevemente.leva.domain.exception.TranscriptionTaskNotFoundException;
import com.syborx.brevemente.leva.domain.exception.UnauthorizedInternalApiKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.Map;

@RestControllerAdvice(basePackages = "com.syborx.brevemente.leva")
public class LevaExceptionHandler {

    @ExceptionHandler(TranscriptionTaskNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(TranscriptionTaskNotFoundException ex) {
        return body(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(UnauthorizedInternalApiKeyException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorized(UnauthorizedInternalApiKeyException ex) {
        return body(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(LevaException.class)
    public ResponseEntity<Map<String, Object>> handleLevaException(LevaException ex) {
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
