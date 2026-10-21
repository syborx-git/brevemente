package com.syborx.brevemente.auth.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Set;

/**
 * Modelo de dominio puro (sin anotaciones JPA ni Spring) para la identidad
 * autenticada. Separa la IDENTIDAD (usuarios) del PERFIL PROFESIONAL (terapeutas).
 */
@Getter
@Builder
@AllArgsConstructor
public class Usuario {

    private final String id;
    /** Nombre compuesto: nombre + apellidos. */
    private final String nombre;
    private final String email;
    /** Hash BCrypt de la contraseña. */
    private final String passwordHash;
    /** Códigos de rol (multi-rol): therapist, supervisor, admin_clinical, ... */
    private final Set<String> roles;
    /** Permisos efectivos: unión de los permisos de todos sus roles (PACIENTES_LEER, ...). */
    private final Set<String> permissions;
    /** Cédula profesional (solo therapist; null para el resto de roles). */
    private final String license;
    /** Terapeutas sobre los que opera la agenda (therapist → su id; assistant → terapeutas asignados). */
    private final List<String> terapeutaIds;
    /** Paciente vinculado (solo rol patient). */
    private final String pacienteId;
    private final boolean activo;
    /** Versión vigente de tokens; al incrementarse invalida todos los access tokens emitidos. */
    private final int tokenVersion;

    public boolean tieneRol(String codigo) {
        return roles != null && roles.contains(codigo);
    }

    public boolean tienePermiso(String codigo) {
        return permissions != null && permissions.contains(codigo);
    }
}
