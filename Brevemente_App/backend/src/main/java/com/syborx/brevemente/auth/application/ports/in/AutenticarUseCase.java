package com.syborx.brevemente.auth.application.ports.in;

import com.syborx.brevemente.auth.domain.model.Usuario;

public interface AutenticarUseCase {

    /**
     * Valida credenciales aplicando el limitador de intentos y auditando
     * tanto el éxito como el fallo.
     */
    Usuario autenticar(String email, String password, String ip);
}
