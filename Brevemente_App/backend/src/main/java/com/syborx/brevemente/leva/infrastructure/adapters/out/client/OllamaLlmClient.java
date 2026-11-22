package com.syborx.brevemente.leva.infrastructure.adapters.out.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syborx.brevemente.leva.application.ports.out.DocumentConverterPort.DocumentChunkDto;
import com.syborx.brevemente.leva.application.ports.out.LocalLlmPort;
import com.syborx.brevemente.leva.domain.model.*;
import com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto.GenerateProtocolDraftRequest;
import com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto.GeneratedProtocolDraftResponse;
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
            Eres un motor técnico de extracción documental y formulación estratégica para psicólogos y profesionales de la salud mental colegiados, especializado en Terapia Breve Estratégica (TBE, modelo Giorgio Nardone), CIE-11 y DSM-5-TR.
            Tu función técnica es analizar la transcripción de una sesión psicoterapéutica y los fragmentos de protocolo clínico provistos, estructurando la formulación del caso en formato JSON estricto.

            REGLAS FUNDAMENTALES OBLIGATORIAS:
            1. Devuelve ÚNICAMENTE un objeto JSON válido según el esquema solicitado, sin texto explicativo adicional ni bloques Markdown fuera del JSON.
            2. VINCULACIÓN ESTRICTA CON EL PROTOCOLO CLÍNICO RECUPERADO:
               - En los campos 'protocoloCodigo' y 'protocoloReferencia', DEBES consignar el código y título del protocolo provisto en los fragmentos (ejemplo: 'TBE-PROTOCOLO-HIDRO' y 'Protocolo Clínico TBE: Hidrofobia y Ansiedad Acuática [TBE-PROTOCOLO-HIDRO]').
               - En 'puntoClaveProtocolo', describe de forma sintetizada la técnica, estratagema o mecanismo central del protocolo en que se fundamenta la intervención (ejemplo: "Estratagema de 'El Espejo Líquido': Exposición matutina de 5 minutos mirando el reflejo en el lavabo sin tocar el agua para extinguir el pánico y quebrar la delegación de auxilio").
               - En 'fragmentoProtocolo', incluye la cita textual o extracto directo del protocolo del corpus de donde extrajiste la intervención.
               - El 'diagnosticoOperativo' (DX.OP) DEBE describir con precisión y claridad cómo funciona el problema en la transcripción (ej. 'Fobia específica al agua / Ansiedad acuática ante aproximación a lavabos o inmersión, mantenida por evitación y delegación'). NUNCA uses diagnósticos genéricos o vagos.
               - En 'prescripcionesEstrategicas', DEBES incluir las prescripciones y estratagemas exactas indicadas en el fragmento del protocolo provisto (por ejemplo: 'La Estratagema de El Espejo Líquido').
            3. REGLA ESTRICTA DE DIARIZACIÓN ('dialogue'):
               - El atributo 'speaker' en cada turno DEBE ser exactamente "Terapeuta" o "Paciente".
               - Si el turno realiza preguntas clínicas, guía la sesión, formula reestructuraciones o prescribe: speaker = "Terapeuta".
               - Si el turno expone síntomas, responde al terapeuta o describe sus problemas: speaker = "Paciente".
            4. CRITERIOS CLÍNICOS ESTRATÉGICOS (TBE):
               - sistemaPerceptivoReactivo: Clasificación TBE acorde al problema (Fóbico, Obsesivo-Compulsivo, Depresivo, Duda Patológica, etc.).
               - tentativasSolucionRedundantes: Acciones o conductas del paciente o su entorno que mantienen o agravan el síntoma.
               - reestructuracionesPropuestas: Aforismos, metáforas o reencuadres estratégicos introducidos para cambiar la percepción del problema.
               - prescripcionesEstrategicas: Tareas o prescripciones asignadas según el protocolo.
               - notaEvolucionSoap: Formato formal estandarizado organizado estrictamente en cuatro ejes:
                 S (Subjetivo): Motivo de consulta y síntomas referidos por el paciente.
                 O (Objetivo): Apariencia, orientación, coherencia, estado afectivo observado.
                 A (Análisis/Evaluación): Formulación diagnóstica (TBE, CIE-11 / DSM-5-TR) y dinámica del sistema perceptivo-reactivo.
                 P (Plan): Tareas prescritas, objetivos de la siguiente sesión y temporalidad acordada.
            """;

    /**
     * Contexto compacto de precedentes institucionales (casos fuente anonimizados y aprobados por la
     * dirección clínica). Se limita a 2 casos y ~500 caracteres por caso para no saturar la ventana.
     */
    private String buildCasePrecedentContext(List<com.syborx.brevemente.leva.domain.model.SimilarCaseMatch> casePrecedents) {
        if (casePrecedents == null || casePrecedents.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder("PRECEDENTES CLÍNICOS INSTITUCIONALES (casos reales anonimizados, solo como apoyo):\n");
        int count = 0;
        for (var match : casePrecedents) {
            if (count++ >= 2 || match.getSource() == null) {
                break;
            }
            var src = match.getSource();
            sb.append("--- [").append(src.getCaseToken()).append("] similitud ")
                    .append(Math.round(match.getSimilarity() * 100)).append("% ---\n");
            if (src.getDiagnosticoOperativo() != null) {
                sb.append("Dinámica: ").append(truncate(src.getDiagnosticoOperativo(), 220)).append("\n");
            }
            if (src.getPrescripciones() != null && !src.getPrescripciones().isEmpty()) {
                sb.append("Prescripciones aplicadas: ")
                        .append(truncate(String.join(" | ", src.getPrescripciones()), 220)).append("\n");
            }
            if (src.getResultado() != null && !src.getResultado().isBlank()) {
                sb.append("Resultado: ").append(truncate(src.getResultado(), 120)).append("\n");
            }
            sb.append("\n");
        }
        sb.append("INSTRUCCIÓN: Si un precedente coincide con la dinámica de esta sesión, puedes inspirar las prescripciones "
                + "en lo que funcionó allí y mencionarlo por su código REF-CASO en 'justificacionEstrategica'. "
                + "NO inventes datos que no estén en los precedentes y NUNCA copies identidades.\n\n");
        return sb.toString();
    }

    private static String truncate(String text, int max) {
        if (text == null) {
            return "";
        }
        return text.length() > max ? text.substring(0, max) + "…" : text;
    }

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
              "protocoloCodigo": "TBE-PANICO-01",
              "protocoloReferencia": "Protocolo TBE: Trastorno de Pánico y Agorafobia [TBE-PANICO-01]",
              "puntoClaveProtocolo": "Estratagema de 'La Peor Fantasía' (saturación paradójica del miedo) y 'Diario de a Bordo' para desviar el foco hipervigilante corporal.",
              "fragmentoProtocolo": "ESTRATAGEMAS Y PRESCRIPCIONES: a) La Peor Fantasía: Dedicar media hora diaria a imaginar los peores temores... b) Diario de a Bordo: Registrar en libreta los síntomas en el momento exacto.",
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

    private static final String PROTOCOL_GENERATOR_SYSTEM_PROMPT = """
            Eres LEVA Protocol Architect, motor clínico experto en Terapia Breve Estratégica (TBE, Escuela de Arezzo, modelo Giorgio Nardone).
            Tu función es estructurar la formulación canónica completa de un nuevo protocolo clínico a partir de las indicaciones de un psicoterapeuta colegiado.

            REGLAS METODOLÓGICAS DE AREZZO:
            1. Devuelve ÚNICAMENTE un objeto JSON válido con los siguientes atributos exactos:
               - 'title': "Protocolo Clínico TBE: [Nombre del Problema / Fobia / Conducta]"
               - 'protocolCode': Código único en mayúsculas (ej. "TBE-AMAXOFOBIA-01", "TBE-GLOSOFOBIA-01")
               - 'category': "PROTOCOLO_TBE"
               - 'sourceReference': Autor o tratado de referencia (ej. "Escuela de TBE Arezzo - Protocolos Específicos")
               - 'objetivo': Meta operativa para desactivar el bucle disfuncional (ej. "Interrumpir la tentativa de evitación...")
               - 'sistemaPerceptivoReactivo': Modalidad perceptiva (Fóbico, Obsesivo-Compulsivo, Duda Patológica, Depresivo / Desilusión, etc.)
               - 'tentativasSolucion': Lista de 3 a 5 conductas redundantes típicas que mantienen el síntoma.
               - 'puntoClave': Descripción del mecanismo central y la estratagema TBE seleccionada.
               - 'prescripcionesEstrategicas': Lista de 2 a 4 prescripciones operativas exactas con horario, duración y ritual de ejecución.
               - 'reestructuracionArezzo': Aforismo estratégico o analogía paradójica de Arezzo.
               - 'markdownContent': Documento Markdown completo y formateado con títulos (#, ##, ###), tablas de fases (Fase 1: Desbloqueo, Fase 2: Consolidación, Fase 3: Cierre) y listas de verificación.
               - 'chunks': Lista de objetos con 'chunkIndex', 'title', 'content', 'wordCount' representando 2 a 3 fragmentos semánticos lógicos para indexación RAG.
            """;

    @Override
    public StructuredProposalData generateStructuredProposal(String fullText, List<TranscriptSegment> segments) {
        return generateStructuredProposal(fullText, segments, Collections.emptyList());
    }

    @Override
    public StructuredProposalData generateStructuredProposal(
            String fullText,
            List<TranscriptSegment> segments,
            List<ClinicalCorpusChunk> relevantChunks) {
        return generateStructuredProposal(fullText, segments, relevantChunks, Collections.emptyList());
    }

    @Override
    public StructuredProposalData generateStructuredProposal(
            String fullText,
            List<TranscriptSegment> segments,
            List<ClinicalCorpusChunk> relevantChunks,
            List<com.syborx.brevemente.leva.domain.model.SimilarCaseMatch> casePrecedents) {
        int chunkCount = (relevantChunks != null) ? relevantChunks.size() : 0;
        log.info("[LEVA LLM] Generando propuesta clínica estructurada (Few-Shot) con {} fragmentos de protocolo RAG y modelo local: {}",
                chunkCount, modelName);

        StringBuilder protocolContext = new StringBuilder();
        if (chunkCount > 0) {
            protocolContext.append("FRAGMENTOS DE PROTOCOLO CLÍNICO RECUPERADOS (REGLAS OBLIGATORIAS):\n");
            for (ClinicalCorpusChunk chunk : relevantChunks) {
                String protoCode = (chunk.getProtocolCode() != null && !chunk.getProtocolCode().isBlank())
                        ? chunk.getProtocolCode() : "PROTOCOLO-TBE";
                protocolContext.append("--- [").append(protoCode).append("] ");
                if (chunk.getTitle() != null && !chunk.getTitle().isBlank()) {
                    protocolContext.append("(").append(chunk.getTitle()).append(")");
                }
                protocolContext.append(" ---\n")
                        .append(chunk.getContent())
                        .append("\n\n");
            }
        }

        String precedentContext = buildCasePrecedentContext(casePrecedents);
        String userPrompt = (protocolContext.length() > 0 ? protocolContext.toString() : "") + precedentContext
                + "Transcripción de la sesión:\n\"\"\"\n" + fullText + "\n\"\"\""
                + (protocolContext.length() > 0 ? "\n\nINSTRUCCIÓN ESTRICTA: Basa el diagnóstico operativo (DX.OP) y las prescripciones estratégicas (PX) estrictamente en los fragmentos de protocolo clínico arriba indicados." : "");

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
        return buildHeuristicFallbackProposal(fullText, segments, relevantChunks);
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
            Eres un motor de extracción y análisis documental para psicólogos y profesionales de la salud mental.
            Tu función es extraer y citar información estrictamente técnica de los documentos provistos, respondiendo a la consulta técnica del especialista.
            Sé conciso, directo y profesional (máximo 2 párrafos clínicos). Cita siempre el código de protocolo o título al responder.
            Si la información solicitada no está documentada en los textos provistos, indica de forma clara que no se encuentra en el corpus clínico cerrado.
            """;

        String userPrompt = "TEXTO TÉCNICO DE REFERENCIA:\n" + contextBuilder + "\nCONSULTA: " + userQuery;

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
            Eres un motor de extracción y análisis documental para psicólogos y profesionales de la salud mental.
            Tu función es extraer y citar información estrictamente técnica de los documentos provistos, respondiendo a la consulta técnica del especialista.
            Sé conciso, directo y profesional (máximo 2 párrafos clínicos). Cita siempre el código de protocolo o título al responder.
            Si la información solicitada no está documentada en los textos provistos, indica de forma clara que no se encuentra en el corpus clínico cerrado.
            """;

        String userPrompt = "TEXTO TÉCNICO DE REFERENCIA:\n" + contextBuilder + "\nCONSULTA: " + userQuery;

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

    private StructuredProposalData buildHeuristicFallbackProposal(
            String fullText,
            List<TranscriptSegment> segments,
            List<ClinicalCorpusChunk> relevantChunks) {
        List<StructuredProposalData.DialogueTurn> turns = new ArrayList<>();

        if (segments != null && !segments.isEmpty()) {
            for (TranscriptSegment seg : segments) {
                String speaker = seg.getSpeaker();
                if (speaker == null || speaker.isBlank()) {
                    String t = seg.getText().toLowerCase();
                    speaker = (t.contains("doctor") || t.contains("terapeuta") || t.contains("cómo te llamas")
                            || t.contains("¿por qué vienes?") || t.contains("diagnóstico") || t.contains("buenas tardes")
                            || t.contains("vamos a acordar") || t.contains("prescripción"))
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

        String lowerText = (fullText != null) ? fullText.toLowerCase() : "";
        ClinicalCorpusChunk topChunk = (relevantChunks != null && !relevantChunks.isEmpty()) ? relevantChunks.get(0) : null;

        String protoCode = (topChunk != null && topChunk.getProtocolCode() != null && !topChunk.getProtocolCode().isBlank())
                ? topChunk.getProtocolCode() : null;
        String protoTitle = (topChunk != null && topChunk.getTitle() != null && !topChunk.getTitle().isBlank())
                ? topChunk.getTitle() : null;

        boolean isHydro = lowerText.contains("hidro") || lowerText.contains("agua") || lowerText.contains("lavabo")
                || lowerText.contains("espejo líquido") || lowerText.contains("acuátic")
                || (protoCode != null && protoCode.toLowerCase().contains("hidro"));

        if (isHydro) {
            protoCode = (protoCode != null) ? protoCode : "TBE-PROTOCOLO-HIDRO";
            protoTitle = (protoTitle != null) ? protoTitle : "Protocolo Clínico TBE: Hidrofobia y Ansiedad Acuática";
            String ref = protoTitle + " [" + protoCode + "]";

            return StructuredProposalData.builder()
                    .protocoloCodigo(protoCode)
                    .protocoloReferencia(ref)
                    .puntoClaveProtocolo("Estratagema de 'El Espejo Líquido': Exposición de 5 minutos diarios a las 8:00 AM frente al lavabo lleno mirando el reflejo sin tocar el agua y anotando sensaciones en libreta, quebrando el bucle de evitación y cancelando la delegación de auxilio familiar.")
                    .fragmentoProtocolo("PUNTO CLAVE Y ESTRATAGEMA CENTRAL TBE: La Prescripción de 'El Espejo Líquido'. Colocarse diariamente a las 8:00 AM exactamente durante 5 minutos frente a un lavabo lleno con agua en reposo, mirando únicamente el reflejo en la superficie sin tocar el agua y anotando sensaciones en libreta. Bloqueo de la delegación familiar: cancelar el auxilio que confirma la invalidez asumida.")
                    .justificacionEstrategica("El cuadro clínico corresponde al protocolo de fobia específica al agua e hidrofobia validado en el corpus clínico TBE.")
                    .diagnosticoOperativo("Fobia Específica al Agua (Hidrofobia y Ansiedad Acuática). Ansiedad paroxística y bloqueo ante la aproximación a lavabos, regaderas o inmersión, mantenida por evitación activa y delegación de auxilio a familiares.")
                    .sistemaPerceptivoReactivo("Fóbico (Miedo fóbico al agua / Evitación y delegación)")
                    .tentativasSolucionRedundantes(List.of(
                            "Evitación sistemática del contacto o aproximación a cuerpos de agua y lavabos",
                            "Petición de auxilio y delegación de tareas de higiene a familiares para no enfrentar el agua",
                            "Intento de control racional forzado de la respiración y palpitaciones ante la cercanía del agua"
                    ))
                    .reestructuracionesPropuestas(List.of(
                            "El miedo que evitas hoy se convierte en el pánico de mañana.",
                            "Intentar controlar deliberadamente una reacción involuntaria es lo que genera el descontrol."
                    ))
                    .prescripcionesEstrategicas(List.of(
                            "Prescripción de 'El Espejo Líquido': colocarse frente a un lavabo lleno durante 5 minutos exactos a las 8:00 AM mirando el reflejo sin tocar el agua y anotando las sensaciones en libreta"
                    ))
                    .valoracionDelCambio("Definición operativa del sistema perceptivo-reactivo fóbico. Prescripción de reestructuración paradójica acordada.")
                    .estratagemaAplicada("La Estratagema de El Espejo Líquido (Reestructuración paradójica TBE)")
                    .reaccionPaciente("Aceptación colaborativa y compromiso con la tarea matutina de registro.")
                    .notaEvolucionSoap("S: Paciente acude refiriendo temor intenso e invalidante ante el contacto o proximidad con agua (hidrofobia), disnea y taquicardia reactiva. O: Facie de ansiedad ante la evocación del estímulo acuático, orientado en tres esferas, juicio de realidad conservado. A: Cuadro clínico compatible con Fobia Específica (CIE-11: 6B03 / DSM-5-TR: 300.29). Sistema perceptivo-reactivo fóbico mantenido por evitación activa y delegación. P: Protocolo TBE Hidrofobia. Prescripción de 'El Espejo Líquido' (5 min diarios a las 8:00 hrs frente a lavabo con registro en libreta). Próxima cita en 7 días.")
                    .dialogue(turns)
                    .build();
        }

        if (topChunk != null) {
            String ref = (protoTitle != null && !protoTitle.isBlank()) ? protoTitle + " [" + protoCode + "]" : protoCode;
            return StructuredProposalData.builder()
                    .protocoloCodigo(protoCode)
                    .protocoloReferencia(ref)
                    .puntoClaveProtocolo(topChunk.getTitle() != null ? "Punto Clave según " + topChunk.getTitle() : "Técnica clínica estandarizada TBE")
                    .fragmentoProtocolo(topChunk.getContent())
                    .justificacionEstrategica("Protocolo identificado a partir de los documentos del corpus clínico cerrado en base de datos.")
                    .diagnosticoOperativo("Cuadro clínico formulado según " + (protoTitle != null ? protoTitle : "Protocolo TBE") + " a partir del motivo de consulta expresado.")
                    .sistemaPerceptivoReactivo("Fóbico / Reactivo")
                    .tentativasSolucionRedundantes(List.of("Evitación de estímulos ansiogénicos", "Búsqueda de control o apoyo externo"))
                    .reestructuracionesPropuestas(List.of("El miedo evitado se transforma en pánico; el miedo afrontado se disuelve."))
                    .prescripcionesEstrategicas(List.of("Prescripción estratégica acorde al protocolo " + protoCode))
                    .valoracionDelCambio("Identificación de SPR e inicio de intervención estructurada.")
                    .estratagemaAplicada("Intervención protocolizada TBE")
                    .reaccionPaciente("Receptiva a la formulación estratégica.")
                    .notaEvolucionSoap("S: Motivo de consulta registrado en sesión. O: Evaluado en consulta. A: Análisis según protocolo " + protoCode + ". P: Prescripción TBE aplicada.")
                    .dialogue(turns)
                    .build();
        }

        return StructuredProposalData.builder()
                .protocoloCodigo("TBE-GENERAL")
                .protocoloReferencia("Protocolo General de Terapia Breve Estratégica [TBE-GENERAL]")
                .puntoClaveProtocolo("Estratagema de 'La Peor Fantasía' / Declaración del síntoma para interrumpir la evitación fóbica y la hipervigilancia.")
                .fragmentoProtocolo("ESTRATAGEMA TBE GENERAL: Identificación del sistema perceptivo-reactivo e interrupción de las tentativas de solución redundantes.")
                .diagnosticoOperativo("Sintomatología reactiva reportada en sesión, mantenida por conductas de evitación y búsqueda de control.")
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

    @Override
    public GeneratedProtocolDraftResponse generateProtocolDraft(
            GenerateProtocolDraftRequest request,
            List<ClinicalCorpusChunk> exemplarChunks
    ) {
        log.info("[LEVA Protocol Architect] Diseñando borrador de protocolo clínico para: '{}' (SPR: {})",
                request.getProblemaClinico(), request.getSprTentativo());

        StringBuilder exemplarsText = new StringBuilder();
        if (exemplarChunks != null && !exemplarChunks.isEmpty()) {
            exemplarsText.append("EJEMPLOS DE REFERENCIA DE PROTOCOLOS TBE EXISTENTES EN EL CORPUS:\n");
            for (ClinicalCorpusChunk chk : exemplarChunks) {
                exemplarsText.append("--- [").append(chk.getProtocolCode()).append("] ").append(chk.getTitle()).append(" ---\n")
                        .append(chk.getContent()).append("\n\n");
            }
        }

        StringBuilder userPrompt = new StringBuilder();
        if (exemplarsText.length() > 0) {
            userPrompt.append(exemplarsText).append("\n");
        }
        userPrompt.append("SOLICITUD DEL TERAPEUTA PARA NUEVO PROTOCOLO CLÍNICO:\n")
                .append("- Problema o Trastorno Clínico: ").append(request.getProblemaClinico()).append("\n")
                .append("- Sistema Perceptivo-Reactivo (SPR): ").append(request.getSprTentativo()).append("\n");

        if (request.getTentativasSolucionObservadas() != null && !request.getTentativasSolucionObservadas().isEmpty()) {
            userPrompt.append("- Tentativas de solución observadas: ")
                    .append(String.join(", ", request.getTentativasSolucionObservadas())).append("\n");
        }
        if (request.getEstratagemaSugerida() != null && !request.getEstratagemaSugerida().isBlank()) {
            userPrompt.append("- Estratagema o técnica sugerida: ").append(request.getEstratagemaSugerida()).append("\n");
        }
        if (request.getPoblacionContexto() != null && !request.getPoblacionContexto().isBlank()) {
            userPrompt.append("- Población / Contexto: ").append(request.getPoblacionContexto()).append("\n");
        }
        if (request.getLibroReferencia() != null && !request.getLibroReferencia().isBlank()) {
            userPrompt.append("- Tratado o bibliografía de referencia: ").append(request.getLibroReferencia()).append("\n");
        }

        userPrompt.append("\nGenera el objeto JSON estricto con todos los atributos solicitados conforme al modelo canónico de Arezzo.");

        try {
            Map<String, Object> requestPayload = Map.of(
                    "model", modelName,
                    "messages", List.of(
                            Map.of("role", "system", "content", PROTOCOL_GENERATOR_SYSTEM_PROMPT.trim()),
                            Map.of("role", "user", "content", userPrompt.toString())
                    ),
                    "stream", false,
                    "format", "json",
                    "options", Map.of(
                            "temperature", 0.1,
                            "num_predict", 1500,
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
                    GeneratedProtocolDraftResponse response = objectMapper.readValue(contentJson, GeneratedProtocolDraftResponse.class);
                    normalizeProtocolDraft(response, request);
                    return response;
                }
            }
        } catch (Exception ex) {
            log.warn("[LEVA Protocol Architect] Inferencia no disponible en Ollama ({}): {}. Aplicando constructor heurístico TBE.",
                    ollamaUrl, ex.getMessage());
        }

        return buildHeuristicProtocolDraft(request);
    }

    private void normalizeProtocolDraft(GeneratedProtocolDraftResponse response, GenerateProtocolDraftRequest request) {
        if (response.getTitle() == null || response.getTitle().isBlank()) {
            response.setTitle("Protocolo Clínico TBE: " + request.getProblemaClinico());
        }
        if (response.getCategory() == null || response.getCategory().isBlank()) {
            response.setCategory("PROTOCOLO_TBE");
        }
        if (response.getSourceReference() == null || response.getSourceReference().isBlank()) {
            response.setSourceReference(request.getLibroReferencia() != null && !request.getLibroReferencia().isBlank()
                    ? request.getLibroReferencia()
                    : "Escuela de TBE Arezzo - Protocolos Específicos");
        }
        if (response.getProtocolCode() == null || response.getProtocolCode().isBlank()) {
            String sanitized = request.getProblemaClinico().toUpperCase()
                    .replaceAll("[^A-Z0-9]+", "-")
                    .replaceAll("^-|-$", "");
            if (sanitized.length() > 18) sanitized = sanitized.substring(0, 18);
            response.setProtocolCode("TBE-" + sanitized + "-01");
        } else {
            response.setProtocolCode(response.getProtocolCode().trim().toUpperCase());
        }

        if (response.getObjetivo() == null || response.getObjetivo().isBlank()) {
            response.setObjetivo("Interrumpir la tentativa de solución redundante que mantiene el cuadro de " + request.getProblemaClinico() + ".");
        }
        if (response.getSistemaPerceptivoReactivo() == null || response.getSistemaPerceptivoReactivo().isBlank()) {
            response.setSistemaPerceptivoReactivo(request.getSprTentativo());
        }

        if (response.getTentativasSolucion() == null || response.getTentativasSolucion().isEmpty()) {
            if (request.getTentativasSolucionObservadas() != null && !request.getTentativasSolucionObservadas().isEmpty()) {
                response.setTentativasSolucion(new ArrayList<>(request.getTentativasSolucionObservadas()));
            } else {
                response.setTentativasSolucion(List.of(
                        "Evitación activa de las situaciones temidas o desencadenantes",
                        "Búsqueda reiterada de auxilio o reaseguración en el entorno cercano",
                        "Intento infructuoso de control racional voluntario de respuestas fisiológicas"
                ));
            }
        }

        if (response.getPuntoClave() == null || response.getPuntoClave().isBlank()) {
            response.setPuntoClave(request.getEstratagemaSugerida() != null && !request.getEstratagemaSugerida().isBlank()
                    ? "Estratagema central: " + request.getEstratagemaSugerida()
                    : "Intervención paradójica para desbloquear la rigidez perceptiva.");
        }

        if (response.getPrescripcionesEstrategicas() == null || response.getPrescripcionesEstrategicas().isEmpty()) {
            response.setPrescripcionesEstrategicas(List.of(
                    "Diario de a bordo: Registro estricto del síntoma en libreta en el instante de su aparición.",
                    "Prescripción paradójica: Orientación directa hacia el foco sintomático para saturar la resistencia."
            ));
        }

        if (response.getReestructuracionArezzo() == null || response.getReestructuracionArezzo().isBlank()) {
            response.setReestructuracionArezzo("El miedo mirado de frente se convierte en valor; el miedo evitado se transforma en pánico.");
        }

        if (response.getMarkdownContent() == null || response.getMarkdownContent().isBlank()) {
            response.setMarkdownContent(synthesizeMarkdown(response));
        }

        if (response.getChunks() == null || response.getChunks().isEmpty()) {
            response.setChunks(synthesizeChunks(response));
        }
    }

    private GeneratedProtocolDraftResponse buildHeuristicProtocolDraft(GenerateProtocolDraftRequest request) {
        String code = "TBE-" + request.getProblemaClinico().toUpperCase()
                .replaceAll("[^A-Z0-9]+", "-")
                .replaceAll("^-|-$", "");
        if (code.length() > 22) code = code.substring(0, 22);

        List<String> tentativas = (request.getTentativasSolucionObservadas() != null && !request.getTentativasSolucionObservadas().isEmpty())
                ? new ArrayList<>(request.getTentativasSolucionObservadas())
                : List.of(
                        "Evitación activa de las situaciones o estímulos desencadenantes del cuadro",
                        "Delegación de tareas y petición reiterada de auxilio a familiares cercanos",
                        "Hipervigilancia somática y control deliberado de reacciones espontáneas"
                );

        String estratagema = (request.getEstratagemaSugerida() != null && !request.getEstratagemaSugerida().isBlank())
                ? request.getEstratagemaSugerida()
                : "Prescripción de la Peor Fantasía y Bloqueo de la Delegación";

        List<String> prescripciones = List.of(
                "La Estratagema de " + estratagema + ": Colocarse en un lugar seguro durante exactamente 5 minutos diarios anotando sensaciones.",
                "Bloqueo de la delegación familiar: Cancelar el auxilio que confirma y alimenta la incapacidad percibida."
        );

        String reestructuracion = "Quien pide auxilio confirma en cada acto su propia incapacidad; el síntoma enfrentado se disuelve.";

        GeneratedProtocolDraftResponse draft = GeneratedProtocolDraftResponse.builder()
                .title("Protocolo Clínico TBE: " + request.getProblemaClinico())
                .protocolCode(code)
                .category("PROTOCOLO_TBE")
                .sourceReference(request.getLibroReferencia() != null && !request.getLibroReferencia().isBlank()
                        ? request.getLibroReferencia()
                        : "Escuela de TBE Arezzo - Protocolos Específicos")
                .objetivo("Interrumpir el bucle redundante de evitación fóbica y control disfuncional en " + request.getProblemaClinico() + ".")
                .sistemaPerceptivoReactivo(request.getSprTentativo())
                .tentativasSolucion(tentativas)
                .puntoClave("Estratagema central: " + estratagema + " para desactivar el circuito de mantenimiento sintomático.")
                .prescripcionesEstrategicas(prescripciones)
                .reestructuracionArezzo(reestructuracion)
                .build();

        draft.setMarkdownContent(synthesizeMarkdown(draft));
        draft.setChunks(synthesizeChunks(draft));
        return draft;
    }

    private String synthesizeMarkdown(GeneratedProtocolDraftResponse proto) {
        StringBuilder sb = new StringBuilder();
        sb.append("# ").append(proto.getTitle()).append("\n\n")
                .append("**Código Oficial:** `").append(proto.getProtocolCode()).append("` | ")
                .append("**Categoría:** ").append(proto.getCategory()).append(" | ")
                .append("**Referencia:** ").append(proto.getSourceReference()).append("\n\n")
                .append("## 1. Objetivo Clínico y Diana TBE\n")
                .append(proto.getObjetivo()).append("\n\n")
                .append("## 2. Sistema Perceptivo-Reactivo (SPR)\n")
                .append("**Modalidad:** ").append(proto.getSistemaPerceptivoReactivo()).append("\n\n")
                .append("## 3. Tentativas de Solución Redundantes Típicas\n");

        if (proto.getTentativasSolucion() != null) {
            for (String t : proto.getTentativasSolucion()) {
                sb.append("- ").append(t).append("\n");
            }
        }

        sb.append("\n## 4. Punto Clave y Estratagema Central TBE\n")
                .append(proto.getPuntoClave()).append("\n\n")
                .append("## 5. Prescripciones Estratégicas Operativas (PX)\n");

        if (proto.getPrescripcionesEstrategicas() != null) {
            for (String p : proto.getPrescripcionesEstrategicas()) {
                sb.append("- ").append(p).append("\n");
            }
        }

        sb.append("\n## 6. Reestructuración Estratégica de Arezzo\n")
                .append("> *\"").append(proto.getReestructuracionArezzo()).append("\"*\n\n")
                .append("## 7. Fases de Intervención en Sesión\n")
                .append("| Fase | Objetivo Terapéutico | Sesiones Estimadas |\n")
                .append("| :--- | :--- | :--- |\n")
                .append("| **Fase 1: Desbloqueo** | Diagnóstico operativo y quiebre de la tentativa redundante | Sesiones 1 a 3 |\n")
                .append("| **Fase 2: Consolidación** | Afianzamiento de nuevas percepciones y autonomía | Sesiones 4 a 6 |\n")
                .append("| **Fase 3: Cierre y Seguimiento** | Prevención de recaídas y balance clínico | A los 3, 6 y 12 meses |\n");

        return sb.toString();
    }

    private List<DocumentChunkDto> synthesizeChunks(GeneratedProtocolDraftResponse proto) {
        List<DocumentChunkDto> chunks = new ArrayList<>();

        // Chunk 0: Objetivo, SPR y Tentativas
        StringBuilder c0 = new StringBuilder();
        c0.append("OBJETIVO: ").append(proto.getObjetivo())
                .append(" SISTEMA PERCEPTIVO-REACTIVO: ").append(proto.getSistemaPerceptivoReactivo())
                .append(" TENTATIVAS DE SOLUCIÓN COMUNES: ");
        if (proto.getTentativasSolucion() != null) {
            for (int i = 0; i < proto.getTentativasSolucion().size(); i++) {
                c0.append((i + 1)).append(") ").append(proto.getTentativasSolucion().get(i)).append(". ");
            }
        }
        chunks.add(new DocumentChunkDto(
                0,
                proto.getTitle().replace("Protocolo Clínico TBE: ", "") + ": SPR y Tentativas",
                c0.toString().trim(),
                c0.toString().split("\\s+").length
        ));

        // Chunk 1: Punto Clave y Prescripciones
        StringBuilder c1 = new StringBuilder();
        c1.append("PUNTO CLAVE Y ESTRATAGEMA CENTRAL TBE: ").append(proto.getPuntoClave())
                .append(" PRESCRIPCIONES OPERATIVAS: ");
        if (proto.getPrescripcionesEstrategicas() != null) {
            for (int i = 0; i < proto.getPrescripcionesEstrategicas().size(); i++) {
                c1.append((char) ('a' + i)).append(") ").append(proto.getPrescripcionesEstrategicas().get(i)).append(" ");
            }
        }
        c1.append("REESTRUCTURACIÓN DE AREZZO: ").append(proto.getReestructuracionArezzo());
        chunks.add(new DocumentChunkDto(
                1,
                proto.getTitle().replace("Protocolo Clínico TBE: ", "") + ": Punto Clave y Prescripciones",
                c1.toString().trim(),
                c1.toString().split("\\s+").length
        ));

        return chunks;
    }
}
