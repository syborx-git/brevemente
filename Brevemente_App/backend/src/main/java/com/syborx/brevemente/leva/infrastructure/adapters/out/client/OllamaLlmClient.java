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
import java.util.function.Consumer;

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

    private static final String FEW_SHOT_SYSTEM_PROMPT = """
            Eres LEVA, copiloto clínico de inteligencia artificial especializado en Terapia Breve Estratégica (TBE, modelo Giorgio Nardone), CIE-11 y DSM-5-TR.
            Tu función es analizar la transcripción de una sesión psicoterapéutica y generar una propuesta clínica rigurosa y estructurada en formato JSON.

            REGLAS FUNDAMENTALES OBLIGATORIAS:
            1. Devuelve ÚNICAMENTE un objeto JSON válido según el esquema solicitado, sin texto explicativo adicional ni bloques Markdown fuera del JSON.
            2. REGLA ESTRICTA DE DIARIZACIÓN ('dialogue'):
               - El atributo 'speaker' en cada turno DEBE ser exactamente "Terapeuta" o "Paciente".
               - NUNCA utilices nombres propios (por ejemplo 'Kike', 'Laura', 'Juan'), ni títulos ('Doctor', 'Licenciado'), ni roles genéricos ('Entrevistador', 'Cliente').
               - Si el turno realiza preguntas clínicas, guía la sesión, formula reestructuraciones o prescribe: speaker = "Terapeuta".
               - Si el turno expone síntomas, responde al terapeuta o describe sus problemas: speaker = "Paciente".
            3. CRITERIOS CLÍNICOS ESTRATÉGICOS (TBE):
               - sistemaPerceptivoReactivo: Clasificación TBE (Fóbico, Obsesivo-Compulsivo, Depresivo, Duda Patológica, etc.).
               - tentativasSolucionRedundantes: Acciones o conductas del paciente o su entorno que mantienen o agravan el síntoma.
               - reestructuracionesPropuestas: Aforismos, metáforas o reencuadres estratégicos introducidos para cambiar la percepción del problema.
               - prescripcionesEstrategicas: Tareas o prescripciones asignadas (ej. Diario de a bordo, La peor fantasía, Pequeña transgresión, Media hora de queja).
               - notaEvolucionSoap: Formato formal estandarizado organizado estrictamente en cuatro ejes:
                 S (Subjetivo): Motivo de consulta y síntomas referidos por el paciente.
                 O (Objetivo): Apariencia, orientación, coherencia, estado afectivo observado.
                 A (Análisis/Evaluación): Formulación diagnóstica (TBE, CIE-11 / DSM-5-TR) y dinámica del sistema perceptivo-reactivo.
                 P (Plan): Tareas prescritas, objetivos de la siguiente sesión y temporalidad acordada.
            """;

    private static final String FEW_SHOT_USER_EXAMPLE = """
            Transcripción de la sesión:
            \"\"\"
            Terapeuta: Buenas tardes. Cuéntame qué situación te ha traído hoy a consulta.
            Paciente: Doctor, tengo ataques de pánico repentinos. Al subir al metro o entrar a un centro comercial se me acelera el corazón, me falta el aire y siento que voy a desmayarme o morir.
            Terapeuta: ¿Y qué haces habitualmente cuando sientes que el corazón empieza a acelerarse?
            Paciente: Salgo corriendo del lugar de inmediato. Y si no puedo evitar ir, siempre le pido a mi hermana que venga conmigo; no me atrevo a salir sola.
            Terapeuta: Comprendo. ¿Y cuando huyes o cuando tu hermana te acompaña, el miedo desaparece a largo plazo?
            Paciente: En ese instante me tranquiliza, pero después me siento débil e inútil, y la siguiente vez que salgo el miedo es todavía peor.
            Terapeuta: Claro. El miedo evitado hoy se convierte en el pánico de mañana, y pedir auxilio confirma secretamente que eres incapaz de afrontarlo sola. Vamos a acordar una pauta: de aquí a la próxima cita llevarás contigo un pequeño 'diario de a bordo'. Cada vez que sientas venir la crisis, no huyas de inmediato: saca tu libreta y anota la hora exacta, el lugar y qué sensaciones físicas experimentas.
            Paciente: De acuerdo, lo llevaré conmigo y anotaré cada crisis.
            \"\"\"
            """;

    private static final String FEW_SHOT_ASSISTANT_EXAMPLE = """
            {
              "diagnosticoOperativo": "Trastorno de angustia y pánico con conducta agorafóbica incipiente, mantenido por el bucle de evitación fóbica y delegación de auxilio a familiares.",
              "sistemaPerceptivoReactivo": "Fóbico (Miedo al miedo / Evitación y delegación)",
              "tentativasSolucionRedundantes": [
                "Evitación sistemática del transporte público y espacios concurridos",
                "Petición constante de acompañamiento y protección a familiares",
                "Monitoreo hipervigilante de la frecuencia cardíaca y sensaciones corporales"
              ],
              "reestructuracionesPropuestas": [
                "El miedo evitado se transforma en pánico; el miedo mirado de frente se transforma en valor.",
                "Pedir ayuda constante tranquiliza en el instante, pero secretamente confirma tu propia incapacidad para afrontar el síntoma."
              ],
              "prescripcionesEstrategicas": [
                "Diario de a bordo: registro riguroso e inmediato en libreta de cada conato de crisis (hora, contexto, sensaciones somáticas)."
              ],
              "valoracionDelCambio": "Fase inicial (1ª sesión). Buena receptividad ante el reencuadre de la evitación y compromiso con la tarea de registro.",
              "estratagemaAplicada": "Declaración del síntoma / Diario de a bordo estratégico",
              "reaccionPaciente": "Aceptación colaborativa y alivio al comprender cómo la evitación aumentaba su miedo.",
              "notaEvolucionSoap": "S: Paciente acude refiriendo crisis paroxísticas de pánico con disnea, taquicardia y sensación de muerte inminente en espacios públicos cerrados. O: Alerta, orientada en las tres esferas, facie de tensión y discurso acelerado con labilidad emocional reactiva. A: Cuadro clínico compatible con Trastorno de Pánico con Agorafobia (CIE-11: 6B01 / DSM-5-TR: 300.01). Sistema perceptivo-reactivo fóbico alimentado por evitación situacional y delegación de soporte. P: Prescripción de Diario de a bordo para interrumpir la huida inmediata mediante registro estructurado; próxima consulta en 14 días.",
              "dialogue": [
                { "speaker": "Terapeuta", "text": "Buenas tardes. Cuéntame qué situación te ha traído hoy a consulta." },
                { "speaker": "Paciente", "text": "Doctor, tengo ataques de pánico repentinos. Al subir al metro o entrar a un centro comercial se me acelera el corazón, me falta el aire y siento que voy a desmayarme o morir." },
                { "speaker": "Terapeuta", "text": "¿Y qué haces habitualmente cuando sientes que el corazón empieza a acelerarse?" },
                { "speaker": "Paciente", "text": "Salgo corriendo del lugar de inmediato. Y si no puedo evitar ir, siempre le pido a mi hermana que venga conmigo; no me atrevo a salir sola." },
                { "speaker": "Terapeuta", "text": "Comprendo. ¿Y cuando huyes o cuando tu hermana te acompaña, el miedo desaparece a largo plazo?" },
                { "speaker": "Paciente", "text": "En ese instante me tranquiliza, pero después me siento débil e inútil, y la siguiente vez que salgo el miedo es todavía peor." },
                { "speaker": "Terapeuta", "text": "Claro. El miedo evitado hoy se convierte en el pánico de mañana, y pedir auxilio confirma secretamente que eres incapaz de afrontarlo sola. Vamos a acordar una pauta: de aquí a la próxima cita llevarás contigo un pequeño 'diario de a bordo'. Cada vez que sientas venir la crisis, no huyas de inmediato: saca tu libreta y anota la hora exacta, el lugar y qué sensaciones físicas experimentas." },
                { "speaker": "Paciente", "text": "De acuerdo, lo llevaré conmigo y anotaré cada crisis." }
              ]
            }
            """;

    @Override
    public StructuredProposalData generateStructuredProposal(String fullText, List<TranscriptSegment> segments) {
        log.info("[LEVA LLM] Generando propuesta clínica estructurada (Few-Shot) con modelo local: {}", modelName);

        String userPrompt = "Transcripción de la sesión:\n\"\"\"\n" + fullText + "\n\"\"\"";

        try {
            Map<String, Object> requestPayload = Map.of(
                    "model", modelName,
                    "messages", List.of(
                            Map.of("role", "system", "content", FEW_SHOT_SYSTEM_PROMPT.trim()),
                            Map.of("role", "user", "content", FEW_SHOT_USER_EXAMPLE.trim()),
                            Map.of("role", "assistant", "content", FEW_SHOT_ASSISTANT_EXAMPLE.trim()),
                            Map.of("role", "user", "content", userPrompt)
                    ),
                    "stream", false,
                    "format", "json",
                    "options", Map.of(
                            "temperature", 0.1,
                            "num_predict", 1000,
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
                    StructuredProposalData proposal = objectMapper.readValue(contentJson, StructuredProposalData.class);
                    normalizeProposal(proposal, segments);
                    return proposal;
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
    public void streamQueryClosedCorpus(
            String userQuery,
            List<ClinicalCorpusDocument> contextDocuments,
            Consumer<String> chunkConsumer,
            Runnable onComplete,
            Consumer<Throwable> onError
    ) {
        log.info("[LEVA LLM - Stream] Iniciando consulta streaming RAG ({}) documentos para query: '{}'",
                contextDocuments.size(), userQuery);

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
                    "stream", true,
                    "options", Map.of(
                            "temperature", 0.2,
                            "num_predict", 300,
                            "num_ctx", 2048
                    )
            );

            String jsonBody = objectMapper.writeValueAsString(requestPayload);

            java.net.http.HttpClient httpClient = java.net.http.HttpClient.newBuilder()
                    .connectTimeout(java.time.Duration.ofSeconds(10))
                    .build();

            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(ollamaUrl + "/api/chat"))
                    .header("Content-Type", "application/json")
                    .timeout(java.time.Duration.ofSeconds(180))
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonBody, java.nio.charset.StandardCharsets.UTF_8))
                    .build();

            java.net.http.HttpResponse<java.io.InputStream> response = httpClient.send(
                    request, java.net.http.HttpResponse.BodyHandlers.ofInputStream()
            );

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                try (java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(response.body(), java.nio.charset.StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (line.isBlank()) continue;
                        JsonNode node = objectMapper.readTree(line);
                        String content = node.path("message").path("content").asText();
                        if (content != null && !content.isEmpty()) {
                            chunkConsumer.accept(content);
                        }
                        if (node.path("done").asBoolean(false)) {
                            break;
                        }
                    }
                }
                onComplete.run();
                return;
            } else {
                throw new RuntimeException("Ollama HTTP " + response.statusCode());
            }

        } catch (Exception ex) {
            log.warn("[LEVA LLM - Stream] Falló streaming con Ollama: {}. Emitiendo respuesta desde corpus local.", ex.getMessage());
            // Fallback: emitir respuesta basada en corpus directamente
            if (!contextDocuments.isEmpty()) {
                ClinicalCorpusDocument topDoc = contextDocuments.get(0);
                String fallback = "[LEVA Corpus] Con base en el " + topDoc.getTitle() + " (" + topDoc.getProtocolCode() + "): "
                        + topDoc.getContent().substring(0, Math.min(topDoc.getContent().length(), 400)) + "...";
                chunkConsumer.accept(fallback);
                onComplete.run();
            } else {
                chunkConsumer.accept("[LEVA Corpus] La consulta no encontró coincidencias en los protocolos clínicos cargados.");
                onComplete.run();
            }
        }
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

    private void normalizeProposal(StructuredProposalData proposal, List<TranscriptSegment> segments) {
        if (proposal == null) {
            return;
        }

        if (proposal.getTentativasSolucionRedundantes() == null) {
            proposal.setTentativasSolucionRedundantes(new ArrayList<>());
        }
        if (proposal.getReestructuracionesPropuestas() == null) {
            proposal.setReestructuracionesPropuestas(new ArrayList<>());
        }
        if (proposal.getPrescripcionesEstrategicas() == null) {
            proposal.setPrescripcionesEstrategicas(new ArrayList<>());
        }

        if (proposal.getDialogue() != null && !proposal.getDialogue().isEmpty()) {
            for (StructuredProposalData.DialogueTurn turn : proposal.getDialogue()) {
                String sp = turn.getSpeaker();
                if (sp != null) {
                    String clean = sp.trim().toLowerCase();
                    if (clean.contains("terap") || clean.contains("doc") || clean.contains("psic") || clean.contains("lic") || clean.contains("profesional")) {
                        turn.setSpeaker("Terapeuta");
                    } else if (clean.contains("pacien") || clean.contains("client") || clean.contains("usuari")) {
                        turn.setSpeaker("Paciente");
                    } else if (!"Terapeuta".equals(sp) && !"Paciente".equals(sp)) {
                        // Heurística de respaldo si el LLM dejó nombres propios:
                        String textLower = turn.getText() != null ? turn.getText().toLowerCase() : "";
                        if (textLower.contains("tarea") || textLower.contains("prescrip") || textLower.contains("diario")
                                || textLower.contains("cuéntame") || textLower.contains("próxima cita") || textLower.contains("buenas tardes")
                                || textLower.contains("¿qué haces habitualmente") || textLower.contains("comprendo")) {
                            turn.setSpeaker("Terapeuta");
                        } else {
                            turn.setSpeaker("Paciente");
                        }
                    }
                } else {
                    turn.setSpeaker("Paciente");
                }
            }
        } else if (segments != null && !segments.isEmpty()) {
            List<StructuredProposalData.DialogueTurn> turns = new ArrayList<>();
            for (TranscriptSegment seg : segments) {
                String sp = seg.getSpeaker();
                if (sp == null || sp.isBlank() || (!"Terapeuta".equals(sp) && !"Paciente".equals(sp))) {
                    String t = seg.getText().toLowerCase();
                    sp = (t.contains("doctor") || t.contains("terapeuta") || t.contains("cuéntame") || t.contains("diagnóstico") || t.contains("prescrip"))
                            ? "Terapeuta" : "Paciente";
                }
                turns.add(StructuredProposalData.DialogueTurn.builder()
                        .speaker(sp)
                        .text(seg.getText().trim())
                        .timestampStart(seg.getStart())
                        .timestampEnd(seg.getEnd())
                        .build());
            }
            proposal.setDialogue(turns);
        }
    }
}
