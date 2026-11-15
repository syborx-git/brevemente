package com.syborx.brevemente.paciente.application.ports.out;

/**
 * Crea y consulta la identidad de acceso (usuarios + rol patient) de un
 * paciente para habilitar su ingreso al portal.
 */
public interface IdentidadPacientePort {

    /**
     * Indica si ya existe un usuario con el correo indicado (insensible a mayúsculas).
     */
    boolean existeEmail(String email);

    /**
     * Crea la identidad en {@code usuarios} (rol {@code patient}) y devuelve el
     * ID de usuario generado.
     */
    String crearIdentidad(String email, String nombre, String apellidos);
}
