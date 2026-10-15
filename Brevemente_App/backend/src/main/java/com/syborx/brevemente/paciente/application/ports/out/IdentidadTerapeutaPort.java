package com.syborx.brevemente.paciente.application.ports.out;

import java.util.List;

/**
 * Abstrae la lectura de la identidad autenticada para el módulo paciente
 * (sin acoplar a Spring Security). Puerto propio del módulo (ADR-001).
 */
public interface IdentidadTerapeutaPort {

    /** Identificador de sujeto (claim {@code sub}). */
    String sub();

    /** Terapeutas vinculados al usuario autenticado. */
    List<String> terapeutaIds();

    /** Indica si el principal tiene el rol indicado (sin prefijo {@code ROLE_}). */
    boolean tieneRol(String rol);
}
