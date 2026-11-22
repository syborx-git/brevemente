package com.syborx.brevemente.leva.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Caso fuente recuperado por similitud clínica, con su puntaje (0..1). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimilarCaseMatch {
    private ClinicalCaseSource source;
    private double similarity;
}
