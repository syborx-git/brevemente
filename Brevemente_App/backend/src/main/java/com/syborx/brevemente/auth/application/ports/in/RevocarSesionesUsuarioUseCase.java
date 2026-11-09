package com.syborx.brevemente.auth.application.ports.in;

/** Revocación administrativa de todas las sesiones de un usuario. */
public interface RevocarSesionesUsuarioUseCase {

    /**
     * Incrementa `token_version` y revoca todos los refresh tokens del usuario,
     * registrando el evento en auditoría. Consumido por el Módulo 2 (cambio de
     * rol/estado) y por el reset de contraseña.
     */
    void revocar(String usuarioId, String motivo, String actorId, String ip);
}
