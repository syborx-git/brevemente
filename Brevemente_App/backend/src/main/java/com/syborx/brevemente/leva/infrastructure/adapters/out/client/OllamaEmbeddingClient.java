package com.syborx.brevemente.leva.infrastructure.adapters.out.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syborx.brevemente.leva.application.ports.out.LocalEmbeddingPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.*;

@Slf4j
@Component
public class OllamaEmbeddingClient implements LocalEmbeddingPort {

    private final RestClient restClient;
    private final String ollamaUrl;
    private final String embeddingModel;
    private final ObjectMapper objectMapper;

    public OllamaEmbeddingClient(
            @Value("${app.leva.ollama-url:http://localhost:11434}") String ollamaUrl,
            @Value("${app.leva.embedding-model:nomic-embed-text}") String embeddingModel,
            ObjectMapper objectMapper
    ) {
        this.ollamaUrl = ollamaUrl;
        this.embeddingModel = embeddingModel;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(15000);

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .build();
    }

    @Override
    public List<Float> generateEmbedding(String text) {
        if (text == null || text.isBlank()) {
            return Collections.emptyList();
        }

        try {
            Map<String, Object> payload = Map.of(
                    "model", embeddingModel,
                    "prompt", text.trim()
            );

            String response = restClient.post()
                    .uri(ollamaUrl + "/api/embeddings")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                JsonNode embeddingNode = root.path("embedding");
                if (embeddingNode.isArray() && !embeddingNode.isEmpty()) {
                    List<Float> vector = new ArrayList<>(embeddingNode.size());
                    for (JsonNode n : embeddingNode) {
                        vector.add((float) n.asDouble());
                    }
                    return vector;
                }
            }
        } catch (Exception ex) {
            log.debug("[Embedding Client] Ollama embeddings no disponible ({}: {}). Aplicando vectorizador léxico determinista.",
                    embeddingModel, ex.getMessage());
        }

        return generateDeterministicFallbackVector(text);
    }

    @Override
    public double calculateCosineSimilarity(List<Float> vectorA, List<Float> vectorB) {
        if (vectorA == null || vectorB == null || vectorA.isEmpty() || vectorB.isEmpty()) {
            return 0.0;
        }

        int size = Math.min(vectorA.size(), vectorB.size());
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < size; i++) {
            float a = vectorA.get(i);
            float b = vectorB.get(i);
            dotProduct += a * b;
            normA += a * a;
            normB += b * b;
        }

        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Vectorizador de hashing con proyección dimensional (128 dimensiones) para fallback local
     */
    private List<Float> generateDeterministicFallbackVector(String text) {
        int dimensions = 128;
        float[] vector = new float[dimensions];
        String[] words = text.toLowerCase().split("\\W+");

        for (String word : words) {
            if (word.length() < 3) continue;
            int hash = Math.abs(word.hashCode());
            int index = hash % dimensions;
            vector[index] += 1.0f;
        }

        // Normalización L2
        double sumSq = 0.0;
        for (float v : vector) sumSq += v * v;
        double norm = Math.sqrt(sumSq);

        List<Float> result = new ArrayList<>(dimensions);
        for (float v : vector) {
            result.add(norm > 0 ? (float) (v / norm) : 0.0f);
        }
        return result;
    }
}

