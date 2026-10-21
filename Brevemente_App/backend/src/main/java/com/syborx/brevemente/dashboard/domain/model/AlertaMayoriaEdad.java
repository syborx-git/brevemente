package com.syborx.brevemente.dashboard.domain.model;

/**
 * Paciente detectado en estado {@code REPRESENTADO_POR_EDAD} que ya cumplió 18 años
 * (requiere reconsentimiento autónomo). No filtrada por rol (paridad con la demo).
 */
public record AlertaMayoriaEdad(
        String pacienteId,
        String nombre,
        String fechaNacimiento,
        String representante
) {}
