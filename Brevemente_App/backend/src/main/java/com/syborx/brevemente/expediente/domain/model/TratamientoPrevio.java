package com.syborx.brevemente.expediente.domain.model;

/**
 * Tratamiento psicoterapéutico previo del paciente (D-2).
 */
public record TratamientoPrevio(
        String id,
        String expedienteId,
        String enfoque,
        String duracion,
        String resultado
) {}
