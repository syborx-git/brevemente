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
        String filter = (protocolFilter != null && !protocolFilter.isBlank()) ? protocolFilter : null;
        String q = (query != null && !query.isBlank()) ? query : "";
        return repository.searchByQueryAndProtocol(q, filter).stream().map(this::toDomain).toList();
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

        List<ClinicalCorpusChunkJpaEntity> allChunks = chunkRepository.findAll();
        if (allChunks.isEmpty()) {
            return Collections.emptyList();
        }

        // Generar embedding vectorial de la consulta clínica
        List<Float> queryVector = embeddingPort.generateEmbedding(queryText);

        record ScoredChunk(ClinicalCorpusChunkJpaEntity chunk, double score) {}

        List<ScoredChunk> scoredList = new ArrayList<>(allChunks.size());
        for (ClinicalCorpusChunkJpaEntity entity : allChunks) {
            double score;
            if (entity.getEmbedding() != null && !entity.getEmbedding().isEmpty() && !queryVector.isEmpty()) {
                score = embeddingPort.calculateCosineSimilarity(queryVector, entity.getEmbedding());
            } else {
                // Similitud léxica básica si no hay vectores
                score = calculateLexicalOverlap(queryText, entity.getContent());
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
        String[] qWords = query.toLowerCase().split("\\W+");
        String cLower = content.toLowerCase();
        int matches = 0;
        for (String w : qWords) {
            if (w.length() > 3 && cLower.contains(w)) {
                matches++;
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
