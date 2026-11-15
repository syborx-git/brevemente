package com.syborx.brevemente.portalpaciente.application.ports.out;

/**
 * Abstrae la identidad autenticada para el portal del paciente sin acoplar
 * el módulo a Spring Security.
 */
public interface IdentidadPortalPort {
    String pacienteId();
    boolean tieneRol(String rol);
}
