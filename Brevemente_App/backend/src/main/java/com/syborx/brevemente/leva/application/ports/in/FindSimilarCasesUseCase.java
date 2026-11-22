package com.syborx.brevemente.leva.application.ports.in;

import com.syborx.brevemente.leva.domain.model.SimilarCaseMatch;

import java.util.List;

/** Recuperación de casos fuente (aprobados por el rol autorizado) análogos a una sesión. */
public interface FindSimilarCasesUseCase {

    /**
     * @param queryText texto clínico a comparar (transcripción y/o formulación)
     * @param sprHint   Sistema Perceptivo-Reactivo detectado (opcional) para bonificar/penalizar
     * @param limit     máximo de casos a devolver
     */
    List<SimilarCaseMatch> findSimilar(String queryText, String sprHint, int limit);
}
