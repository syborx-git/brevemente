package com.syborx.brevemente.leva.application.ports.out;

import com.syborx.brevemente.leva.domain.model.ClinicalCorpusDocument;
import com.syborx.brevemente.leva.domain.model.RiskAssessment;
import com.syborx.brevemente.leva.domain.model.StructuredProposalData;
import com.syborx.brevemente.leva.domain.model.TranscriptSegment;

import java.util.List;

public interface LocalLlmPort {
    StructuredProposalData generateStructuredProposal(String fullText, List<TranscriptSegment> segments);
    String queryClosedCorpus(String userQuery, List<ClinicalCorpusDocument> contextDocuments);
    RiskAssessment classifyRiskSemantics(String fullText);
}
