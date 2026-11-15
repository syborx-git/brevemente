package com.syborx.brevemente.expediente.domain.model;

/**
 * Opción del catálogo cerrado del criterio conductual (#107).
 */
public record OpcionConductual(
        String id,
        String codigo,
        String etiqueta,
        Integer orden
) {}
