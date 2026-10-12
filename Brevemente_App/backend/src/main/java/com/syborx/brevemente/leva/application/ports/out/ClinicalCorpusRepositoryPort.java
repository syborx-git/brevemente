package com.syborx.brevemente.leva.application.ports.out;

import com.syborx.brevemente.leva.domain.model.ClinicalCorpusDocument;

import java.util.List;
import java.util.Optional;

public interface ClinicalCorpusRepositoryPort {
    List<ClinicalCorpusDocument> findAll();
    List<ClinicalCorpusDocument> searchByKeywordsOrProtocol(String query, String protocolFilter);
    Optional<ClinicalCorpusDocument> findByProtocolCode(String protocolCode);
}
