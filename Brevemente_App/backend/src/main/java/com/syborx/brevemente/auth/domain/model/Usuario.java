package com.syborx.brevemente.auth.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

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
    /** Cédula profesional (solo therapist; null para el resto de roles). */
    private final String license;
    private final boolean activo;

    public boolean tieneRol(String codigo) {
        return roles != null && roles.contains(codigo);
    }
}
