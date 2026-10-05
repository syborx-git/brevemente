package com.syborx.brevemente.auth.application.ports.in;

import com.syborx.brevemente.auth.domain.model.Usuario;

/**
 * Ciclo de vida de la sesión: emisión/rotación de refresh tokens, cierre de
 * sesión con revocación real y consulta de la identidad vigente.
 */
public interface GestionarSesionUseCase {

    /** Resultado de una renovación: identidad actualizada + nuevo refresh token en claro. */
    record SesionRenovada(Usuario usuario, String refreshToken) {
    }

    /** Emite un refresh token nuevo y devuelve su valor en claro (solo viaja en cookie). */
    String emitirRefreshToken(String usuarioId, String ip);

    /**
     * Rota el refresh token. Si se presenta un token ya revocado (reutilización),
     * se asume robo: se revocan todas las sesiones del usuario.
     */
    SesionRenovada renovar(String refreshToken, String ip);

    /**
     * Cierra la sesión: revoca refresh tokens e invalida access tokens
     * (incremento de token_version). Idempotente.
     *
     * @param refreshToken          valor de la cookie (puede ser null)
     * @param usuarioIdAutenticado  sujeto del access token (puede ser null)
     */
    void cerrarSesion(String refreshToken, String usuarioIdAutenticado, String ip);

    /** Identidad vigente (roles y permisos frescos desde BD). */
    Usuario obtenerUsuario(String usuarioId);
}
