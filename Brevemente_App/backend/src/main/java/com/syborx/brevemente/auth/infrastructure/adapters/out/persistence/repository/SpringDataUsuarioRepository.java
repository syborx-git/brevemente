package com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.entity.UsuarioJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SpringDataUsuarioRepository extends JpaRepository<UsuarioJpaEntity, String> {

    /**
     * Búsqueda case-insensitive que aprovecha el índice funcional
     * {@code ux_usuarios_email_lower} (LOWER(email)).
     */
    @Query("select u from UsuarioJpaEntity u left join fetch u.roles where lower(u.email) = lower(:email)")
    Optional<UsuarioJpaEntity> findByEmail(@Param("email") String email);

    /** Actualiza la marca de último acceso (login) del usuario. */
    @Modifying
    @Query(value = "UPDATE usuarios SET last_login_at = CURRENT_TIMESTAMP WHERE id = :usuarioId", nativeQuery = true)
    void updateLastLoginAt(@Param("usuarioId") String usuarioId);
}
