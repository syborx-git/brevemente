package com.syborx.brevemente.cita.domain.model;

import java.time.LocalDate;
import java.util.Collection;

/**
 * Filtros de listado de citas (todos opcionales).
 * {@code terapeutaIds} permite el filtrado multi-terapeuta del alcance por rol;
 * {@code terapeutaId} se conserva para el filtro puntual del request.
 */
public record CitaFiltro(
        String terapeutaId,
        String pacienteId,
        String consultorio,
        String modalidad,
        String estado,
        LocalDate desde,
        LocalDate hasta,
        Collection<String> terapeutaIds
) {}
