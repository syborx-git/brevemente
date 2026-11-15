package com.syborx.brevemente.leva.infrastructure.adapters.out.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syborx.brevemente.leva.application.ports.out.DocumentConverterPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class PythonDocumentConverterClient implements DocumentConverterPort {

    private final RestClient restClient;
    private final String docConverterUrl;
    private final String internalApiKey;
    private final ObjectMapper objectMapper;

    public PythonDocumentConverterClient(
            @Value("${app.leva.doc-converter-url:http://localhost:8005}") String docConverterUrl,
            @Value("${app.leva.internal-api-key:dev-secret-api-key-change-in-prod}") String internalApiKey,
            ObjectMapper objectMapper
    ) {
        this.docConverterUrl = docConverterUrl;
        this.internalApiKey = internalApiKey;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(60000); // 60 segundos máx para PDFs muy densos

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .build();
    }

    @Override
    public DocumentConversionResult convertToMarkdown(MultipartFile file) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf";
        log.info("[Doc Converter Client] Despachando archivo '{}' a document_engine_python: {}", filename, docConverterUrl);

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };
            body.add("file", resource);

            DocumentConversionResult result = restClient.post()
                    .uri(docConverterUrl + "/v1/convert")
                    .header("X-Internal-API-Key", internalApiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(DocumentConversionResult.class);

            if (result != null && result.markdown() != null && !result.markdown().isBlank()) {
                log.info("[Doc Converter Client] Conversión exitosa para '{}' ({} palabras, {} páginas, {} chunks)",
                        filename, result.wordCount(), result.pageCount(), result.chunkCount());
                return result;
            }
        } catch (Exception ex) {
            log.warn("[Doc Converter Client] Falló llamada a document_engine_python ({}: {}). Aplicando extractor local de fallback.",
                    docConverterUrl, ex.getMessage());
        }

        // Fallback determinista local en caso de que el microservicio Python esté en arranque o desconectado
        return buildFallbackConversion(file);
    }

    private DocumentConversionResult buildFallbackConversion(MultipartFile file) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.txt";
        String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf(".")).toLowerCase() : "";

        try {
            byte[] bytes = file.getBytes();
            String rawText;

            if (ext.equals(".txt") || ext.equals(".md")) {
                rawText = new String(bytes, StandardCharsets.UTF_8);
            } else {
                // Extracción determinista de streams para binarios
                StringBuilder sb = new StringBuilder();
                StringBuilder word = new StringBuilder();
                for (byte b : bytes) {
                    char c = (char) (b & 0xFF);
                    if ((c >= 32 && c <= 126) || c == '\n' || c == '\r' || c == '\t' || (c >= 192 && c <= 255)) {
                        word.append(c);
                    } else {
                        if (word.length() >= 3) {
                            sb.append(word).append(" ");
                        }
                        word.setLength(0);
                    }
                    if (sb.length() > 500000) break;
                }
                if (word.length() >= 3) sb.append(word);
                String cleaned = sb.toString().replaceAll("\\s+", " ").trim();
                rawText = cleaned.length() > 30 ? cleaned : ("# " + filename + "\n\nContenido procesado en modo local.");
            }

            int words = rawText.split("\\s+").length;
            int pages = Math.max(1, words / 350);

            return new DocumentConversionResult(
                    filename,
                    ext,
                    pages,
                    words,
                    rawText,
                    List.of("General"),
                    1,
                    List.of(new DocumentChunkDto(0, "General", rawText, words))
            );
        } catch (Exception e) {
            log.error("[Doc Converter Client] Error en fallback: {}", e.getMessage());
            return new DocumentConversionResult(
                    filename, ext, 1, 0, "# " + filename + "\n\nError en extracción.", Collections.emptyList(), 0, Collections.emptyList()
            );
        }
    }
}

