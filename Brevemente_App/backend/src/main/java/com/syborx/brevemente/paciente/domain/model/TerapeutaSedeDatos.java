package com.syborx.brevemente.paciente.domain.model;

/**
 * Datos de una sede del terapeuta a crear/actualizar (CRUD de `terapeuta_sedes`).
 */
public record TerapeutaSedeDatos(
        String sedeId,
        boolean esPrincipal
) {}
