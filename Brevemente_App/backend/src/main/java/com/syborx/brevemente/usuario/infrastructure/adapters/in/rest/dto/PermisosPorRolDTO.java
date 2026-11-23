package com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto;

import java.util.List;

/**
 * Permisos derivados de un rol de plataforma (solo lectura).
 *
 * @param rol      código del rol (p. ej. "therapist").
 * @param permisos códigos de permisos asignados al rol.
 */
public record PermisosPorRolDTO(String rol, List<String> permisos) {
}
