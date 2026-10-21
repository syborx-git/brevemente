package com.syborx.brevemente.auth.application.ports.out;

/**
 * Puerto de salida que resuelve la cédula profesional (license) de un usuario
 * a partir del perfil profesional (terapeutas). Evita que el módulo `auth`
 * dependa de la entidad JPA del módulo `paciente`.
 */
public interface LicenseLookupPort {

    /** Cédula profesional (cedula_profesional) o {@code null} si no existe perfil. */
    String findLicenseByUsuarioId(String usuarioId);
}
