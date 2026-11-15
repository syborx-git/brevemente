package com.syborx.brevemente.leva.application.service;

import com.syborx.brevemente.leva.application.ports.in.GetSessionAudioUseCase;
import com.syborx.brevemente.leva.application.ports.in.RetryTranscriptionUseCase;
import com.syborx.brevemente.leva.application.ports.out.SessionAudioStoragePort;
import com.syborx.brevemente.leva.application.ports.out.TranscriptionClientPort;
import com.syborx.brevemente.leva.application.ports.out.TranscriptionTaskRepositoryPort;
import com.syborx.brevemente.leva.domain.exception.LevaException;
import com.syborx.brevemente.leva.domain.model.TranscriptionTask;
import com.syborx.brevemente.leva.domain.model.TranscriptionTaskStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.Instant;
import java.util.UUID;

/**
 * Responsabilidad única: ciclo de vida del audio persistido (consulta y reintento de transcripción).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SessionAudioApplicationService implements GetSessionAudioUseCase, RetryTranscriptionUseCase {

    private final TranscriptionTaskRepositoryPort taskRepositoryPort;
    private final SessionAudioStoragePort audioStoragePort;
    private final TranscriptionClientPort transcriptionClientPort;

    @Value("${app.leva.callback-url:http://localhost:8080/api/v1/internal/transcriptions/callback}")
    private String defaultCallbackUrl;

    @Override
    @Transactional(readOnly = true)
    public SessionAudio getSessionAudio(String sessionId) {
        TranscriptionTask task = findTaskWithAudio(sessionId);
        Resource resource = audioStoragePath(task);
        return new SessionAudio(
                resource,
                task.getAudioContentType() != null ? task.getAudioContentType() : "audio/webm",
                task.getAudioFileName() != null ? task.getAudioFileName() : "sesion_clinica.webm",
                task.getAudioSizeBytes() != null ? task.getAudioSizeBytes() : 0L
        );
    }

    @Override
    @Transactional
    public TranscriptionTask retryTranscription(String sessionId, String language) {
        TranscriptionTask previous = findTaskWithAudio(sessionId);
        Resource resource = audioStoragePath(previous);

        byte[] audio;
        try {
            audio = resource.getContentAsByteArray();
        } catch (IOException e) {
            throw new LevaException("No se pudo leer el audio almacenado: " + e.getMessage(), e);
        }

        TranscriptionTask task = TranscriptionTask.builder()
                .id(UUID.randomUUID().toString())
                .sessionId(sessionId)
                .pacienteId(previous.getPacienteId())
                .terapeutaId(previous.getTerapeutaId())
                .audioFileName(previous.getAudioFileName())
                .audioStoragePath(previous.getAudioStoragePath())
                .audioContentType(previous.getAudioContentType())
                .audioSizeBytes(previous.getAudioSizeBytes())
                .status(TranscriptionTaskStatus.PROCESSING)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        task = taskRepositoryPort.save(task);
        log.info("[LEVA Audio] Reintentando transcripción de sesión {} con audio almacenado (nueva tarea {})", sessionId, task.getId());

        try {
            transcriptionClientPort.dispatchAsyncTranscription(
                    task.getId(), audio, task.getAudioFileName(), defaultCallbackUrl,
                    (language != null && !language.isBlank()) ? language : "es");
        } catch (Exception ex) {
            task.setStatus(TranscriptionTaskStatus.FAILED);
            task.setErrorMessage("Fallo al contactar motor de transcripción: " + ex.getMessage());
            task.setUpdatedAt(Instant.now());
            return taskRepositoryPort.save(task);
        }
        return task;
    }

    private TranscriptionTask findTaskWithAudio(String sessionId) {
        TranscriptionTask task = taskRepositoryPort.findBySessionId(sessionId)
                .orElseThrow(() -> new LevaException("No hay grabación registrada para la sesión: " + sessionId));
        if (task.getAudioStoragePath() == null || task.getAudioStoragePath().isBlank()) {
            throw new LevaException("La sesión " + sessionId + " no tiene audio almacenado.");
        }
        return task;
    }

    private Resource audioStoragePath(TranscriptionTask task) {
        return audioStoragePort.load(task.getAudioStoragePath())
                .orElseThrow(() -> new LevaException("El archivo de audio ya no existe en el servidor."));
    }
}

