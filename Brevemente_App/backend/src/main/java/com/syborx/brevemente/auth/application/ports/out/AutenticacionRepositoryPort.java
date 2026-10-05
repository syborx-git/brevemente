package com.syborx.brevemente.auth.application.ports.out;

import com.syborx.brevemente.auth.domain.model.EstadoSesion;
import com.syborx.brevemente.auth.domain.model.Usuario;

import java.util.Optional;

public interface AutenticacionRepositoryPort {

    /** Identidad completa (roles + permisos efectivos) por correo, case-insensitive. */
    Optional<Usuario> findByEmail(String email);

    /** Identidad completa (roles + permisos efectivos) por id. */
    Optional<Usuario> findById(String usuarioId);

    /** Estado mínimo para validar un access token en cada petición. */
    Optional<EstadoSesion> findEstadoSesion(String usuarioId);

    /** Invalida todos los access tokens emitidos al usuario. */
    void incrementarTokenVersion(String usuarioId);
}
