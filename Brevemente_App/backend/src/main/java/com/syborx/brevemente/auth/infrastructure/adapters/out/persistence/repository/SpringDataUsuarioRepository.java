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

    /** Proyección mínima para validar access tokens sin cargar el grafo de roles. */
    interface EstadoSesionView {
        Integer getTokenVersion();

        Boolean getActivo();
    }

    /**
     * Búsqueda case-insensitive que aprovecha el índice funcional
     * {@code ux_usuarios_email_lower} (LOWER(email)). Carga roles y permisos
     * en una sola consulta.
     */
    @Query("select distinct u from UsuarioJpaEntity u "
            + "left join fetch u.roles r left join fetch r.permisos "
            + "where lower(u.email) = lower(:email)")
    Optional<UsuarioJpaEntity> findByEmail(@Param("email") String email);

    @Query("select distinct u from UsuarioJpaEntity u "
            + "left join fetch u.roles r left join fetch r.permisos "
            + "where u.id = :id")
    Optional<UsuarioJpaEntity> findByIdWithPermisos(@Param("id") String id);

    @Query("select u.tokenVersion as tokenVersion, u.activo as activo from UsuarioJpaEntity u where u.id = :id")
    Optional<EstadoSesionView> findEstadoSesion(@Param("id") String id);

    /** Actualiza la marca de último acceso (login) del usuario. */
    @Modifying
    @Query(value = "UPDATE usuarios SET last_login_at = CURRENT_TIMESTAMP WHERE id = :usuarioId", nativeQuery = true)
    void updateLastLoginAt(@Param("usuarioId") String usuarioId);

    /** Invalida todos los access tokens emitidos al usuario. */
    @Modifying
    @Query(value = "UPDATE usuarios SET token_version = token_version + 1, updated_at = CURRENT_TIMESTAMP "
            + "WHERE id = :usuarioId", nativeQuery = true)
    void incrementTokenVersion(@Param("usuarioId") String usuarioId);
}
