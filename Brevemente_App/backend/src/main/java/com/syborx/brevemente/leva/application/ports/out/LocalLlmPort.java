package com.syborx.brevemente.leva.application.ports.out;

import com.syborx.brevemente.leva.domain.model.ClinicalCorpusDocument;
import com.syborx.brevemente.leva.domain.model.RiskAssessment;
import com.syborx.brevemente.leva.domain.model.StructuredProposalData;
import com.syborx.brevemente.leva.domain.model.TranscriptSegment;

import java.util.List;
import java.util.function.Consumer;

public interface LocalLlmPort {
    StructuredProposalData generateStructuredProposal(String fullText, List<TranscriptSegment> segments);
    String queryClosedCorpus(String userQuery, List<ClinicalCorpusDocument> contextDocuments);
    void streamQueryClosedCorpus(
            String userQuery,
            List<ClinicalCorpusDocument> contextDocuments,
            Consumer<String> chunkConsumer,
            Runnable onComplete,
            Consumer<Throwable> onError
    );
    RiskAssessment classifyRiskSemantics(String fullText);
}

