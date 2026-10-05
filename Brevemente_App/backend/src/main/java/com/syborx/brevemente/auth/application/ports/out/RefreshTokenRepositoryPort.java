package com.syborx.brevemente.auth.application.ports.out;

import com.syborx.brevemente.auth.domain.model.RefreshToken;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepositoryPort {

    void guardar(RefreshToken token, String ip);

    Optional<RefreshToken> findByHash(String tokenHash);

    /** Revoca un token concreto; {@code replacedBy} enlaza la cadena de rotación. */
    void revocar(String tokenId, String replacedBy, Instant cuando);

    /** Revoca todos los refresh tokens vigentes del usuario. */
    void revocarTodosDeUsuario(String usuarioId, Instant cuando);
}
