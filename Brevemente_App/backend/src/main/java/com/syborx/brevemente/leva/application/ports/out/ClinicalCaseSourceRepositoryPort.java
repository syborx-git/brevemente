package com.syborx.brevemente.leva.application.ports.out;

import com.syborx.brevemente.leva.domain.model.ClinicalCaseSource;

import java.util.List;
import java.util.Optional;

public interface ClinicalCaseSourceRepositoryPort {

    ClinicalCaseSource save(ClinicalCaseSource source);

    Optional<ClinicalCaseSource> findById(String id);

    List<ClinicalCaseSource> findActive();

    List<ClinicalCaseSource> findAllOrdered();

    boolean existsActiveByExpedienteId(String expedienteId);

    /** Genera el siguiente token docente opaco (REF-CASO-AAAA-NNN). */
    String nextCaseToken();
}
