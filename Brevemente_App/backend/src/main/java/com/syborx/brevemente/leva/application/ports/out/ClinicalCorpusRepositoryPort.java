package com.syborx.brevemente.leva.application.ports.out;

import com.syborx.brevemente.leva.domain.model.ClinicalCorpusChunk;
import com.syborx.brevemente.leva.domain.model.ClinicalCorpusDocument;

import java.util.List;
import java.util.Optional;

public interface ClinicalCorpusRepositoryPort {
    List<ClinicalCorpusDocument> findAll();
    List<ClinicalCorpusDocument> searchByKeywordsOrProtocol(String query, String protocolFilter);
    Optional<ClinicalCorpusDocument> findByProtocolCode(String protocolCode);
    Optional<ClinicalCorpusDocument> findById(String id);
    ClinicalCorpusDocument save(ClinicalCorpusDocument document);
    void deleteById(String id);

    List<ClinicalCorpusChunk> saveChunks(String documentId, List<ClinicalCorpusChunk> chunks);
    List<ClinicalCorpusChunk> findChunksByDocumentId(String documentId);
    void deleteChunksByDocumentId(String documentId);
    List<ClinicalCorpusChunk> findTopRelevantChunks(String queryText, int limit);
}
