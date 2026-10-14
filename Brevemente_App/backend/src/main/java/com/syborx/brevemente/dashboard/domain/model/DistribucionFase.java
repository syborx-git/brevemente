package com.syborx.brevemente.dashboard.domain.model;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Agregación "Distribución por Fase TBE". Las fases se derivan de
 * {@code status} + {@code riskLevel} (SDD-005 §2.3).
 */
public record DistribucionFase(String fase, long valor) {

    public static final List<String> FASES_CANONICAS = List.of(
            "Fase 1: Admisión/Definición",
            "Fase 2: Desbloqueo",
            "Fase 3: Consolidación",
            "Fase 4: Cierre/Alta");

    /**
     * Completa los grupos devueltos por la persistencia con las 4 fases canónicas
     * (cero donde no hay pacientes), manteniendo el orden canónico.
     */
    public static List<DistribucionFase> completar(List<DistribucionFase> grupos) {
        Map<String, Long> porFase = new LinkedHashMap<>();
        if (grupos != null) {
            for (DistribucionFase grupo : grupos) {
                if (grupo != null && grupo.fase() != null) {
                    porFase.merge(grupo.fase(), grupo.valor(), Long::sum);
                }
            }
        }
        return FASES_CANONICAS.stream()
                .map(fase -> new DistribucionFase(fase, porFase.getOrDefault(fase, 0L)))
                .toList();
    }
}
