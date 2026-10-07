package com.syborx.brevemente.cita.domain.model;

import java.time.LocalDate;

/**
 * Filtros de listado de citas (todos opcionales).
 */
public record CitaFiltro(
        String terapeutaId,
        String pacienteId,
        String consultorio,
        String modalidad,
        String estado,
        LocalDate desde,
        LocalDate hasta
) {}
