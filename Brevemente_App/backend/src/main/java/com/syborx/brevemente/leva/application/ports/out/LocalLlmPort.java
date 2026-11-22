package com.syborx.brevemente.leva.application.ports.out;

import com.syborx.brevemente.leva.domain.model.ClinicalCorpusChunk;
import com.syborx.brevemente.leva.domain.model.ClinicalCorpusDocument;
import com.syborx.brevemente.leva.domain.model.RiskAssessment;
import com.syborx.brevemente.leva.domain.model.StructuredProposalData;
import com.syborx.brevemente.leva.domain.model.TranscriptSegment;

import java.util.Collections;
import java.util.List;
import java.util.function.Consumer;

public interface LocalLlmPort {
    StructuredProposalData generateStructuredProposal(String fullText, List<TranscriptSegment> segments);

    default StructuredProposalData generateStructuredProposal(
            String fullText,
            List<TranscriptSegment> segments,
            List<ClinicalCorpusChunk> relevantChunks) {
        return generateStructuredProposal(fullText, segments);
    }

    /** Variante que además recibe casos fuente (precedentes institucionales) para informar prescripciones. */
    default StructuredProposalData generateStructuredProposal(
            String fullText,
            List<TranscriptSegment> segments,
            List<ClinicalCorpusChunk> relevantChunks,
            List<com.syborx.brevemente.leva.domain.model.SimilarCaseMatch> casePrecedents) {
        return generateStructuredProposal(fullText, segments, relevantChunks);
    }

    String queryClosedCorpus(String userQuery, List<ClinicalCorpusDocument> contextDocuments);
    void streamQueryClosedCorpus(
            String userQuery,
            List<ClinicalCorpusDocument> contextDocuments,
            Consumer<String> chunkConsumer,
            Runnable onComplete,
            Consumer<Throwable> onError
    );
    RiskAssessment classifyRiskSemantics(String fullText);

    com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto.GeneratedProtocolDraftResponse generateProtocolDraft(
            com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto.GenerateProtocolDraftRequest request,
            List<ClinicalCorpusChunk> exemplarChunks
    );
}

