package com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.adapter;

import com.syborx.brevemente.leva.application.ports.out.TranscriptionTaskRepositoryPort;
import com.syborx.brevemente.leva.domain.model.TranscriptionTask;
import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.entity.TranscriptionTaskJpaEntity;
import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.repository.SpringDataTranscriptionTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class TranscriptionTaskPersistenceAdapter implements TranscriptionTaskRepositoryPort {

    private final SpringDataTranscriptionTaskRepository repository;

    @Override
    public TranscriptionTask save(TranscriptionTask domain) {
        TranscriptionTaskJpaEntity entity = toEntity(domain);
        TranscriptionTaskJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<TranscriptionTask> findById(String id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<TranscriptionTask> findBySessionId(String sessionId) {
        return repository.findBySessionId(sessionId).map(this::toDomain);
    }

    private TranscriptionTaskJpaEntity toEntity(TranscriptionTask domain) {
        return TranscriptionTaskJpaEntity.builder()
                .id(domain.getId())
                .sessionId(domain.getSessionId())
                .pacienteId(domain.getPacienteId())
                .terapeutaId(domain.getTerapeutaId())
                .status(domain.getStatus())
                .audioFileName(domain.getAudioFileName())
                .durationSeconds(domain.getDurationSeconds() != null ? java.math.BigDecimal.valueOf(domain.getDurationSeconds()) : null)
                .languageDetected(domain.getLanguageDetected())
                .rawResult(domain.getRawResult())
                .errorMessage(domain.getErrorMessage())
                .createdAt(domain.getCreatedAt() != null ? domain.getCreatedAt().atOffset(ZoneOffset.UTC) : null)
                .updatedAt(domain.getUpdatedAt() != null ? domain.getUpdatedAt().atOffset(ZoneOffset.UTC) : null)
                .build();
    }

    private TranscriptionTask toDomain(TranscriptionTaskJpaEntity entity) {
        return TranscriptionTask.builder()
                .id(entity.getId())
                .sessionId(entity.getSessionId())
                .pacienteId(entity.getPacienteId())
                .terapeutaId(entity.getTerapeutaId())
                .status(entity.getStatus())
                .audioFileName(entity.getAudioFileName())
                .durationSeconds(entity.getDurationSeconds() != null ? entity.getDurationSeconds().doubleValue() : null)
                .languageDetected(entity.getLanguageDetected())
                .rawResult(entity.getRawResult())
                .errorMessage(entity.getErrorMessage())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant() : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toInstant() : null)
                .build();
    }
}
