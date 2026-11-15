package com.syborx.brevemente.leva.application.ports.in;

import com.syborx.brevemente.leva.domain.model.TranscriptionTask;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

public interface StartTranscriptionUseCase {
    TranscriptionTask startSessionTranscription(String sessionId, MultipartFile audioFile, String language);
    Optional<TranscriptionTask> getTaskBySessionId(String sessionId);
}
