package com.syborx.brevemente.auth.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.auth.application.ports.out.RefreshTokenRepositoryPort;
import com.syborx.brevemente.auth.domain.model.RefreshToken;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.entity.RefreshTokenJpaEntity;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository.SpringDataRefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class RefreshTokenPersistenceAdapter implements RefreshTokenRepositoryPort {

    private final SpringDataRefreshTokenRepository repository;

    @Override
    public void guardar(RefreshToken token, String ip) {
        repository.save(RefreshTokenJpaEntity.builder()
                .id(token.id())
                .usuarioId(token.usuarioId())
                .tokenHash(token.tokenHash())
                .expiresAt(toOffset(token.expiresAt()))
                .revokedAt(toOffset(token.revokedAt()))
                .replacedBy(token.replacedBy())
                .createdIp(truncate(ip, 64))
                .build());
    }

    @Override
    public Optional<RefreshToken> findByHash(String tokenHash) {
        return repository.findByTokenHash(tokenHash).map(e -> new RefreshToken(
                e.getId(),
                e.getUsuarioId(),
                e.getTokenHash(),
                e.getExpiresAt().toInstant(),
                e.getRevokedAt() != null ? e.getRevokedAt().toInstant() : null,
                e.getReplacedBy()));
    }

    @Override
    public void revocar(String tokenId, String replacedBy, Instant cuando) {
        repository.revocar(tokenId, replacedBy, toOffset(cuando));
    }

    @Override
    public void revocarTodosDeUsuario(String usuarioId, Instant cuando) {
        repository.revocarTodosDeUsuario(usuarioId, toOffset(cuando));
    }

    private static OffsetDateTime toOffset(Instant instant) {
        return instant == null ? null : instant.atOffset(ZoneOffset.UTC);
    }

    private static String truncate(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }
}
