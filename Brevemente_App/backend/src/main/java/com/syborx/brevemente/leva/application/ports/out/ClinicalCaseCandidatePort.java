package com.syborx.brevemente.leva.application.ports.out;

import com.syborx.brevemente.leva.domain.model.CaseCandidate;
import com.syborx.brevemente.leva.domain.model.CaseClinicalSnapshot;

import java.util.List;
import java.util.Optional;

/** Lectura (solo lectura) de expedientes clínicos para la curaduría de casos. */
public interface ClinicalCaseCandidatePort {

    List<CaseCandidate> search(String query, String estatus, int limit);

    Optional<CaseClinicalSnapshot> loadSnapshot(String expedienteId);
}
