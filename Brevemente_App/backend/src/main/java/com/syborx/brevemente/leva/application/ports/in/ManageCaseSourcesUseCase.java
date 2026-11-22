package com.syborx.brevemente.leva.application.ports.in;

import com.syborx.brevemente.leva.domain.model.CaseCandidate;
import com.syborx.brevemente.leva.domain.model.ClinicalCaseSource;

import java.util.List;

/** Curaduría de casos clínicos fuente de aprendizaje (exclusivo del rol autorizado de LEVA). */
public interface ManageCaseSourcesUseCase {

    List<CaseCandidate> searchCandidates(String query, String estatus, int limit);

    /** Ficha anonimizada que LEVA aprendería, para revisión previa del curador. */
    ClinicalCaseSource previewDraft(String expedienteId);

    ClinicalCaseSource acceptCase(String expedienteId, String notasCuraduria, String approvedBy);

    ClinicalCaseSource revokeCase(String sourceId, String revokedBy);

    List<ClinicalCaseSource> listSources(boolean includeRevoked);
}
