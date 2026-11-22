package com.syborx.brevemente.leva.application.service;

import com.syborx.brevemente.leva.application.ports.in.FindSimilarCasesUseCase;
import com.syborx.brevemente.leva.application.ports.in.ManageCaseSourcesUseCase;
import com.syborx.brevemente.leva.application.ports.out.ClinicalCaseCandidatePort;
import com.syborx.brevemente.leva.application.ports.out.ClinicalCaseSourceRepositoryPort;
import com.syborx.brevemente.leva.application.ports.out.LocalEmbeddingPort;
import com.syborx.brevemente.leva.domain.exception.LevaException;
import com.syborx.brevemente.leva.domain.model.CaseCandidate;
import com.syborx.brevemente.leva.domain.model.CaseClinicalSnapshot;
import com.syborx.brevemente.leva.domain.model.ClinicalCaseSource;
import com.syborx.brevemente.leva.domain.model.SimilarCaseMatch;
import com.syborx.brevemente.leva.domain.model.StructuredProposalData;
import com.syborx.brevemente.leva.domain.service.CaseAnonymizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.util.*;

/**
 * Memoria de casos de LEVA: curaduría (aceptar / retirar casos fuente) y recuperación
 * por similitud clínica (SPR + diagnóstico operativo + tentativas + prescripciones).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClinicalCaseSourceService implements ManageCaseSourcesUseCase, FindSimilarCasesUseCase {

    private static final int MAX_ITEMS = 8;
    private static final int MAX_ITEM_CHARS = 400;
    private static final int MAX_EMBED_CHARS = 2000;

    private static final Set<String> STOP_WORDS = Set.of(
            "para", "como", "cual", "cuales", "donde", "sobre", "entre", "este", "esta", "estos", "estas",
            "tiene", "hacer", "hace", "pero", "cuando", "cada", "tengo", "vamos", "buenas", "tardes",
            "doctor", "bueno", "porque", "desde", "hasta", "sino", "tambien", "aunque", "solo", "muy",
            "paciente", "terapeuta", "sesion", "esto", "eso", "ese", "esa", "algo", "todo", "toda");

    private final ClinicalCaseSourceRepositoryPort repository;
    private final ClinicalCaseCandidatePort candidatePort;
    private final LocalEmbeddingPort embeddingPort;

    /** Umbral mínimo de similitud (0..1) para considerar un caso como precedente. */
    @Value("${app.leva.cases.min-similarity:0.50}")
    private double minSimilarity = 0.50;

    // ------------------------------------------------------------------ Curaduría

    @Override
    @Transactional(readOnly = true)
    public List<CaseCandidate> searchCandidates(String query, String estatus, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        String q = (query != null && !query.isBlank()) ? query.trim() : null;
        String st = (estatus != null && !estatus.isBlank()) ? estatus.trim().toUpperCase(Locale.ROOT) : null;
        return candidatePort.search(q, st, safeLimit);
    }

    @Override
    @Transactional(readOnly = true)
    public ClinicalCaseSource previewDraft(String expedienteId) {
        CaseClinicalSnapshot snapshot = candidatePort.loadSnapshot(expedienteId)
                .orElseThrow(() -> new LevaException("No se encontró el expediente indicado."));
        return buildDraft(snapshot);
    }

    @Override
    @Transactional
    public ClinicalCaseSource acceptCase(String expedienteId, String notasCuraduria, String approvedBy) {
        if (repository.existsActiveByExpedienteId(expedienteId)) {
            throw new LevaException("Este expediente ya es una fuente de aprendizaje activa de LEVA.");
        }

        CaseClinicalSnapshot snapshot = candidatePort.loadSnapshot(expedienteId)
                .orElseThrow(() -> new LevaException("No se encontró el expediente indicado."));
        ClinicalCaseSource draft = buildDraft(snapshot);

        boolean sinContenido = isBlank(draft.getDiagnosticoOperativo())
                && draft.getPrescripciones().isEmpty() && draft.getTentativas().isEmpty();
        if (sinContenido) {
            throw new LevaException("El expediente no tiene información clínica suficiente (diagnóstico operativo, "
                    + "tentativas o prescripciones) para ser fuente de aprendizaje.");
        }

        String reviewer = isBlank(approvedBy) ? "Rol autorizado" : approvedBy.trim();
        if (reviewer.length() > 255) {
            reviewer = reviewer.substring(0, 255);
        }

        draft.setId(UUID.randomUUID().toString());
        draft.setCaseToken(repository.nextCaseToken());
        draft.setStatus(ClinicalCaseSource.STATUS_ACTIVE);
        draft.setNotasCuraduria(isBlank(notasCuraduria) ? null
                : CaseAnonymizer.scrub(notasCuraduria, snapshot.getIdentificadores()));
        draft.setApprovedBy(reviewer);
        draft.setApprovedAt(Instant.now());
        draft.setCreatedAt(Instant.now());
        draft.setEmbedding(safeEmbed(draft.getSearchText()));

        ClinicalCaseSource saved = repository.save(draft);
        log.info("[LEVA Casos] Caso {} aceptado como fuente de aprendizaje por {}", saved.getCaseToken(), reviewer);
        return saved;
    }

    @Override
    @Transactional
    public ClinicalCaseSource revokeCase(String sourceId, String revokedBy) {
        ClinicalCaseSource source = repository.findById(sourceId)
                .orElseThrow(() -> new LevaException("No se encontró el caso fuente indicado."));
        if (!source.isActive()) {
            return source;
        }
        source.setStatus(ClinicalCaseSource.STATUS_REVOKED);
        source.setRevokedBy(isBlank(revokedBy) ? "Rol autorizado" : revokedBy.trim());
        source.setRevokedAt(Instant.now());
        ClinicalCaseSource saved = repository.save(source);
        log.info("[LEVA Casos] Caso {} retirado del aprendizaje de LEVA por {}", saved.getCaseToken(), saved.getRevokedBy());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClinicalCaseSource> listSources(boolean includeRevoked) {
        return includeRevoked ? repository.findAllOrdered() : repository.findActive();
    }

    // ------------------------------------------------------------------ Recuperación

    @Override
    @Transactional(readOnly = true)
    public List<SimilarCaseMatch> findSimilar(String queryText, String sprHint, int limit) {
        if (isBlank(queryText) || limit <= 0) {
            return Collections.emptyList();
        }
        List<ClinicalCaseSource> active = repository.findActive();
        if (active.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> queryTokens = tokens(queryText);
        List<Float> queryVector = active.stream().anyMatch(c -> c.getEmbedding() != null && !c.getEmbedding().isEmpty())
                ? safeEmbed(queryText) : Collections.emptyList();

        List<SimilarCaseMatch> matches = new ArrayList<>();
        for (ClinicalCaseSource candidate : active) {
            double score = score(candidate, queryTokens, queryVector, sprHint);
            if (score >= minSimilarity) {
                matches.add(SimilarCaseMatch.builder().source(candidate).similarity(score).build());
            }
        }
        matches.sort((a, b) -> Double.compare(b.getSimilarity(), a.getSimilarity()));
        return matches.size() > limit ? new ArrayList<>(matches.subList(0, limit)) : matches;
    }

    double score(ClinicalCaseSource candidate, Set<String> queryTokens, List<Float> queryVector, String sprHint) {
        Set<String> caseTokens = tokens(candidate.getSearchText());
        double coverage = 0.0;
        if (!caseTokens.isEmpty()) {
            long hits = caseTokens.stream().filter(queryTokens::contains).count();
            coverage = (double) hits / caseTokens.size();
        }

        double base = coverage;
        if (candidate.getEmbedding() != null && !candidate.getEmbedding().isEmpty()
                && queryVector != null && !queryVector.isEmpty()) {
            double cosine = Math.max(0.0, embeddingPort.calculateCosineSimilarity(queryVector, candidate.getEmbedding()));
            base = 0.5 * cosine + 0.5 * coverage;
        }

        if (!isBlank(sprHint) && !isBlank(candidate.getSpr())) {
            String a = sprFamily(sprHint);
            String b = sprFamily(candidate.getSpr());
            if (a.equals(b)) {
                base += 0.10;
            } else {
                base -= 0.10;
            }
        }
        return Math.max(0.0, Math.min(1.0, base));
    }

    // ------------------------------------------------------------------ Construcción de la ficha

    ClinicalCaseSource buildDraft(CaseClinicalSnapshot snapshot) {
        List<String> ids = snapshot.getIdentificadores();
        List<StructuredProposalData> proposals = snapshot.getPropuestasAprobadas() != null
                ? snapshot.getPropuestasAprobadas() : Collections.emptyList();
        StructuredProposalData last = proposals.isEmpty() ? null : proposals.get(proposals.size() - 1);

        String spr = firstNonBlank(snapshot.getSprInicial(), last != null ? last.getSistemaPerceptivoReactivo() : null);
        String dx = firstNonBlank(snapshot.getDiagnosticoOperativo(), last != null ? last.getDiagnosticoOperativo() : null);

        List<String> tentativas = new ArrayList<>(splitLines(snapshot.getIntentosSolucion()));
        List<String> prescripciones = new ArrayList<>(
                snapshot.getPrescripcionesSesiones() != null ? snapshot.getPrescripcionesSesiones() : List.of());
        List<String> reestructuraciones = new ArrayList<>();
        for (StructuredProposalData p : proposals) {
            addAll(tentativas, p.getTentativasSolucionRedundantes());
            addAll(prescripciones, p.getPrescripcionesEstrategicas());
            addAll(reestructuraciones, p.getReestructuracionesPropuestas());
            if (!isBlank(p.getEstratagemaAplicada())) {
                prescripciones.add(p.getEstratagemaAplicada());
            }
        }

        String resultado = "";
        if (last != null) {
            resultado = String.join(" ", nonBlank(last.getValoracionDelCambio(), last.getReaccionPaciente()));
        }

        ClinicalCaseSource draft = ClinicalCaseSource.builder()
                .expedienteId(snapshot.getExpedienteId())
                .expedienteFolio(snapshot.getFolio())
                .status(ClinicalCaseSource.STATUS_ACTIVE)
                .spr(clean(spr, ids))
                .diagnosticoOperativo(clean(dx, ids))
                .trastornoEstrategico(clean(snapshot.getTrastornoEstrategico(), ids))
                .tentativas(cleanList(tentativas, ids))
                .prescripciones(cleanList(prescripciones, ids))
                .reestructuraciones(cleanList(reestructuraciones, ids))
                .resultado(clean(resultado, ids))
                .numSesiones(Math.max(snapshot.getNumSesiones(), proposals.size()))
                .perfilEtario(CaseAnonymizer.ageBracket(snapshot.getEdad()))
                .build();

        draft.setSearchText(String.join(" . ", nonBlank(
                draft.getSpr(),
                draft.getDiagnosticoOperativo(),
                draft.getTrastornoEstrategico(),
                String.join(" ", draft.getTentativas()),
                String.join(" ", draft.getPrescripciones()),
                String.join(" ", draft.getReestructuraciones()))));
        return draft;
    }

    // ------------------------------------------------------------------ Utilidades

    private List<Float> safeEmbed(String text) {
        try {
            String bounded = text.length() > MAX_EMBED_CHARS ? text.substring(0, MAX_EMBED_CHARS) : text;
            List<Float> v = embeddingPort.generateEmbedding(bounded);
            return v != null ? v : Collections.emptyList();
        } catch (Exception ex) {
            log.warn("[LEVA Casos] No se pudo generar embedding ({}). Se usará solo coincidencia léxica.", ex.getMessage());
            return Collections.emptyList();
        }
    }

    static Set<String> tokens(String text) {
        Set<String> out = new LinkedHashSet<>();
        if (text == null) {
            return out;
        }
        String normalized = Normalizer.normalize(text.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        for (String w : normalized.split("[^a-z0-9]+")) {
            if (w.length() >= 4 && !STOP_WORDS.contains(w)) {
                out.add(w);
            }
        }
        return out;
    }

    static String sprFamily(String spr) {
        String n = Normalizer.normalize(spr.toLowerCase(Locale.ROOT), Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        if (n.contains("fobic") || n.contains("panic")) return "FOBICO";
        if (n.contains("obsesiv") || n.contains("compulsiv")) return "OBSESIVO";
        if (n.contains("duda")) return "DUDA";
        if (n.contains("depres") || n.contains("desilusion")) return "DEPRESIVO";
        if (n.contains("aliment") || n.contains("atracon") || n.contains("anorex") || n.contains("bulim")) return "ALIMENTARIO";
        if (n.contains("paranoi") || n.contains("persecut")) return "PARANOICO";
        if (n.contains("hipocond")) return "HIPOCONDRIACO";
        if (n.contains("dismorf")) return "DISMORFICO";
        return n.trim();
    }

    private String clean(String text, List<String> identifiers) {
        String scrubbed = CaseAnonymizer.scrub(text, identifiers);
        return scrubbed.length() > MAX_ITEM_CHARS ? scrubbed.substring(0, MAX_ITEM_CHARS) : scrubbed;
    }

    private List<String> cleanList(List<String> items, List<String> identifiers) {
        LinkedHashSet<String> unique = new LinkedHashSet<>();
        for (String item : items) {
            String c = clean(item, identifiers);
            if (!c.isBlank()) {
                unique.add(c);
            }
            if (unique.size() >= MAX_ITEMS) {
                break;
            }
        }
        return new ArrayList<>(unique);
    }

    private static List<String> splitLines(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        List<String> out = new ArrayList<>();
        for (String part : text.split("[\\r\\n;]+")) {
            if (!part.isBlank()) {
                out.add(part.trim());
            }
        }
        return out;
    }

    private static void addAll(List<String> target, List<String> source) {
        if (source != null) {
            target.addAll(source);
        }
    }

    private static List<String> nonBlank(String... values) {
        List<String> out = new ArrayList<>();
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                out.add(v);
            }
        }
        return out;
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
