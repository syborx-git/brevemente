package com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.entity.RefreshTokenJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface SpringDataRefreshTokenRepository extends JpaRepository<RefreshTokenJpaEntity, String> {

    Optional<RefreshTokenJpaEntity> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update RefreshTokenJpaEntity t set t.revokedAt = :cuando, t.replacedBy = :replacedBy "
            + "where t.id = :id and t.revokedAt is null")
    void revocar(@Param("id") String id, @Param("replacedBy") String replacedBy, @Param("cuando") OffsetDateTime cuando);

    @Modifying
    @Query("update RefreshTokenJpaEntity t set t.revokedAt = :cuando "
            + "where t.usuarioId = :usuarioId and t.revokedAt is null")
    void revocarTodosDeUsuario(@Param("usuarioId") String usuarioId, @Param("cuando") OffsetDateTime cuando);
}
