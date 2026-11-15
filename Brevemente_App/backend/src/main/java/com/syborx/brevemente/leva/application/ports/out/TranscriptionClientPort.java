package com.syborx.brevemente.leva.application.ports.out;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface TranscriptionClientPort {

    void dispatchAsyncTranscription(String taskId, byte[] audio, String fileName, String callbackUrl, String language);

    default void dispatchAsyncTranscription(String taskId, MultipartFile file, String callbackUrl, String language) {
        try {
            byte[] bytes = (file != null && !file.isEmpty()) ? file.getBytes() : new byte[0];
            String name = (file != null && file.getOriginalFilename() != null) ? file.getOriginalFilename() : "audio.webm";
            dispatchAsyncTranscription(taskId, bytes, name, callbackUrl, language);
        } catch (IOException e) {
            throw new com.syborx.brevemente.leva.domain.exception.LevaException("No se pudo leer el audio: " + e.getMessage(), e);
        }
    }
}
