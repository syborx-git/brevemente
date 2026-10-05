package com.syborx.brevemente.auth.domain.model;

import java.time.Instant;

/**
 * Refresh token persistido. Solo se conoce su hash (SHA-256); el valor en claro
 * únicamente existe en la cookie HttpOnly del cliente.
 */
public record RefreshToken(
        String id,
        String usuarioId,
        String tokenHash,
        Instant expiresAt,
        Instant revokedAt,
        String replacedBy
) {

    public boolean revocado() {
        return revokedAt != null;
    }

    public boolean expirado(Instant ahora) {
        return !ahora.isBefore(expiresAt);
    }
}
