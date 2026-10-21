package com.syborx.brevemente.paciente.domain.model;

/**
 * Sede de atención vinculada al terapeuta (tabla {@code terapeuta_sedes}, V14).
 */
public record TerapeutaSede(
        String id,
        String nombre,
        boolean esPrincipal
) {}
