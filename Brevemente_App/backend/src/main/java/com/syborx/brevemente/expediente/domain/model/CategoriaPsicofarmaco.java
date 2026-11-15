package com.syborx.brevemente.expediente.domain.model;

/**
 * Categoría del catálogo de psicofármacos (D-6), patrón de OpcionConductual (V19).
 */
public record CategoriaPsicofarmaco(
        String id,
        String codigo,
        String etiqueta,
        int orden
) {}
