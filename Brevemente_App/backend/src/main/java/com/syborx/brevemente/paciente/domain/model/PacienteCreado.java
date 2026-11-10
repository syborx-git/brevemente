package com.syborx.brevemente.paciente.domain.model;

/**
 * Resultado del alta de paciente: el registro clínico y la contraseña temporal
 * de acceso al portal (visible una sola vez).
 */
public record PacienteCreado(Paciente paciente, String passwordTemporal) {
}
