package com.syborx.brevemente.auth.application.ports.in;

import com.syborx.brevemente.auth.domain.model.PasswordTemporal;

/**
 * Genera una contraseña temporal de un solo uso y activa el flag
 * `debe_cambiar_password`. Consumido por el Módulo 2 (admin → staff) y el
 * módulo Pacientes (terapeuta → paciente).
 */
public interface GenerarPasswordTemporalUseCase {

    /**
     * @param usuarioId usuario objetivo (debe existir)
     * @param actorId   admin/terapeuta que ejecuta la acción
     * @param motivo    {@code ALTA} (cuenta nueva) o {@code RESET} (revoca sesiones)
     */
    PasswordTemporal generarPasswordTemporal(String usuarioId, String actorId, String motivo);
}
