package com.syborx.brevemente.leva.application.ports.in;

import com.syborx.brevemente.leva.domain.model.ClinicalCorpusDocument;
import com.syborx.brevemente.leva.domain.model.ClosedCorpusQueryResult;

import java.util.List;

public interface QueryClosedCorpusUseCase {
    ClosedCorpusQueryResult queryCorpus(String query, String protocolFilter);
    List<ClinicalCorpusDocument> listAvailableProtocols();
}
