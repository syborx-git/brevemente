package com.syborx.brevemente.leva.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TranscriptionTask {
    private String id;
    private String sessionId;
    private String pacienteId;
    private String terapeutaId;
    @Builder.Default
    private TranscriptionTaskStatus status = TranscriptionTaskStatus.PENDIENTE;
    private String audioFileName;
    private Double durationSeconds;
    private String languageDetected;
    private RawTranscriptionResult rawResult;
    private String errorMessage;
    private Instant createdAt;
    private Instant updatedAt;
}
