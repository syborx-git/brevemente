package com.syborx.brevemente.leva.application.ports.in;

import com.syborx.brevemente.leva.domain.model.ClinicalCorpusChunk;
import com.syborx.brevemente.leva.domain.model.ClinicalCorpusDocument;
import com.syborx.brevemente.leva.domain.model.ClosedCorpusQueryResult;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.List;

public interface QueryClosedCorpusUseCase {
    ClosedCorpusQueryResult queryCorpus(String query, String protocolFilter);
    SseEmitter streamQueryCorpus(String query, String protocolFilter);
    List<ClinicalCorpusDocument> listAvailableProtocols();
    void evictCorpusCache();
    ClinicalCorpusDocument saveDocument(ClinicalCorpusDocument document);
    ClinicalCorpusDocument saveDocumentWithChunks(ClinicalCorpusDocument document, List<ClinicalCorpusChunk> chunks);
    List<ClinicalCorpusChunk> getTopRelevantChunks(String query, int limit);
}

