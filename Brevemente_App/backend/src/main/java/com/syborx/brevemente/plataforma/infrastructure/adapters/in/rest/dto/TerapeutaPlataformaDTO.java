package com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto;

/**
 * Terapeuta listado para el dashboard de plataforma.
 *
 * @param id           identificador del terapeuta.
 * @param nombre       nombre de visualización (nombre + apellidos desde usuarios).
 * @param especialidad especialidad clínica registrada.
 * @param estado       "activo" o "inactivo".
 */
public record TerapeutaPlataformaDTO(
        String id,
        String nombre,
        String especialidad,
        String estado) {
}
