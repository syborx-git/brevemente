package com.syborx.brevemente.leva.application.ports.in;

import org.springframework.core.io.Resource;

public interface GetSessionAudioUseCase {

    record SessionAudio(Resource resource, String contentType, String fileName, long sizeBytes) {}

    SessionAudio getSessionAudio(String sessionId);
}

