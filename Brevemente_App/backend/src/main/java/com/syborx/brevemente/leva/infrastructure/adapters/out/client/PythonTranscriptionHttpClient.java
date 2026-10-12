package com.syborx.brevemente.leva.infrastructure.adapters.out.client;

import com.syborx.brevemente.leva.application.ports.out.TranscriptionClientPort;
import com.syborx.brevemente.leva.domain.exception.LevaException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Component
public class PythonTranscriptionHttpClient implements TranscriptionClientPort {

    private final RestClient restClient;
    private final String transcriptionServiceUrl;
    private final String internalApiKey;

    public PythonTranscriptionHttpClient(
            @Value("${app.leva.transcription-service-url:http://localhost:8000}") String transcriptionServiceUrl,
            @Value("${app.leva.internal-api-key:dev-secret-api-key-change-in-prod}") String internalApiKey
    ) {
        this.transcriptionServiceUrl = transcriptionServiceUrl;
        this.internalApiKey = internalApiKey;
        this.restClient = RestClient.builder().build();
    }

    @Override
    public void dispatchAsyncTranscription(String taskId, MultipartFile file, String callbackUrl, String language) {
        log.info("[LEVA Client] Despachando audio a Python Whisper: taskId={}, callbackUrl={}", taskId, callbackUrl);

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

            if (file != null && !file.isEmpty()) {
                ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                    @Override
                    public String getFilename() {
                        return file.getOriginalFilename() != null ? file.getOriginalFilename() : "audio.mp3";
                    }
                };
                body.add("file", fileResource);
            }

            body.add("task_id", taskId);
            if (callbackUrl != null && !callbackUrl.isBlank()) {
                body.add("callback_url", callbackUrl);
            }
            body.add("language", (language != null && !language.isBlank()) ? language : "es");

            restClient.post()
                    .uri(transcriptionServiceUrl + "/v1/transcribe")
                    .header("X-Internal-API-Key", internalApiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            log.info("[LEVA Client] Tarea {} aceptada por Python (HTTP 202). Esperando Webhook callback.", taskId);

        } catch (Exception ex) {
            log.error("[LEVA Client] Fallo al invocar microservicio Python: {}", ex.getMessage(), ex);
            throw new LevaException("No se pudo conectar con el motor de transcripción: " + ex.getMessage(), ex);
        }
    }
}
