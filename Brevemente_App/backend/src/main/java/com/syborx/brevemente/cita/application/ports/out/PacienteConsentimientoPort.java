package com.syborx.brevemente.cita.application.ports.out;

/**
 * Consulta el consentimiento de un paciente para aplicar la regla
 * "Bloqueada por Normativa" sin acoplar el módulo `cita` a la entidad JPA de `paciente`.
 */
public interface PacienteConsentimientoPort {
    boolean estaBloqueadoPorNormativa(String pacienteId);
}
