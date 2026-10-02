package com.syborx.brevemente.auth.application.ports.out;

import com.syborx.brevemente.auth.domain.model.Usuario;

import java.util.Optional;

public interface AutenticacionRepositoryPort {

    Optional<Usuario> findByEmail(String email);
}
