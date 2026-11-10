package com.syborx.brevemente.paciente.application.ports.in;

import com.syborx.brevemente.auth.domain.model.PasswordTemporal;

/**
 * Genera (o restablece) la contraseña temporal de acceso al portal de un
 * paciente ya registrado. Si el paciente aún no tiene identidad de acceso,
 * la crea (rol patient) antes de generar la temporal.
 */
public interface GenerarPasswordTemporalPacienteUseCase {

    PasswordTemporal generarPasswordTemporal(String pacienteId);
}
