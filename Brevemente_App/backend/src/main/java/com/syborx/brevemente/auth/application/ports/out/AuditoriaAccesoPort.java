package com.syborx.brevemente.auth.application.ports.out;

import java.util.Set;

public interface AuditoriaAccesoPort {

    /** Registra un acceso de login: actualiza {@code last_login_at} y escribe {@code auditoria_accesos}. */
    void registrarLogin(String usuarioId, Set<String> roles, String ip);

    /**
     * Registra un intento de login fallido. Debe persistirse aunque la
     * transacción del caso de uso haga rollback (REQUIRES_NEW en el adaptador).
     *
     * @param usuarioId id si el correo corresponde a una identidad; {@code null} si no existe
     */
    void registrarIntentoFallido(String usuarioId, String email, String ip, String motivo);

    /** Registra un evento de sesión (LOGOUT, REFRESH_REUSE_DETECTED, ...). */
    void registrarEvento(String usuarioId, String accion, String ip, String detalle);
}
