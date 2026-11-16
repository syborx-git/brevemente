package com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.entity;

import com.syborx.brevemente.leva.domain.model.RawTranscriptionResult;
import com.syborx.brevemente.leva.domain.model.TranscriptionTaskStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "transcription_tasks")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TranscriptionTaskJpaEntity {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(name = "paciente_id", length = 100)
    private String pacienteId;

    @Column(name = "terapeuta_id", length = 100)
    private String terapeutaId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private TranscriptionTaskStatus status;

    @Column(name = "audio_file_name", length = 255)
    private String audioFileName;

    @Column(name = "audio_storage_path", columnDefinition = "TEXT")
    private String audioStoragePath;

    @Column(name = "audio_content_type", length = 100)
    private String audioContentType;

    @Column(name = "audio_size_bytes")
    private Long audioSizeBytes;

    @Column(name = "duration_seconds", precision = 10, scale = 2)
    private java.math.BigDecimal durationSeconds;

    @Column(name = "language_detected", length = 10)
    private String languageDetected;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_result", columnDefinition = "jsonb")
    private RawTranscriptionResult rawResult;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
