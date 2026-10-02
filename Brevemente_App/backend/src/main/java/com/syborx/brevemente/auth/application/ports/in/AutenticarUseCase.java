package com.syborx.brevemente.auth.application.ports.in;

import com.syborx.brevemente.auth.domain.model.Usuario;

public interface AutenticarUseCase {

    Usuario autenticar(String email, String password);
}
