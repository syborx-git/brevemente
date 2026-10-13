package com.syborx.brevemente.leva.application.ports.out;

import com.syborx.brevemente.leva.domain.model.TranscriptionTask;

import java.util.Optional;

public interface TranscriptionTaskRepositoryPort {
    TranscriptionTask save(TranscriptionTask task);
    Optional<TranscriptionTask> findById(String id);
    Optional<TranscriptionTask> findBySessionId(String sessionId);
}
