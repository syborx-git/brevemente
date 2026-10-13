package com.syborx.brevemente.leva.application.service;

import com.syborx.brevemente.leva.application.ports.in.*;
import com.syborx.brevemente.leva.application.ports.out.*;
import com.syborx.brevemente.leva.domain.exception.LevaException;
import com.syborx.brevemente.leva.domain.exception.TranscriptionTaskNotFoundException;
import com.syborx.brevemente.leva.domain.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.syborx.brevemente.config.CacheConfig;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class LevaOrchestrationService implements
        StartTranscriptionUseCase,
        ProcessTranscriptionCallbackUseCase,
        GetLevaProposalUseCase,
        ApproveClinicalProposalUseCase,
        QueryClosedCorpusUseCase,
        EvaluateRiskUseCase {

    private final TranscriptionClientPort transcriptionClientPort;
    private final LocalLlmPort localLlmPort;
    private final TranscriptionTaskRepositoryPort taskRepositoryPort;
    private final LevaProposalRepositoryPort proposalRepositoryPort;
    private final ClinicalCorpusRepositoryPort corpusRepositoryPort;
    private final CacheManager cacheManager;


    @Value("${app.leva.callback-url:http://localhost:8080/api/v1/internal/transcriptions/callback}")
    private String defaultCallbackUrl;

    @Override
    @Transactional
    public TranscriptionTask startSessionTranscription(String sessionId, MultipartFile audioFile, String language) {
        String taskId = UUID.randomUUID().toString();
        log.info("[LEVA Engine] Iniciando tarea de transcripción {} para sesión: {}", taskId, sessionId);

        TranscriptionTask task = TranscriptionTask.builder()
                .id(taskId)
                .sessionId(sessionId)
                .audioFileName(audioFile != null ? audioFile.getOriginalFilename() : "audio_stream")
                .status(TranscriptionTaskStatus.PROCESSING)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        task = taskRepositoryPort.save(task);

        // Despachar llamada asíncrona hacia transcript_engine_python
        try {
            transcriptionClientPort.dispatchAsyncTranscription(
                    taskId,
                    audioFile,
                    defaultCallbackUrl,
                    (language != null && !language.isBlank()) ? language : "es"
            );
        } catch (Exception ex) {
            log.error("[LEVA Engine] Error al despachar tarea a Python Whisper: {}", ex.getMessage());
            task.setStatus(TranscriptionTaskStatus.FAILED);
            task.setErrorMessage("Fallo al contactar motor de transcripción: " + ex.getMessage());
            task.setUpdatedAt(Instant.now());
            return taskRepositoryPort.save(task);
        }

        return task;
    }

    @Override
    @Transactional
    public LevaClinicalProposal processCallback(RawTranscriptionResult rawResult) {
        log.info("[LEVA Engine] Procesando Webhook callback de transcripción para tarea: {}", rawResult.getTaskId());

        TranscriptionTask task = taskRepositoryPort.findById(rawResult.getTaskId())
                .orElseThrow(() -> new TranscriptionTaskNotFoundException(rawResult.getTaskId()));

        boolean isSuccess = "COMPLETED".equalsIgnoreCase(rawResult.getStatus());
        task.setStatus(isSuccess ? TranscriptionTaskStatus.COMPLETED : TranscriptionTaskStatus.FAILED);
        task.setDurationSeconds(rawResult.getDurationSeconds());
        task.setLanguageDetected(rawResult.getLanguageDetected());
        task.setRawResult(rawResult);
        task.setErrorMessage(rawResult.getErrorMessage());
        task.setUpdatedAt(Instant.now());
        taskRepositoryPort.save(task);

        if (!isSuccess) {
            log.warn("[LEVA Engine] Tarea de transcripción {} falló en Python: {}", task.getId(), rawResult.getErrorMessage());
            return null;
        }

        // 1. Barrera de Seguridad y Detección de Riesgo (Suicidio, autolesión, violencia)
        RiskAssessment riskAssessment = evaluateRiskFromText(rawResult.getFullText());

        // 2. Extracción Estructurada con LLaMA 3.1 8B (Diagnóstico Operativo, Prescripciones, SOAP y Diálogo)
        log.info("[LEVA Engine] Generando propuesta clínica estructurada con LLaMA 3.1...");
        StructuredProposalData proposalData = localLlmPort.generateStructuredProposal(
                rawResult.getFullText(),
                rawResult.getSegments()
        );

        // 3. Crear propuesta en estado PROPOSED (Human-in-the-Loop)
        LevaClinicalProposal proposal = LevaClinicalProposal.builder()
                .id(UUID.randomUUID().toString())
                .taskId(task.getId())
                .citaId(task.getSessionId())
                .pacienteId(task.getPacienteId())
                .terapeutaId(task.getTerapeutaId())
                .humanReviewStatus(HumanReviewStatus.PROPOSED)
                .riskLevel(riskAssessment.getLevel())
                .riskAlertDetails(riskAssessment)
                .structuredProposal(proposalData)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        LevaClinicalProposal savedProposal = proposalRepositoryPort.save(proposal);
        log.info("[LEVA Engine] Propuesta clínica {} creada exitosamente en estado PROPOSED (Riesgo: {})",
                savedProposal.getId(), riskAssessment.getLevel());

        return savedProposal;
    }

    @Override
    @Transactional(readOnly = true)
    public LevaClinicalProposal getProposalBySessionId(String sessionId) {
        return proposalRepositoryPort.findByCitaId(sessionId)
                .orElseThrow(() -> new LevaException("No se encontró propuesta clínica para la sesión: " + sessionId));
    }

    @Override
    @Transactional(readOnly = true)
    public LevaClinicalProposal getProposalByTaskId(String taskId) {
        return proposalRepositoryPort.findByTaskId(taskId)
                .orElseThrow(() -> new LevaException("No se encontró propuesta clínica para la tarea: " + taskId));
    }

    @Override
    @Transactional
    public LevaClinicalProposal approveProposal(String proposalId, String reviewedById, StructuredProposalData approvedData) {
        log.info("[LEVA Engine] Human-in-the-Loop: Aprobando y sellando propuesta {} por terapeuta {}", proposalId, reviewedById);

        LevaClinicalProposal proposal = proposalRepositoryPort.findById(proposalId)
                .orElseThrow(() -> new LevaException("No se encontró la propuesta clínica con ID: " + proposalId));

        proposal.setHumanReviewStatus(HumanReviewStatus.APPROVED);
        proposal.setApprovedData(approvedData != null ? approvedData : proposal.getStructuredProposal());
        proposal.setReviewedById(reviewedById);
        proposal.setReviewedAt(Instant.now());
        proposal.setUpdatedAt(Instant.now());

        return proposalRepositoryPort.save(proposal);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.CACHE_CORPUS_QUERIES, keyGenerator = "corpusQueryKeyGenerator")
    public ClosedCorpusQueryResult queryCorpus(String query, String protocolFilter) {
        log.info("[LEVA Engine - Cache MISS] Ejecutando consulta RAG sobre corpus cerrado: '{}' (Filtro: {})", query, protocolFilter);

        List<ClinicalCorpusDocument> contextDocuments = resolveContextDocuments(query, protocolFilter);
        String answer = localLlmPort.queryClosedCorpus(query, contextDocuments);

        List<ClosedCorpusQueryResult.CitedSource> citedSources = contextDocuments.stream()
                .map(doc -> ClosedCorpusQueryResult.CitedSource.builder()
                        .protocolCode(doc.getProtocolCode())
                        .title(doc.getTitle())
                        .category(doc.getCategory())
                        .reference(doc.getSourceReference())
                        .build())
                .toList();

        return ClosedCorpusQueryResult.builder()
                .query(query)
                .answer(answer)
                .citedSources(citedSources)
                .groundedInCorpus(true)
                .build();
    }

    @Override
    public SseEmitter streamQueryCorpus(String query, String protocolFilter) {
        SseEmitter emitter = new SseEmitter(120000L);

        String queryNorm = (query != null) ? query.trim().toLowerCase().replaceAll("\\s+", " ") : "";
        String filterNorm = (protocolFilter != null) ? protocolFilter.trim().toLowerCase() : "none";
        String cacheKey = "q:" + queryNorm + "|f:" + filterNorm;

        org.springframework.cache.Cache cache = cacheManager.getCache(CacheConfig.CACHE_CORPUS_QUERIES);
        if (cache != null && cache.get(cacheKey) != null) {
            ClosedCorpusQueryResult cached = (ClosedCorpusQueryResult) cache.get(cacheKey).get();
            if (cached != null) {
                log.info("[LEVA Engine - Stream HIT] Respuesta en caché para '{}'. Transmitiendo en 0ms.", query);
                CompletableFuture.runAsync(() -> {
                    try {
                        emitter.send(SseEmitter.event().name("token").data(cached.getAnswer()));
                        emitter.send(SseEmitter.event().name("complete").data("[DONE]"));
                        emitter.complete();
                    } catch (Exception e) {
                        emitter.completeWithError(e);
                    }
                });
                return emitter;
            }
        }

        List<ClinicalCorpusDocument> contextDocuments = resolveContextDocuments(query, protocolFilter);

        CompletableFuture.runAsync(() -> {
            StringBuilder accumulatedAnswer = new StringBuilder();
            try {
                localLlmPort.streamQueryClosedCorpus(
                        query,
                        contextDocuments,
                        chunk -> {
                            try {
                                accumulatedAnswer.append(chunk);
                                emitter.send(SseEmitter.event().name("token").data(chunk));
                            } catch (Exception e) {
                                log.warn("[LEVA Stream] Error transmitiendo token SSE: {}", e.getMessage());
                            }
                        },
                        () -> {
                            try {
                                if (cache != null && !accumulatedAnswer.isEmpty()) {
                                    cache.put(cacheKey, ClosedCorpusQueryResult.builder()
                                            .query(query)
                                            .answer(accumulatedAnswer.toString())
                                            .groundedInCorpus(true)
                                            .build());
                                }
                                emitter.send(SseEmitter.event().name("complete").data("[DONE]"));
                                emitter.complete();
                            } catch (Exception e) {
                                emitter.completeWithError(e);
                            }
                        },
                        error -> {
                            log.error("[LEVA Stream] Error en stream de LLM: {}", error.getMessage());
                            emitter.completeWithError(error);
                        }
                );
            } catch (Exception ex) {
                emitter.completeWithError(ex);
            }
        });

        return emitter;
    }

    private List<ClinicalCorpusDocument> resolveContextDocuments(String query, String protocolFilter) {
        List<ClinicalCorpusDocument> contextDocuments = new ArrayList<>();

        // 1. Si el terapeuta seleccionó un filtro de protocolo, buscar directamente por su código
        if (protocolFilter != null && !protocolFilter.isBlank()) {
            corpusRepositoryPort.findByProtocolCode(protocolFilter.trim())
                    .ifPresent(contextDocuments::add);
        }

        // 2. Si no se encontró por código o no había filtro, buscar por palabras clave
        if (contextDocuments.isEmpty()) {
            contextDocuments = corpusRepositoryPort.searchByKeywordsOrProtocol(query, protocolFilter);
        }

        // 3. Fallback clínico: Seleccionar el documento más afín en vez de sobrecargar la CPU con todos
        if (contextDocuments.isEmpty()) {
            List<ClinicalCorpusDocument> allDocs = corpusRepositoryPort.findAll();
            if (!allDocs.isEmpty()) {
                String lowerQuery = (query != null) ? query.toLowerCase() : "";
                ClinicalCorpusDocument bestDoc = allDocs.stream()
                        .filter(d -> (lowerQuery.contains("pánico") || lowerQuery.contains("panico") || lowerQuery.contains("fobia")) && d.getProtocolCode().contains("PANICO") ||
                                     (lowerQuery.contains("toc") || lowerQuery.contains("obsesi")) && d.getProtocolCode().contains("TOC") ||
                                     (lowerQuery.contains("depres") || lowerQuery.contains("triste")) && d.getProtocolCode().contains("DEPRESION"))
                        .findFirst()
                        .orElse(allDocs.get(0));
                contextDocuments.add(bestDoc);
            }
        }
        return contextDocuments;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.CACHE_CLINICAL_PROTOCOLS)
    public List<ClinicalCorpusDocument> listAvailableProtocols() {
        log.info("[LEVA Engine - Cache MISS] Consultando base de datos de protocolos clínicos.");
        return corpusRepositoryPort.findAll();
    }

    @Override
    @CacheEvict(value = {CacheConfig.CACHE_CORPUS_QUERIES, CacheConfig.CACHE_CLINICAL_PROTOCOLS}, allEntries = true)
    public void evictCorpusCache() {
        log.info("[LEVA Engine] Limpiando memoria caché de consultas al corpus clínico y protocolos.");
    }

    @Override
    public RiskAssessment evaluateRiskFromText(String transcriptionText) {
        if (transcriptionText == null || transcriptionText.isBlank()) {
            return RiskAssessment.builder()
                    .level(RiskLevel.NONE)
                    .recommendedProtocol("Sin texto a evaluar.")
                    .build();
        }

        String lower = transcriptionText.toLowerCase();
        List<String> triggers = new ArrayList<>();
        List<String> categories = new ArrayList<>();
        RiskLevel level = RiskLevel.NONE;

        // Reglas de alerta roja: Ideación suicida directa o autolesión inminente
        String[] highRiskKeywords = {
                "suicidio", "suicidarme", "quitarme la vida", "matarme", "acabar con todo",
                "no quiero vivir", "cortarme las venas", "ahorcarme", "tomar pastillas para no despertar"
        };
        for (String kw : highRiskKeywords) {
            if (lower.contains(kw)) {
                triggers.add(kw);
                categories.add("IDEACION_SUICIDA_O_AUTOLESION");
                level = RiskLevel.CRITICAL;
            }
        }

        // Reglas de alerta amarilla: Violencia o ideación pasiva
        String[] mediumRiskKeywords = {
                "ya no puedo más", "desearía no despertar", "golpearme", "hacerle daño",
                "violencia física", "me golpeó", "abuso"
        };
        for (String kw : mediumRiskKeywords) {
            if (lower.contains(kw) && !triggers.contains(kw)) {
                triggers.add(kw);
                categories.add("RIESGO_MODERADO_O_VIOLENCIA");
                if (level == RiskLevel.NONE) {
                    level = RiskLevel.MEDIUM;
                }
            }
        }

        boolean requiresImmediateIntervention = (level == RiskLevel.HIGH || level == RiskLevel.CRITICAL);
        String protocol = requiresImmediateIntervention
                ? "ALERTA ROJA CLÍNICA: Activar Protocolo de Derivación Urgente a Psiquiatría y Notificación a Persona de Apoyo (NOM-004-SSA3)."
                : (level == RiskLevel.MEDIUM ? "Atención Prioritaria: Profundizar en red de apoyo y recursos protectores." : "Sin indicadores de riesgo inminente detectados.");

        return RiskAssessment.builder()
                .level(level)
                .detectedTriggers(triggers)
                .riskCategories(categories.stream().distinct().toList())
                .recommendedProtocol(protocol)
                .escalationSummary("Evaluación automática completada. Nivel: " + level)
                .requiresImmediateHumanIntervention(requiresImmediateIntervention)
                .build();
    }
}
