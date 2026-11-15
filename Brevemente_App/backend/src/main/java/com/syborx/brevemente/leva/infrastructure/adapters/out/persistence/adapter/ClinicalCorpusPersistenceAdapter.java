package com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.adapter;

import com.syborx.brevemente.leva.application.ports.out.ClinicalCorpusRepositoryPort;
import com.syborx.brevemente.leva.application.ports.out.LocalEmbeddingPort;
import com.syborx.brevemente.leva.domain.model.ClinicalCorpusChunk;
import com.syborx.brevemente.leva.domain.model.ClinicalCorpusDocument;
import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.entity.ClinicalCorpusChunkJpaEntity;
import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.entity.ClinicalCorpusJpaEntity;
import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.repository.SpringDataClinicalCorpusChunkRepository;
import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.repository.SpringDataClinicalCorpusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClinicalCorpusPersistenceAdapter implements ClinicalCorpusRepositoryPort {

    private final SpringDataClinicalCorpusRepository repository;
    private final SpringDataClinicalCorpusChunkRepository chunkRepository;
    private final LocalEmbeddingPort embeddingPort;

    @Override
    public List<ClinicalCorpusDocument> findAll() {
        return repository.findAll().stream().map(this::toDomain).toList();
    }

    @Override
    public List<ClinicalCorpusDocument> searchByKeywordsOrProtocol(String query, String protocolFilter) {
        String filter = (protocolFilter != null && !protocolFilter.isBlank()) ? protocolFilter.trim() : null;
        String q = (query != null && !query.isBlank()) ? query.trim() : "";

        if (filter != null && !filter.isEmpty()) {
            return repository.searchByQueryAndProtocol(q, filter).stream().map(this::toDomain).toList();
        }

        if (!q.isEmpty()) {
            List<ClinicalCorpusJpaEntity> exactMatches = repository.searchByQuery(q);
            if (!exactMatches.isEmpty()) {
                return exactMatches.stream().map(this::toDomain).toList();
            }

            // Búsqueda semántica granular en chunks si la frase completa no coincide textualmente
            List<String> keywords = Arrays.stream(q.toLowerCase().split("[^\\p{L}\\p{Nd}]+"))
                    .filter(w -> w.length() >= 4)
                    .filter(w -> !Set.of("para", "como", "cual", "cuales", "donde", "sobre", "entre", "este", "esta", "estos", "estas", "consiste", "indica", "enumera", "explica", "segun", "tiene", "hacer", "hace").contains(w))
                    .toList();

            Set<String> matchedDocIds = new LinkedHashSet<>();
            for (String kw : keywords) {
                List<ClinicalCorpusChunkJpaEntity> chunks = chunkRepository.searchByKeyword(kw, org.springframework.data.domain.PageRequest.of(0, 5));
                for (ClinicalCorpusChunkJpaEntity chunk : chunks) {
                    matchedDocIds.add(chunk.getDocumentId());
                }
            }

            if (!matchedDocIds.isEmpty()) {
                List<ClinicalCorpusDocument> matchedDocs = new ArrayList<>();
                for (String docId : matchedDocIds) {
                    repository.findById(docId).map(this::toDomain).ifPresent(matchedDocs::add);
                }
                return matchedDocs;
            }
        }

        return Collections.emptyList();
    }

    @Override
    public Optional<ClinicalCorpusDocument> findByProtocolCode(String protocolCode) {
        return repository.findByProtocolCode(protocolCode).map(this::toDomain);
    }

    @Override
    public ClinicalCorpusDocument save(ClinicalCorpusDocument document) {
        ClinicalCorpusJpaEntity entity = ClinicalCorpusJpaEntity.builder()
                .id(document.getId())
                .title(document.getTitle())
                .protocolCode(document.getProtocolCode())
                .category(document.getCategory())
                .content(document.getContent())
                .sourceReference(document.getSourceReference())
                .createdAt(document.getCreatedAt() != null ? document.getCreatedAt().atOffset(ZoneOffset.UTC) : OffsetDateTime.now())
                .build();

        return toDomain(repository.save(entity));
    }

    @Override
    @Transactional
    public List<ClinicalCorpusChunk> saveChunks(String documentId, List<ClinicalCorpusChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return Collections.emptyList();
        }

        chunkRepository.deleteByDocumentId(documentId);

        List<ClinicalCorpusChunkJpaEntity> entities = new ArrayList<>(chunks.size());
        for (ClinicalCorpusChunk c : chunks) {
            String chunkId = (c.getId() != null && !c.getId().isBlank()) ? c.getId() : UUID.randomUUID().toString();

            // Generar embedding matemático localmente si no viene provisto
            List<Float> vector = (c.getEmbedding() != null && !c.getEmbedding().isEmpty())
                    ? c.getEmbedding()
                    : embeddingPort.generateEmbedding(c.getContent());

            ClinicalCorpusChunkJpaEntity entity = ClinicalCorpusChunkJpaEntity.builder()
                    .id(chunkId)
                    .documentId(documentId)
                    .protocolCode(c.getProtocolCode())
                    .chunkIndex(c.getChunkIndex() != null ? c.getChunkIndex() : 0)
                    .title(c.getTitle())
                    .content(c.getContent())
                    .wordCount(c.getWordCount() != null ? c.getWordCount() : c.getContent().split("\\s+").length)
                    .embedding(vector)
                    .createdAt(OffsetDateTime.now())
                    .build();

            entities.add(entity);
        }

        List<ClinicalCorpusChunkJpaEntity> saved = chunkRepository.saveAll(entities);
        log.info("[Corpus Chunks] Guardados {} chunks semánticos indexados para documento: {}", saved.size(), documentId);

        return saved.stream().map(this::toChunkDomain).toList();
    }

    @Override
    public List<ClinicalCorpusChunk> findChunksByDocumentId(String documentId) {
        return chunkRepository.findByDocumentIdOrderByChunkIndexAsc(documentId).stream()
                .map(this::toChunkDomain)
                .toList();
    }

    @Override
    public List<ClinicalCorpusChunk> findTopRelevantChunks(String queryText, int limit) {
        if (queryText == null || queryText.isBlank()) {
            return Collections.emptyList();
        }

        List<ClinicalCorpusChunkJpaEntity> allChunks = new ArrayList<>(chunkRepository.findAll());

        // Asegurar que si un protocolo en clinical_corpus_documents no tiene chunks indexados, participe en RAG
        List<ClinicalCorpusJpaEntity> allDocs = repository.findAll();
        Set<String> chunkDocIds = new HashSet<>();
        for (ClinicalCorpusChunkJpaEntity c : allChunks) {
            if (c.getDocumentId() != null) {
                chunkDocIds.add(c.getDocumentId());
            }
        }
        for (ClinicalCorpusJpaEntity doc : allDocs) {
            if (!chunkDocIds.contains(doc.getId())) {
                allChunks.add(ClinicalCorpusChunkJpaEntity.builder()
                        .id("vchunk-" + doc.getId())
                        .documentId(doc.getId())
                        .protocolCode(doc.getProtocolCode())
                        .chunkIndex(0)
                        .title(doc.getTitle())
                        .content(doc.getContent())
                        .wordCount(doc.getContent() != null ? doc.getContent().split("\\s+").length : 0)
                        .build());
            }
        }

        if (allChunks.isEmpty()) {
            return Collections.emptyList();
        }

        // Generar embedding vectorial de la consulta clínica
        List<Float> queryVector = embeddingPort.generateEmbedding(queryText);

        record ScoredChunk(ClinicalCorpusChunkJpaEntity chunk, double score) {}

        String queryLower = queryText.toLowerCase();
        boolean queryHasWater = queryLower.contains("hidro") || queryLower.contains("agua")
                || queryLower.contains("lavabo") || queryLower.contains("espejo")
                || queryLower.contains("bañar") || queryLower.contains("ducha") || queryLower.contains("inmersi");

        List<ScoredChunk> scoredList = new ArrayList<>(allChunks.size());
        for (ClinicalCorpusChunkJpaEntity entity : allChunks) {
            String protoCode = entity.getProtocolCode() != null ? entity.getProtocolCode().toLowerCase() : "";
            String protoTitle = entity.getTitle() != null ? entity.getTitle().toLowerCase() : "";
            String combinedText = (entity.getTitle() != null ? entity.getTitle() + " " : "")
                    + (entity.getProtocolCode() != null ? entity.getProtocolCode() + " " : "")
                    + (entity.getContent() != null ? entity.getContent() : "");
            double lexicalScore = calculateLexicalOverlap(queryText, combinedText);

            // Boost clínico de alta fidelidad: Si la consulta es de hidrofobia/agua, priorizar protocolo de hidrofobia
            if (queryHasWater && (protoCode.contains("hidro") || protoTitle.contains("hidro") || protoTitle.contains("agua") || combinedText.toLowerCase().contains("hidro"))) {
                lexicalScore += 100.0;
            }

            double score;
            if (entity.getEmbedding() != null && !entity.getEmbedding().isEmpty() && !queryVector.isEmpty()) {
                double vectorSim = embeddingPort.calculateCosineSimilarity(queryVector, entity.getEmbedding());
                score = (vectorSim * 0.4) + (lexicalScore * 0.6);
            } else {
                score = lexicalScore;
            }
            scoredList.add(new ScoredChunk(entity, score));
        }

        // Ordenar por similitud de mayor a menor y tomar los primeros 'limit'
        return scoredList.stream()
                .sorted((a, b) -> Double.compare(b.score(), a.score()))
                .limit(limit)
                .map(sc -> toChunkDomain(sc.chunk()))
                .toList();
    }

    private double calculateLexicalOverlap(String query, String content) {
        if (query == null || content == null) return 0.0;
        String[] qWords = query.toLowerCase().split("[^\\p{L}\\p{Nd}]+");
        String cLower = content.toLowerCase();
        Set<String> stopWords = Set.of(
                "para", "como", "cual", "cuales", "donde", "sobre", "entre", "este", "esta", "estos", "estas",
                "consiste", "indica", "enumera", "explica", "segun", "tiene", "hacer", "hace", "doctor",
                "buenas", "tardes", "cuentame", "bueno", "pero", "cuando", "cada", "tengo", "vamos"
        );
        double matches = 0.0;
        for (String w : qWords) {
            if (w.length() >= 4 && !stopWords.contains(w) && cLower.contains(w)) {
                if (w.contains("hidro") || w.contains("fobia") || w.contains("panico") || w.contains("pánico")
                        || w.contains("espejo") || w.contains("agua") || w.contains("obsesi") || w.contains("compulsi")
                        || w.contains("liquido") || w.contains("líquido")) {
                    matches += 3.0;
                } else {
                    matches += 1.0;
                }
            }
        }
        return matches;
    }

    private ClinicalCorpusDocument toDomain(ClinicalCorpusJpaEntity entity) {
        return ClinicalCorpusDocument.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .protocolCode(entity.getProtocolCode())
                .category(entity.getCategory())
                .content(entity.getContent())
                .sourceReference(entity.getSourceReference())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant() : null)
                .build();
    }

    private ClinicalCorpusChunk toChunkDomain(ClinicalCorpusChunkJpaEntity entity) {
        return ClinicalCorpusChunk.builder()
                .id(entity.getId())
                .documentId(entity.getDocumentId())
                .protocolCode(entity.getProtocolCode())
                .chunkIndex(entity.getChunkIndex())
                .title(entity.getTitle())
                .content(entity.getContent())
                .wordCount(entity.getWordCount())
                .embedding(entity.getEmbedding())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant() : null)
                .build();
    }
}
