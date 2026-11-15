package com.syborx.brevemente.leva.application.ports.in;

import com.syborx.brevemente.leva.domain.model.TranscriptionTask;

public interface RetryTranscriptionUseCase {
    /** Re-encola la transcripción usando el audio ya almacenado en el servidor. */
    TranscriptionTask retryTranscription(String sessionId, String language);
}

