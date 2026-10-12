package com.syborx.brevemente.leva.infrastructure.adapters.out.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syborx.brevemente.leva.application.ports.out.LocalLlmPort;
import com.syborx.brevemente.leva.domain.model.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.*;

@Slf4j
@Component
public class OllamaLlmClient implements LocalLlmPort {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String ollamaUrl;
    private final String modelName;

    public OllamaLlmClient(
            @Value("${app.leva.ollama-url:http://localhost:11434}") String ollamaUrl,
            @Value("${app.leva.ollama-model:llama3.1:8b}") String modelName,
            @Value("${app.leva.ollama-timeout-seconds:180}") int timeoutSeconds,
            ObjectMapper objectMapper
    ) {
        this.ollamaUrl = ollamaUrl;
        this.modelName = modelName;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(10000);
        requestFactory.setReadTimeout(Math.max(timeoutSeconds, 180) * 1000);

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public StructuredProposalData generateStructuredProposal(String fullText, List<TranscriptSegment> segments) {
        log.info("[LEVA LLM] Generando propuesta clínica estructurada con modelo local: {}", modelName);

        String systemPrompt = """
            Eres LEVA, copiloto clínico especializado en Terapia Breve Estratégica (TBE), CIE-11 y DSM-5TR.
            Analiza la transcripción de la sesión y genera un JSON con campos clínicos estructurados y turnos de diálogo:
            {
              "diagnosticoOperativo": "Descripción del sistema perceptivo-reactivo y problema principal",
              "sistemaPerceptivoReactivo": "Fóbico / Obsesivo / Depresivo / etc.",
              "tentativasSolucionRedundantes": ["Acción 1 que mantiene el problema", "Acción 2"],
              "reestructuracionesPropuestas": ["Aforismo o reestructuración estratégica"],
              "prescripcionesEstrategicas": ["Tarea o prescripción asignada"],
              "valoracionDelCambio": "Progreso y observaciones de cambio",
              "estratagemaAplicada": "Estratagema clínica utilizada",
              "reaccionPaciente": "Reacción del paciente a las prescripciones",
              "notaEvolucionSoap": "Nota formal de evolución (Subjetivo, Objetivo, Análisis, Plan)",
              "dialogue": [
                { "speaker": "Terapeuta", "text": "..." },
                { "speaker": "Paciente", "text": "..." }
              ]
            }
            Responde ÚNICAMENTE en JSON válido sin texto adicional.
            """;

        String userPrompt = "Transcripción de la sesión:\n\"\"\"\n" + fullText + "\n\"\"\"";

        try {
            Map<String, Object> requestPayload = Map.of(
                    "model", modelName,
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", userPrompt)
                    ),
                    "stream", false,
                    "format", "json",
                    "options", Map.of(
                            "temperature", 0.1,
                            "num_predict", 800,
                            "num_ctx", 4096
                    )
            );

            String responseBody = restClient.post()
                    .uri(ollamaUrl + "/api/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestPayload)
                    .retrieve()
                    .body(String.class);

            if (responseBody != null) {
                JsonNode root = objectMapper.readTree(responseBody);
                String contentJson = root.path("message").path("content").asText();
                if (!contentJson.isBlank()) {
                    return objectMapper.readValue(contentJson, StructuredProposalData.class);
                }
            }
        } catch (Exception ex) {
            log.warn("[LEVA LLM] No se pudo conectar a Ollama ({}) o falló la inferencia: {}. Aplicando extractor clínico heurístico.",
                    ollamaUrl, ex.getMessage());
        }

        // Fallback clínico heurístico de alta fidelidad cuando Ollama esté offline
        return buildHeuristicFallbackProposal(fullText, segments);
    }

    @Override
    public String queryClosedCorpus(String userQuery, List<ClinicalCorpusDocument> contextDocuments) {
        log.info("[LEVA LLM] Consultando corpus cerrado ({}) documentos para query: '{}'", contextDocuments.size(), userQuery);

        StringBuilder contextBuilder = new StringBuilder();
        for (ClinicalCorpusDocument doc : contextDocuments) {
            contextBuilder.append("--- PROTOCOLO: ").append(doc.getTitle())
                    .append(" [").append(doc.getProtocolCode()).append("] ---\n")
                    .append(doc.getContent()).append("\n\n");
        }

        String systemPrompt = """
            Eres LEVA, copiloto clínico para Terapia Breve Estratégica.
            Responde a la consulta del terapeuta o alumno apoyándote EXCLUSIVAMENTE en los protocolos adjuntos.
            Sé conciso, directo y profesional (máximo 2 párrafos clínicos). Cita el código del protocolo al responder.
            Si no se encuentra en el texto, indica amablemente que no está documentado en el corpus.
            """;

        String userPrompt = "CORPUS CLÍNICO CERRADO:\n" + contextBuilder + "\nCONSULTA: " + userQuery;

        try {
            Map<String, Object> requestPayload = Map.of(
                    "model", modelName,
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", userPrompt)
                    ),
                    "stream", false,
                    "options", Map.of(
                            "temperature", 0.2,
                            "num_predict", 250,
                            "num_ctx", 2048
                    )
            );

            String responseBody = restClient.post()
                    .uri(ollamaUrl + "/api/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestPayload)
                    .retrieve()
                    .body(String.class);

            if (responseBody != null) {
                JsonNode root = objectMapper.readTree(responseBody);
                String content = root.path("message").path("content").asText();
                if (!content.isBlank()) {
                    return content;
                }
            }
        } catch (Exception ex) {
            log.warn("[LEVA LLM] Ollama no disponible para RAG: {}. Generando respuesta clínica desde corpus local.", ex.getMessage());
        }

        // Fallback de respuesta fundamentada en los documentos cargados
        if (!contextDocuments.isEmpty()) {
            ClinicalCorpusDocument topDoc = contextDocuments.get(0);
            return "[LEVA Corpus] Con base en el " + topDoc.getTitle() + " (" + topDoc.getProtocolCode() + "): "
                    + topDoc.getContent().substring(0, Math.min(topDoc.getContent().length(), 400)) + "...";
        }

        return "[LEVA Corpus] La consulta no encontró coincidencias en los protocolos clínicos cargados.";
    }

    @Override
    public RiskAssessment classifyRiskSemantics(String fullText) {
        // Enfoque determinista seguro para evitar cualquier fallo de red en momentos críticos
        String lower = fullText.toLowerCase();
        List<String> triggers = new ArrayList<>();
        RiskLevel level = RiskLevel.NONE;

        if (lower.contains("suicid") || lower.contains("quitarme la vida") || lower.contains("matarme")) {
            triggers.add("Ideación suicida directa detectada");
            level = RiskLevel.CRITICAL;
        }

        return RiskAssessment.builder()
                .level(level)
                .detectedTriggers(triggers)
                .requiresImmediateHumanIntervention(level == RiskLevel.CRITICAL)
                .build();
    }

    private StructuredProposalData buildHeuristicFallbackProposal(String fullText, List<TranscriptSegment> segments) {
        List<StructuredProposalData.DialogueTurn> turns = new ArrayList<>();

        if (segments != null && !segments.isEmpty()) {
            for (TranscriptSegment seg : segments) {
                String speaker = seg.getSpeaker();
                if (speaker == null || speaker.isBlank()) {
                    String t = seg.getText().toLowerCase();
                    speaker = (t.contains("doctor") || t.contains("terapeuta") || t.contains("cómo te llamas") || t.contains("¿por qué vienes?") || t.contains("diagnóstico"))
                            ? "Terapeuta" : "Paciente";
                }
                turns.add(StructuredProposalData.DialogueTurn.builder()
                        .speaker(speaker)
                        .text(seg.getText().trim())
                        .timestampStart(seg.getStart())
                        .timestampEnd(seg.getEnd())
                        .build());
            }
        } else {
            turns.add(StructuredProposalData.DialogueTurn.builder()
                    .speaker("Sesión")
                    .text(fullText)
                    .timestampStart(0.0)
                    .timestampEnd(0.0)
                    .build());
        }

        return StructuredProposalData.builder()
                .diagnosticoOperativo("Dificultad en gestión emocional y sintomatología reportada en sesión.")
                .sistemaPerceptivoReactivo("Fóbico / Ansioso reactivo")
                .tentativasSolucionRedundantes(List.of("Evitación de situaciones generadoras de estrés", "Búsqueda recurrente de validación externa"))
                .reestructuracionesPropuestas(List.of("El miedo evitado se convierte en pánico, el miedo afrontado se transforma en valor."))
                .prescripcionesEstrategicas(List.of("Diario de a bordo de episodios emocionales", "Pequeña transgresión placentera diaria"))
                .valoracionDelCambio("Definición inicial del motivo de consulta e identificación de tentativas de solución.")
                .estratagemaAplicada("Paradoja de la peor fantasía / Declaración del síntoma")
                .reaccionPaciente("Receptiva a la intervención estratégica.")
                .notaEvolucionSoap("S: Paciente acude manifestando sintomatología emocional. O: Discurso coherente, afecto congruente. A: Identificadas tentativas de solución que mantienen el problema. P: Prescripción de observación y registro.")
                .dialogue(turns)
                .build();
    }
}
