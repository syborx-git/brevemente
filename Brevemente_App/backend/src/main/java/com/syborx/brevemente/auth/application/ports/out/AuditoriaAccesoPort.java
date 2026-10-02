package com.syborx.brevemente.auth.application.ports.out;

import java.util.Set;

public interface AuditoriaAccesoPort {

    /** Registra un acceso de login: actualiza {@code last_login_at} y escribe {@code auditoria_accesos}. */
    void registrarLogin(String usuarioId, Set<String> roles);
}
