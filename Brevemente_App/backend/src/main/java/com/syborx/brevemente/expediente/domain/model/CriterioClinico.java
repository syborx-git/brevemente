package com.syborx.brevemente.expediente.domain.model;

/**
 * Criterio clínico registrado por sesión (categoría + valor). Modelo inmutable.
 * Categorías cerradas: conductual, racionalizaciones_intelectualizaciones,
 * comparaciones, imagenes_intrusivas, otro (ver CHECK en V19).
 */
public record CriterioClinico(
        String id,
        String sesionId,
        String categoria,
        String valor
) {}
