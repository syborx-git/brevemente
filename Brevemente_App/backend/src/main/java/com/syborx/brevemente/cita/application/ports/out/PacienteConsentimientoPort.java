package com.syborx.brevemente.cita.application.ports.out;

/**
 * Consulta datos del paciente para aplicar reglas del módulo cita
 * (bloqueo normativo y pertenencia al terapeuta) sin acoplar el módulo
 * {@code cita} a la entidad JPA de {@code paciente}.
 */
public interface PacienteConsentimientoPort {
    boolean estaBloqueadoPorNormativa(String pacienteId);

    /**
     * Devuelve el ID del terapeuta dueño del paciente ({@code pacientes.terapeuta_id}),
     * o {@code null} si el paciente no existe o no tiene terapeuta asignado.
     */
    String terapeutaIdDePaciente(String pacienteId);
}
