package com.syborx.brevemente.leva.application.ports.out;

import org.springframework.web.multipart.MultipartFile;

public interface TranscriptionClientPort {
    void dispatchAsyncTranscription(String taskId, MultipartFile file, String callbackUrl, String language);
}
